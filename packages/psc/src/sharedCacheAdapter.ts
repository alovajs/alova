/* eslint-disable prettier/prettier */
import { createAssert } from '@alova/shared/assert';
import { isPlainObject, usePromise, uuid } from '@alova/shared/function';
import { QueueCallback } from '@alova/shared/queueCallback';
import { deleteAttr, objectKeys } from '@alova/shared/vars';
import { AlovaGlobalCacheAdapter } from 'alova';

export type SharedCacheEvent = {
  scope?: string;
  senderID: string;
  type: 'set' | 'remove' | 'clear' | 'init';
  key: string;
  value?: any;
};

export interface ProcessSharedCacheAdapterOptions {
  scope?: string;
}

export type SharedEventHandler = (
  event: SharedCacheEvent,
  replyFn?: (event: SharedCacheEvent) => void | Promise<void>
) => void | Promise<void>;

export interface SyncAdapter {
  send(event: SharedCacheEvent): void | Promise<void>;
  receive(handler: SharedEventHandler): void;
}

const myAssert = createAssert('Shared Cache');

// just a helper for providing type
export const createSyncAdapter = (syncAdapter: SyncAdapter) => syncAdapter;

/**
 * This class re-implements the cacheAdapter. It will:
 * 1. Pull the latest cache from synchronizer at the beginning.
 * 2. Emit an event when the status changes.
 * 3. Proxy the behavior of the incoming cacheAdapter.
 */
export class ProcessSharedCacheAdapter implements AlovaGlobalCacheAdapter {
  protected id = uuid();

  protected queue = new QueueCallback();

  constructor(
    protected cacheAdapter: AlovaGlobalCacheAdapter,
    protected syncAdapter: SyncAdapter,
    protected options: ProcessSharedCacheAdapterOptions
  ) {
    const cacheEventHandlers = {
      set: (key: string, value?: any) => this.cacheAdapter.set(key, value),
      remove: (key: string) => this.cacheAdapter.remove(key),
      clear: () => this.cacheAdapter.clear(),
      init: (key: string, value: any) => this.init(value)
    } as const;

    /**
     * Register the onPatch event handler to synchronize cache updates.
     * It maps the received cache event to the corresponding method in the cache adapter.
     */
    this.syncAdapter.receive(event => {
      const { scope, senderID, type, key, value } = event;

      // if the event is sent from different scope or sent by self, no nothing
      if (senderID === this.id || scope !== this.options.scope) {
        return;
      }

      cacheEventHandlers[type](key, value);
    });

    // request cache sync from the server.
    this.syncCache('init');
  }

  /**
   * Synchronize cache updates by queuing the onSync callback in the QueueCallback.
   * It ensures the sequence of operations.
   * @param type The type of cache event.
   * @param key The cache key.
   * @param value The cache value.
   */
  protected syncCache(type: SharedCacheEvent['type'], key?: string, value?: any) {
    const { promise, resolve } = usePromise();

    // use callback to ensure the sequence of operation
    this.queue.queueCallback(() => {
      resolve(
        this.syncAdapter.send({
          scope: this.options.scope,
          senderID: this.id,
          type,
          key: key ?? '',
          value
        })
      );
    });

    return promise;
  }

  /**
   * Triggered when received a sync response from the server is received
   */
  protected init(value: any) {
    myAssert(!!value, 'Value should be an object in init event');

    // clear the cache before init
    this.cacheAdapter.clear();
    const data: Record<string, any> = isPlainObject(value) ? value : JSON.parse(value);

    // It's no way to set up the entire cache of AlovaCache
    // We have to add it one by one manually...
    objectKeys(data).forEach(key => {
      this.cacheAdapter.set(key, data[key]);
    });
  }

  async set(key: string, value: any) {
    await this.cacheAdapter.set(key, value);
    return this.syncCache('set', key, value);
  }

  get<T>(key: string) {
    return this.cacheAdapter.get<T>(key);
  }

  async remove(key: string) {
    await this.cacheAdapter.remove(key);
    return this.syncCache('remove', key);
  }

  async clear() {
    await this.cacheAdapter.clear();
    return this.syncCache('clear');
  }
}

/**
 * Same as AlovaGlobalCacheAdapter but expose cache object.
 */
export class ExplicitCacheAdapter implements AlovaGlobalCacheAdapter {
  protected cache: Record<string, any> = {};

  set(key: string, value: any) {
    this.cache[key] = value;
  }

  get<T>(key: string) {
    const value = this.cache[key];
    return value as T;
  }

  remove(key: string) {
    deleteAttr(this.cache, key);
  }

  clear() {
    this.cache = {};
  }

  getCache() {
    return this.cache;
  }
}

/**
 * Create shared cache adapter using default L1CacheAdapter
 * @example
 * ```typescript
 * // in Electron
 * createPSCAdapter(
 *   ElectronSyncAdapter(),
 *   // ...
 * )
 *
 * // in Node.js
 * createPSCAdapter(
 *   NodeSyncAdapter(),
 *   // ...
 * )
 * ```
 */
export function createProcessSharedCacheAdapter(
  syncAdapter: SyncAdapter,
  cacheAdapter: AlovaGlobalCacheAdapter = new ExplicitCacheAdapter(),
  options: ProcessSharedCacheAdapterOptions = {}
) {
  return new ProcessSharedCacheAdapter(cacheAdapter, syncAdapter, options);
}

export function createProcessSharedCacheSynchronizer(syncAdapter: SyncAdapter) {
  const cache = new ExplicitCacheAdapter();
  const cacheEventHandlers = {
    set: (key: string, value?: any) => cache.set(key, value),
    remove: (key: string) => cache.remove(key),
    clear: () => cache.clear(),
    init: () => {}
  } as const;
  syncAdapter.receive((event, replyFn) => {
    const { scope, type, key, value } = event;

    cacheEventHandlers[type](key, value);

    let newEvent = event;

    if (type === 'init') {
      newEvent = {
        scope,
        senderID: '',
        type: 'init',
        key: '',
        value: JSON.stringify(cache.getCache())
      };

      // Transferring the entire cache is expensive
      // If a function is provided that responds to the client, use it
      // otherwise we fall back to broadcast
      (replyFn ?? syncAdapter.send)(newEvent);
      return;
    }

    syncAdapter.send(newEvent);
  });
}

// shorter alias
/**
 * Alias of `ProcessSharedCacheAdapter`
 */
export const PSCAdapter = ProcessSharedCacheAdapter;
/**
 * Alias of `createProcessSharedCacheAdapter`
 */
export const createPSCAdapter = createProcessSharedCacheAdapter;
/**
 * Alias of `createProcessSharedCacheSynchronizer`
 */
export const createPSCSynchronizer = createProcessSharedCacheSynchronizer;
