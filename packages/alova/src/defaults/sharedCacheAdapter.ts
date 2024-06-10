/* eslint-disable prettier/prettier */
import myAssert from '@/utils/myAssert';
import { QueueCallback } from '@/utils/queueCallback';
import { isPlainObject, uuid } from '@alova/shared/function';
import { deleteAttr, objectKeys } from '@alova/shared/vars';
import { AlovaGlobalCacheAdapter } from '~/typings';
import { createDefaultL1CacheAdapter } from './cacheAdapter';

export type SharedCacheEvent = {
  scope?: string;
  senderID: string;
  type: 'set' | 'get' | 'remove' | 'clear' | 'init';
  key: string;
  value?: any;
};

export interface AlovaSharedCacheAdapterOptions {
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

// just a helper for providing type
export const createSyncAdapter = (syncAdapter: SyncAdapter) => syncAdapter;

/**
 * This class re-implements the cacheAdapter. It will:
 * 1. Pull the latest cache from synchronizer at the beginning.
 * 2. Emit an event when the status changes.
 * 3. Proxy the behavior of the incoming cacheAdapter.
 */
export class AlovaDefaultSharedCacheAdapter implements AlovaGlobalCacheAdapter {
  protected id = uuid();

  protected queue = new QueueCallback();

  constructor(
    protected cacheAdapter: AlovaGlobalCacheAdapter,
    protected syncAdapter: SyncAdapter,
    protected options: AlovaSharedCacheAdapterOptions
  ) {
    const cacheEventHandlers = {
      set: (key: string, value?: any) => this.cacheAdapter.set(key, value),
      get: (key: string) => this.cacheAdapter.get(key),
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
    // use callback to ensure the sequence of operation
    this.queue.queueCallback(() => {
      this.syncAdapter.send({
        scope: this.options.scope,
        senderID: this.id,
        type,
        key: key ?? '',
        value
      });
    });
  }

  /**
   * Triggered when received a sync response from the server is received
   */
  protected init(value: any) {
    myAssert(!!value, 'Value should be an object in init event');

    const data: Record<string, any> = isPlainObject(value) ? value : JSON.parse(value);

    // It's no way to set up the entire cache of AlovaCache
    // We have to add it one by one manually...
    objectKeys(data).forEach(key => {
      this.cacheAdapter.set(key, data[key]);
    });
  }

  set(key: string, value: any) {
    this.syncCache('set', key, value);
    return this.cacheAdapter.set(key, value);
  }

  get<T>(key: string) {
    return this.cacheAdapter.get<T>(key);
  }

  remove(key: string) {
    this.syncCache('remove', key);
    return this.cacheAdapter.remove(key);
  }

  clear() {
    this.syncCache('clear');
    this.cacheAdapter.clear();
  }
}

/**
 * Same as AlovaGlobalCacheAdapter but expose cache object.
 */
export class ExplictCacheAdapter implements AlovaGlobalCacheAdapter {
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
 * createDefaultSharedCacheAdapter(
 *   ElectronSyncAdapter(),
 *   // ...
 * )
 *
 * // in Node.js
 * createDefaultSharedCacheAdapter(
 *   NodeSyncAdapter(),
 *   // ...
 * )
 * ```
 */
export function createDefaultSharedCacheAdapter(
  syncAdapter: SyncAdapter,
  cacheAdapter: AlovaGlobalCacheAdapter = createDefaultL1CacheAdapter(),
  options: AlovaSharedCacheAdapterOptions = {}
) {
  return new AlovaDefaultSharedCacheAdapter(cacheAdapter, syncAdapter, options);
}

export function createSharedCacheSynchronizer(syncAdapter: SyncAdapter) {
  const cache = new ExplictCacheAdapter();
  const cacheEventHandlers = {
    set: (key: string, value?: any) => cache.set(key, value),
    get: () => {},
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
