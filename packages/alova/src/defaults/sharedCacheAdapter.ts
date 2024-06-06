/* eslint-disable prettier/prettier */
import { QueueCallback } from '@/utils/queueCallback';
import { isPlainObject, uuid } from '@alova/shared/function';
import { deleteAttr, objectKeys } from '@alova/shared/vars';
import { AlovaGlobalCacheAdapter } from '~/typings';

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

interface SyncAdapter {
  send(event: SharedCacheEvent): void | Promise<void>;
  receive(handler: SharedEventHandler): void;
}

export const createSyncAdapter = (syncAdapter: SyncAdapter) => syncAdapter;

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

  protected init(value: any) {
    if (!value) {
      console.error('value should be an object');
      return;
    }

    const data: Record<string, any> = isPlainObject(value) ? value : JSON.parse(value);

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
 * @example
 * ```typescript
 * createDefaultSharedCacheAdapter(
 *   createDefaultL1CacheAdapter(),
 *   ElectronSyncAdapter()
 * )
 * ```
 */
export function createDefaultSharedCacheAdapter(
  cacheAdapter: AlovaGlobalCacheAdapter,
  syncAdapter: SyncAdapter,
  options: AlovaSharedCacheAdapterOptions
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
    }

    (replyFn ?? syncAdapter.send)(newEvent);
  });
}
