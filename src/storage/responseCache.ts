import { deleteAttr, getTime } from '@/utils/variables';

// 响应数据缓存
let responseCache: Record<string, Record<string, [data: any, expireTime: number]>> = {};

/**
 * 检查给定时间是否过期，如果没有过期时间则表示数据永不过期，否则需要判断是否过期
 * @param expireTime 过期时间
 * @returns 是否过期
 */
const isExpired = (expireTime: number) => expireTime < getTime();

/**
 * @description 获取Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @returns 缓存的响应数据，如果没有则返回undefined
 */
export const getResponseCache = (namespace: string, key: string) => {
  const cachedResponse = responseCache[namespace];
  if (cachedResponse) {
    const cachedItem = cachedResponse[key];
    if (cachedItem) {
      if (!isExpired(cachedItem[1])) {
        return cachedItem[0];
      }
      // 如果过期，则删除缓存
      deleteAttr(cachedResponse, key);
    }
  }
};

/**
 * @description 设置Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @param data 缓存数据
 * @param methodInstance method实例
 * @param expireTimestamp 过期时间戳，单位毫秒
 */
export const setResponseCache = (namespace: string, key: string, data: any, expireTimestamp = 0) => {
  if (expireTimestamp > getTime() && data) {
    const cachedResponse = (responseCache[namespace] = responseCache[namespace] || {});
    cachedResponse[key] = [data, expireTimestamp];
  }
};

/**
 * @description 清除Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 */
export const removeResponseCache = (namespace: string, key: string) => {
  const cachedResponse = responseCache[namespace];
  cachedResponse && deleteAttr(cachedResponse, key);
};

/**
 * @description 清空Response缓存数据
 */
export const clearResponseCache = () => {
  responseCache = {};
};
