import { getTime, nullValue } from '@/utils/variables';
import { AlovaGlobalStorage } from '~/typings';

const responseStorageKey = 'alova.';
const buildNamespacedStorageKey = (namespace: string, key: string) => responseStorageKey + namespace + key;

/**
 * 持久化响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param response 存储的响应内容
 * @param expireTimestamp 过期时间点的时间戳表示
 * @param storage 存储对象
 * @param tag 存储标签，用于区分不同的存储标记
 */
export const persistResponse = (
  namespace: string,
  key: string,
  response: any,
  expireTimestamp: number,
  storage: AlovaGlobalStorage,
  tag: string | number | null = nullValue
) => {
  // 小于0则不持久化了
  if (expireTimestamp > 0 && response) {
    storage.set(buildNamespacedStorageKey(namespace, key), [
      response,
      expireTimestamp === Infinity ? nullValue : expireTimestamp,
      tag
    ]);
  }
};

/**
 * 获取存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 * @param tag 存储标签，标记改变了数据将会失效
 */
export const getPersistentResponse = (
  namespace: string,
  key: string,
  storage: AlovaGlobalStorage,
  tag: string | null = null
) => {
  const storagedData = storage.get(buildNamespacedStorageKey(namespace, key));
  if (storagedData) {
    const [response, expireTimestamp, storedTag = nullValue] = storagedData;
    // 如果没有过期时间则表示数据永不过期，否则需要判断是否过期
    if (storedTag === tag && (!expireTimestamp || expireTimestamp > getTime())) {
      return response;
    }
    // 如果过期，则删除缓存
    removePersistentResponse(namespace, key, storage);
  }
};

/**
 * 删除存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 */
export const removePersistentResponse = (namespace: string, key: string, storage: AlovaGlobalStorage) => {
  storage.remove(buildNamespacedStorageKey(namespace, key));
};
