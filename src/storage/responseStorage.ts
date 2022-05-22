import { Storage } from '../../typings';

const responseStorageKey = '__$$AlovaResp$$__';
/**
 * 持久化响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param response 存储的响应内容
 * @param storage 存储对象
 */
export function persistResponse(namespace: string, key: string, response: Record<string, any>, storage: Storage) {
  const namespacedResponseStorageKey = responseStorageKey + namespace + key;
  storage.setItem(namespacedResponseStorageKey, JSON.stringify(response));
}


/**
 * 获取存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 */
export function getPersistentResponse(namespace: string, key: string, storage: Storage) {
  const namespacedResponseStorageKey = responseStorageKey + namespace + key;
  const storageStr = storage.getItem(namespacedResponseStorageKey);
  return storageStr ? JSON.parse(storageStr) : null;
}