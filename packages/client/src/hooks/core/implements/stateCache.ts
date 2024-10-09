import { deleteAttr } from '@alova/shared/vars';
import type { MergedStatesMap } from 'alova';
import { Hook } from '~/typings/clienthook';

// 状态数据缓存
interface CacheItem {
  s: MergedStatesMap;
  h: Hook;
}
const stateCache: Record<string, Record<string, CacheItem>> = {};

/**
 * @description 获取State缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @returns 缓存的响应数据，如果没有则返回{}
 */
export const getStateCache = (namespace: string, key: string) => {
  const cachedState = stateCache[namespace] || {};
  return cachedState[key] || {};
};

/**
 * @description 设置State缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @param data 缓存数据
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
 * @description 清除State缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 */
export const removeStateCache = (namespace: string, key: string) => {
  const cachedState = stateCache[namespace];
  if (cachedState) {
    deleteAttr(cachedState, key);
  }
};
