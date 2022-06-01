import { Storage } from '../../typings';
import { getTime, JSONParse, JSONStringify } from '../utils/helper';

const responseStorageKey = '__$$aresp$$__';
/**
 * 持久化响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param response 存储的响应内容
 * @param persistMilliseconds 持久化时间
 * @param storage 存储对象
 */
export function persistResponse(namespace: string, key: string, response: any, persistMilliseconds: number, storage: Storage) {
  // 小于0则不持久化了
  if (persistMilliseconds <= 0 || !response) {
    return;
  }
  const namespacedResponseStorageKey = responseStorageKey + namespace + key;
  storage.setItem(namespacedResponseStorageKey, JSONStringify([
    response,
    persistMilliseconds === Infinity ? null : (getTime() + persistMilliseconds)
  ]));
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