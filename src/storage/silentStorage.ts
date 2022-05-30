import { SerializedMethod, Storage } from '../../typings';
import { undefinedValue } from '../utils/helper';


const silentRequestStorageKey = '__$$AlovaSilentRequestStorageKeys$$__';

/**
 * 将静默请求的配置信息放入对应storage中
 * @param namespace 命名空间，即alovaId
 * @param key 存储的key
 * @param config 存储的配置
 * @param storage 存储对象
 */
export function pushSilentRequest(namespace: string, key: string, config: Record<string, any>, storage: Storage) {
  const namespacedSilentStorageKey = silentRequestStorageKey + namespace;
  key = '__$$SilentRequest$$__' + namespace + key;
  storage.setItem(key, JSON.stringify(config));
  const storageKeys = JSON.parse(storage.getItem(namespacedSilentStorageKey) || '{}') as Record<string, null>;
  storageKeys[key] = null;
  storage.setItem(namespacedSilentStorageKey, JSON.stringify(storageKeys));
}


/**
 * 从storage中获取静默请求的配置信息
 * @param namespace 命名空间，即alovaId
 * @returns 返回一个对象，包含serializedMethod和remove方法
 */
export function getSilentRequest(namespace: string, storage: Storage) {
  const namespacedSilentStorageKey = silentRequestStorageKey + namespace;
  const storageKeys = JSON.parse(storage.getItem(namespacedSilentStorageKey) || '{}') as Record<string, null>;
  let serializedMethod = undefinedValue as SerializedMethod | undefined;
  let remove = () => {};
  const keys = Object.keys(storageKeys);
  if (keys.length > 0) {
    const key = keys[0];
    const reqConfig = storage.getItem(key);
    serializedMethod = reqConfig ? JSON.parse(reqConfig) : undefinedValue;
    remove = () => {
      delete storageKeys[key];
      storage.setItem(namespacedSilentStorageKey, JSON.stringify(storageKeys));
      storage.removeItem(key);
    };
  }
  return { serializedMethod, remove };
}