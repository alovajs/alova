import { buildNamespacedCacheKey, getTime } from '@alova/shared/function';
import { PromiseCls, filterItem, nullValue, undefinedValue } from '@alova/shared/vars';
import { AlovaGlobalCacheAdapter } from '~/typings';

/**
 * set or update cache
 * @param namespace 命名空间
 * @param key 存储的key
 * @param response 存储的响应内容
 * @param expireTimestamp 过期时间点的时间戳表示
 * @param storage 存储对象
 * @param tag 存储标签，用于区分不同的存储标记
 */
export const setWithCacheAdapter = async (
  namespace: string,
  key: string,
  data: any,
  expireTimestamp: number,
  cacheAdapter: AlovaGlobalCacheAdapter,
  tag: string | number | undefined = undefinedValue
) => {
  // not to cache if expireTimestamp is less than 0
  if (expireTimestamp > 0 && data) {
    const methodCacheKey = buildNamespacedCacheKey(namespace, key);
    await cacheAdapter.set(
      methodCacheKey,
      filterItem([data, expireTimestamp === Infinity ? nullValue : expireTimestamp, tag], Boolean)
    );
  }
};

/**
 * 删除存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 */
export const removeWithCacheAdapter = async (namespace: string, key: string, cacheAdapter: AlovaGlobalCacheAdapter) => {
  const methodStoreKey = buildNamespacedCacheKey(namespace, key);
  await cacheAdapter.remove(methodStoreKey);
};

/**
 * 获取存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 * @param tag 存储标签，标记改变了数据将会失效
 */
export const getRawWithCacheAdapter = async (
  namespace: string,
  key: string,
  cacheAdapter: AlovaGlobalCacheAdapter,
  tag: string | undefined = undefinedValue
) => {
  const storagedData = await cacheAdapter.get(buildNamespacedCacheKey(namespace, key));
  if (storagedData) {
    // eslint-disable-next-line
    const [_, expireTimestamp, storedTag] = storagedData;
    // 如果没有过期时间则表示数据永不过期，否则需要判断是否过期
    if (storedTag === tag && (!expireTimestamp || expireTimestamp > getTime())) {
      return storagedData;
    }
    // 如果过期，则删除缓存
    await removeWithCacheAdapter(namespace, key, cacheAdapter);
  }
};

/**
 * 获取存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 * @param tag 存储标签，标记改变了数据将会失效
 */
export const getWithCacheAdapter = async (
  namespace: string,
  key: string,
  cacheAdapter: AlovaGlobalCacheAdapter,
  tag: string | undefined = undefinedValue
) => {
  const rawData = await getRawWithCacheAdapter(namespace, key, cacheAdapter, tag);
  return rawData ? rawData[0] : undefinedValue;
};

/**
 * 清空所有存储的响应数据
 */
export const clearWithCacheAdapter = async (cacheAdapters: AlovaGlobalCacheAdapter[]) =>
  PromiseCls.all(cacheAdapters.map(cacheAdapter => cacheAdapter.clear()));
