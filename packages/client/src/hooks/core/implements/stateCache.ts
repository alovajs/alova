import { deleteAttr } from '@alova/shared';
import type { MergedStatesMap } from 'alova';
import { Hook } from '~/typings/clienthook';

// State data cache
interface CacheItem {
  s: MergedStatesMap;
  h: Hook;
}
const stateCache: Record<string, Record<string, CacheItem>> = {};

/**
 * @description Get State cache data
 * @param baseURL Base URL
 * @param key Request key value
 * @returns Cached response data, if not returned {}
 */
export const getStateCache = (namespace: string, key: string) => {
  const cachedState = stateCache[namespace] || {};
  return cachedState[key] || {};
};

/**
 * @description Set State cache data
 * @param baseURL Base URL
 * @param key Request key value
 * @param data cache data
 */
export const setStateCache = <Args extends any[] = any[]>(
  namespace: string,
  key: string,
  data: MergedStatesMap,
  hookInstance: Hook<Args>
) => {
  const cachedState = (stateCache[namespace] = stateCache[namespace] || {});
  cachedState[key] = {
    s: data,
    h: hookInstance as Hook<any>
  };
};

/**
 * @description Clear State cache data
 * @param baseURL Base URL
 * @param key Request key value
 */
export const removeStateCache = (namespace: string, key: string) => {
  const cachedState = stateCache[namespace];
  if (cachedState) {
    deleteAttr(cachedState, key);
  }
};
