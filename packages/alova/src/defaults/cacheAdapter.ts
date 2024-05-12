import myAssert from '@/utils/myAssert';
import { JSONParse, JSONStringify, deleteAttr } from '@alova/shared/vars';
import { AlovaGlobalCacheAdapter } from '~/typings';

let l1Cache = {} as Record<string, any>;
export const defaultL1CacheAdapter = {
  set(key, value) {
    l1Cache[key] = value;
  },
  get: key => l1Cache[key],
  remove(key) {
    deleteAttr(l1Cache, key);
  },
  clear: () => {
    l1Cache = {};
  }
} as AlovaGlobalCacheAdapter;

const // delay get localStorage by function, and avoid erroring at initialization
  storage = () => {
    myAssert(typeof localStorage !== 'undefined', 'l2Cache is not defined.');
    return localStorage;
  };
export const defaultL2CacheAdapter = {
  set: (key, value) => storage().setItem(key, JSONStringify(value)),
  get: key => {
    const data = storage().getItem(key);
    return data ? JSONParse(data) : data;
  },
  remove: key => storage().removeItem(key),
  clear: () => storage().clear()
} as AlovaGlobalCacheAdapter;
