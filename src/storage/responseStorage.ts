import { alovas } from '@/Alova';
import { forEach, getTime, nullValue, pushItem } from '@/utils/variables';
import { AlovaGlobalStorage } from '~/typings';

const responseStorageKeyPrefix = 'alova.';
const buildNamespacedStorageKey = (namespace: string, key: string) => responseStorageKeyPrefix + namespace + key;

const responseStorageAllKey = 'alova.resp.keys';
const updateAllResponseStorageKeys = (completedKey: string, operateCode: 0 | 1, storage: AlovaGlobalStorage) => {
  const allKeys: string[] = storage.get(responseStorageAllKey) || [];
  const index = allKeys.indexOf(completedKey);
  if (operateCode === 0 && index >= 0) {
    allKeys.splice(index, 1);
  } else if (operateCode === 1 && index < 0) {
    pushItem(allKeys, completedKey);
  }
  storage.set(responseStorageAllKey, allKeys);
};

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
    const methodStoreKey = buildNamespacedStorageKey(namespace, key);
    storage.set(methodStoreKey, [response, expireTimestamp === Infinity ? nullValue : expireTimestamp, tag]);
    updateAllResponseStorageKeys(methodStoreKey, 1, storage);
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
  const methodStoreKey = buildNamespacedStorageKey(namespace, key);
  storage.remove(methodStoreKey);
  updateAllResponseStorageKeys(methodStoreKey, 0, storage);
};

/**
 * 清空所有存储的响应数据
 */
export const clearPersistentResponse = () => {
  forEach(alovas, alovaInst => {
    const { storage } = alovaInst;
    const allKeys: string[] = storage.get(responseStorageAllKey) || [];
    forEach(allKeys, keyItem => {
      storage.remove(keyItem);
    });
    storage.remove(responseStorageAllKey);
  });
};
