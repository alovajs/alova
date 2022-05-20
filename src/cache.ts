import { RequestState } from '../typings';

// 响应数据缓存
const responseCache: Record<string, Record<string, {
  data: any,
  expireTime: Date,
}>> = {};

/**
 * @description 获取Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @returns 缓存的响应数据，如果没有则返回undefined
 */
export function getResponseCache(baseURL: string, key: string) {
  const cachedResponse = responseCache[baseURL];
  if (!cachedResponse) {
    return undefined;
  }

  const cachedItem = cachedResponse[key];
  if (cachedItem) {
    const { data, expireTime } = cachedItem;
    if (expireTime.getTime() > Date.now()) {
      return data;
    } else {
      // 如果过期，则删除缓存
      delete cachedResponse[key];
    }
  }
}

/**
 * @description 设置Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @param data 缓存数据
 * @param staleMilliseconds 过期时间，单位毫秒
 */
export function setResponseCache(baseURL: string, key: string, data: unknown, staleMilliseconds = 0) {
  // 小于0则不缓存了
  if (staleMilliseconds <= 0) {
    return;
  }
  const cachedResponse = responseCache[baseURL] = responseCache[baseURL] || {};
  cachedResponse[key] = {
    data,
    expireTime: new Date(Date.now() + staleMilliseconds),
  };
}

/**
 * @description 清除Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 */
export function removeResponseCache(baseURL: string, key: string) {
  const cachedResponse = responseCache[baseURL];
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