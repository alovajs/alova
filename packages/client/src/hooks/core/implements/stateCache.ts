import { deleteAttr, newInstance } from '@alova/shared';
import { Hook } from '~/typings/clienthook';

type Key = string | number | symbol;
const stateCache: Record<Key, Record<Key, Set<Hook<any>>>> = {};

/**
 * @description Get State cache data
 * @param baseURL Base URL
 * @param key Request key value
 * @returns Cached response data, if not returned {}
 */
export const getStateCache = (namespace: string, key: Key) => {
  const cachedState = stateCache[namespace] || {};
  return cachedState[key] ? Array.from(cachedState[key]) : [];
};

/**
 * @description Set State cache data
 * @param baseURL Base URL
 * @param key Request key value
 * @param data cache data
 */
export const setStateCache = <Args extends any[] = any[]>(namespace: string, key: Key, hookInstance: Hook<Args>) => {
  const cachedState = (stateCache[namespace] = stateCache[namespace] || {});
  if (!cachedState[key]) {
    cachedState[key] = newInstance(Set<Hook<any>>);
  }
  cachedState[key].add(hookInstance);
};

/**
 * @description Clear State cache data
 * @param baseURL Base URL
 * @param key Request key value
 */
export const removeStateCache = <Args extends any[] = any[]>(
  namespace: string,
  key: Key,
  hookInstance?: Hook<Args>
) => {
  const cachedState = stateCache[namespace];
  const hookSet = cachedState[key];
  if (cachedState && hookSet) {
    hookInstance ? hookSet.delete(hookInstance) : hookSet.clear();
    if (hookSet.size === 0) {
      deleteAttr(cachedState, key);
    }
  }
};
