import myAssert from '@/utils/myAssert';
import createEventManager from '@alova/shared/createEventManager';
import { JSONParse, JSONStringify, deleteAttr } from '@alova/shared/vars';
import { AlovaDefaultCacheAdapter, CacheEvent } from '~/typings';

// local storage will not fail the operation.
const EVENT_SUCCESS_KEY = 'success';
type CacheEventRecord = {
  success: CacheEvent;
  fail: Omit<CacheEvent, 'value'>;
};
export const memoryAdapter = () => {
  let l1Cache = {} as Record<string, any>;
  const l1CacheEmitter = createEventManager<CacheEventRecord>();
  const adapter: AlovaDefaultCacheAdapter = {
    set(key, value) {
      l1Cache[key] = value;
      l1CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'set', key, value, container: l1Cache });
    },
    get: key => {
      const value = l1Cache[key];
      l1CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'get', key, value, container: l1Cache });
      return value;
    },
    remove(key) {
      deleteAttr(l1Cache, key);
      l1CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'remove', key, container: l1Cache });
    },
    clear: () => {
      l1Cache = {};
      l1CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'clear', key: '', container: l1Cache });
    },
    emitter: l1CacheEmitter
  };
  return adapter;
};

const // delay get localStorage by function, and avoid erroring at initialization
  storage = () => {
    myAssert(typeof localStorage !== 'undefined', 'l2Cache is not defined.');
    return localStorage;
  };
export const localStorageAdapter = () => {
  const l2CacheEmitter = createEventManager<CacheEventRecord>();
  const adapter: AlovaDefaultCacheAdapter = {
    set: (key, value) => {
      storage().setItem(key, JSONStringify(value));
      l2CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'set', key, value, container: storage() });
    },
    get: key => {
      const data = storage().getItem(key);
      const value = data ? JSONParse(data) : data;
      l2CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'get', key, value, container: storage() });
      return value;
    },
    remove: key => {
      storage().removeItem(key);
      l2CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'remove', key, container: storage() });
    },
    clear: () => {
      storage().clear();
      l2CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'clear', key: '', container: storage() });
    },
    emitter: l2CacheEmitter
  };
  return adapter;
};
