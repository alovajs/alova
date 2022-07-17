import { Storage } from '../../typings';
import { getTime, JSONParse, JSONStringify, nullValue } from '../utils/variables';

const responseStorageKey = '__$$aresp$$__';
const buildNamespacedStorageKey = (namespace: string, key: string) => responseStorageKey + namespace + key;
/**
 * 持久化响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param response 存储的响应内容
 * @param persistMilliseconds 持久化时间
 * @param storage 存储对象
 */
export const persistResponse = (namespace: string, key: string, response: any, persistMilliseconds: number, storage: Storage) => {
  // 小于0则不持久化了
  if (persistMilliseconds <= 0 || !response) {
    return;
  }
  storage.setItem(buildNamespacedStorageKey(namespace, key), JSONStringify([
    response,
    persistMilliseconds === Infinity ? nullValue : (getTime() + persistMilliseconds)
  ]));
}


/**
 * 获取存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 */
export const getPersistentResponse = (namespace: string, key: string, storage: Storage) => {
  const namespacedResponseStorageKey = buildNamespacedStorageKey(namespace, key);
  const storageStr = storage.getItem(namespacedResponseStorageKey);
  if (storageStr) {
    const [ response, expireTimestamp ] = JSONParse(storageStr) as [ any, number | null ];
    // 如果没有过期时间则表示数据永不过期，否则需要判断是否过期
    if (!expireTimestamp || expireTimestamp > getTime()) {
      return response;
    }
    // 如果过期，则删除缓存
    storage.removeItem(namespacedResponseStorageKey);
  }
}

/**
 * 删除存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 */
export const removePersistentResponse = (namespace: string, key: string, storage: Storage) => {
  storage.removeItem(buildNamespacedStorageKey(namespace, key));
}