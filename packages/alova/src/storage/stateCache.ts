import { deleteAttr } from '@/utils/variables';
import { FrontRequestState, Hook } from '~/typings';

// 状态数据缓存
type CacheItem = {
  s: FrontRequestState;
  h: Hook;
};
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
export const setStateCache = (namespace: string, key: string, data: FrontRequestState, hookInstance: Hook) => {
  const cachedState = (stateCache[namespace] = stateCache[namespace] || {});
  cachedState[key] = {
    s: data,
    h: hookInstance
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
