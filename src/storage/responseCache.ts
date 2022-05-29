import { RequestState } from '../../typings';
import { getTime } from '../utils/helper';

// 响应数据缓存
const responseCache: Record<string, Record<string, [
  data: any,
  expireTime?: Date,
]>> = {};

/**
 * @description 获取Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @returns 缓存的响应数据，如果没有则返回undefined
 */
export function getResponseCache(namespace: string, baseURL: string, key: string) {
  const cachedResponse = responseCache[namespace + baseURL];
  if (!cachedResponse) {
    return undefined;
  }
  const cachedItem = cachedResponse[key];
  if (cachedItem) {
    const [ data, expireTime ] = cachedItem;
    // 如果没有过期时间则表示数据永不过期，否则需要判断是否过期
    if (!expireTime || getTime(expireTime) > getTime()) {
      return data;
    }
    // 如果过期，则删除缓存
    delete cachedResponse[key];
  }
}

/**
 * @description 设置Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @param data 缓存数据
 * @param staleMilliseconds 过期时间，单位毫秒
 */
export function setResponseCache(namespace: string, baseURL: string, key: string, data: any, staleMilliseconds = 0) {
  // 小于0则不缓存了
  if (staleMilliseconds <= 0) {
    return;
  }
  const parentKey = namespace + baseURL;
  const cachedResponse = responseCache[parentKey] = responseCache[parentKey] || {};
  cachedResponse[key] = [
    data,
    staleMilliseconds === Infinity ? undefined : new Date(getTime() + staleMilliseconds),
  ];
}

/**
 * @description 清除Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 */
export function removeResponseCache(namespace: string, baseURL: string, key: string) {
  const cachedResponse = responseCache[namespace + baseURL];
  if (cachedResponse) {
    delete cachedResponse[key];
  }
}



// 状态数据缓存
const stateCache: Record<string, Record<string, RequestState<any>>> = {};

/**
 * @description 获取State缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @returns 缓存的响应数据，如果没有则返回undefined
 */
export function getStateCache(baseURL: string, key: string) {
  const cachedState = stateCache[baseURL];
  if (!cachedState) {
    return undefined;
  }
  return cachedState[key];
}

/**
 * @description 设置State缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @param data 缓存数据
 */
export function setStateCache(baseURL: string, key: string, data: RequestState<any>) {
  const cachedState = stateCache[baseURL] = stateCache[baseURL] || {};
  cachedState[key] = data;
}

/**
 * @description 清除State缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 */
export function removeStateCache(baseURL: string, key: string) {
  const cachedState = stateCache[baseURL];
  if (cachedState) {
    delete cachedState[key];
  }
}