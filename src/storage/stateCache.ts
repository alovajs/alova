import { FrontRequestState } from '../../typings';
import { undefinedValue } from '../utils/variables';

// 状态数据缓存
const stateCache: Record<string, Record<string, FrontRequestState>> = {};

/**
 * @description 获取State缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @returns 缓存的响应数据，如果没有则返回undefined
 */
export const getStateCache = (namespace: string, key: string) => {
  const cachedState = stateCache[namespace];
  if (!cachedState) {
    return undefinedValue;
  }
  return cachedState[key];
}

/**
 * @description 设置State缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @param data 缓存数据
 */
export const setStateCache = (namespace: string, key: string, data: FrontRequestState) => {
  console.log(key, data);
  const cachedState = stateCache[namespace] = stateCache[namespace] || {};
  cachedState[key] = data;
}

/**
 * @description 清除State缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 */
export const removeStateCache = (namespace: string, key: string) => {
  const cachedState = stateCache[namespace];
  if (cachedState) {
    delete cachedState[key];
  }
}