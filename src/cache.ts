const cache: Record<string, Record<string, {
  data: unknown,
  expireTime: Date,
}>> = {};

/**
 * @description 获取缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @returns 缓存的响应数据，如果没有则返回undefined
 */
export function getCache(baseURL: string, key: string) {
  const cachedResponse = cache[baseURL];
  if (!cachedResponse) {
    return undefined;
  }

  const cachedItem = cachedResponse[key];
  if (cachedItem) {
    const { data, expireTime } = cachedItem;
    if (expireTime.getTime() > Date.now()) {
      return data;
    }
  }
}

/**
 * @description 设置缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @param data 缓存数据
 */
export function setCache(baseURL: string, key: string, data: unknown) {
  const cachedResponse = cache[baseURL] = cache[baseURL] || {};
  cachedResponse[key] = {
    data,
    expireTime: new Date(),
  };
}

/**
 * @description 清除缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 */
export function removeCache(baseURL: string, key: string) {
  const cachedResponse = cache[baseURL];
  if (cachedResponse) {
    delete cachedResponse[key];
  }
}