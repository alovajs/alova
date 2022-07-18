import { getTime, undefinedValue } from '../utils/variables';

// 响应数据缓存
let responseCache: Record<string, Record<string, [
  data: any,
  expireTime?: Date,
]>> = {};

/**
 * @description 获取Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @returns 缓存的响应数据，如果没有则返回undefined
 */
export const getResponseCache = (namespace: string, key: string) => {
  const cachedResponse = responseCache[namespace];
  if (!cachedResponse) {
    return;
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
 * @param cacheMilliseconds 过期时间，单位毫秒
 */
export const setResponseCache = (namespace: string, key: string, data: any, cacheMilliseconds = 0) => {
  // 小于0则不缓存了
  if (cacheMilliseconds <= 0 || !data) {
    return;
  }
  const cachedResponse = responseCache[namespace] = responseCache[namespace] || {};
  cachedResponse[key] = [
    data,
    cacheMilliseconds === Infinity ? undefinedValue : new Date(getTime() + cacheMilliseconds),
  ];
}

/**
 * @description 清除Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 */
export const removeResponseCache = (namespace: string, key: string) => {
  const cachedResponse = responseCache[namespace];
  if (cachedResponse) {
    delete cachedResponse[key];
  }
}


/**
 * @description 清空Response缓存数据
 */
export const clearResponseCache = () => {
  responseCache = {};
};