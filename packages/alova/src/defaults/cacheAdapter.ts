import myAssert from '@/utils/myAssert';
import {
  createEventManager,
  deleteAttr,
  falseValue,
  isAlovaCacheKey,
  JSONParse,
  JSONStringify,
  undefinedValue
} from '@alova/shared';
import { AlovaDefaultCacheAdapter, AlovaGlobalCacheAdapter, CacheEvent } from '~/typings';

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

export const localStorageAdapter = () => {
  const l2CacheEmitter = createEventManager<CacheEventRecord>();
  const instance = localStorage;
  const adapter: AlovaDefaultCacheAdapter = {
    set: (key, value) => {
      instance.setItem(key, JSONStringify(value));
      l2CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'set', key, value, container: instance });
    },
    get: key => {
      const data = instance.getItem(key);
      const value = data ? JSONParse(data) : data;
      l2CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'get', key, value, container: instance });
      return value;
    },
    remove: key => {
      instance.removeItem(key);
      l2CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'remove', key, container: instance });
    },
    clear: () => {
      // Only remove alova cache keys
      for (let i = instance.length - 1; i >= 0; i -= 1) {
        const key = instance.key(i);
        if (key && isAlovaCacheKey(key)) {
          instance.removeItem(key);
        }
      }
      l2CacheEmitter.emit(EVENT_SUCCESS_KEY, { type: 'clear', key: '', container: instance });
    },
    emitter: l2CacheEmitter
  };
  return adapter;
};

export const placeholderAdapter = () => {
  const l2CacheNotDefinedAssert = () => {
    myAssert(falseValue, 'l2Cache is not defined.');
  };
  return <AlovaGlobalCacheAdapter>{
    set: () => {
      l2CacheNotDefinedAssert();
    },
    get: () => {
      l2CacheNotDefinedAssert();
      return undefinedValue;
    },
    remove: () => {
      l2CacheNotDefinedAssert();
    },
    clear: () => {}
  };
};
