import { SerializedMethod, Storage } from '../../typings';
import { noop } from '../utils/helper';
import { JSONParse, JSONStringify, undefinedValue } from '../utils/variables';


const silentRequestStorageKey = '__$$a_sreqssk$$__';

/**
 * 将静默请求的配置信息放入对应storage中
 * @param namespace 命名空间，即alovaId
 * @param key 存储的key
 * @param config 存储的配置
 * @param storage 存储对象
 */
export function pushSilentRequest(namespace: string, key: string, config: Record<string, any>, storage: Storage) {
  const namespacedSilentStorageKey = silentRequestStorageKey + namespace;
  key = '__$$sreq$$__' + namespace + key;
  storage.setItem(key, JSONStringify(config));
  const storageKeys = JSONParse(storage.getItem(namespacedSilentStorageKey) || '{}') as Record<string, null>;
  storageKeys[key] = null;
  storage.setItem(namespacedSilentStorageKey, JSONStringify(storageKeys));
}

/**
 * 从storage中获取静默请求的配置信息
 * @param namespace 命名空间，即alovaId
 * @returns 返回一个对象，包含serializedMethod和remove方法
 */
export function getSilentRequest(namespace: string, storage: Storage) {
  const namespacedSilentStorageKey = silentRequestStorageKey + namespace;
  const storageKeys = JSONParse(storage.getItem(namespacedSilentStorageKey) || '{}') as Record<string, null>;
  let serializedMethod = undefinedValue as SerializedMethod | undefined;
  let remove = noop;
  const keys = Object.keys(storageKeys);
  if (keys.length > 0) {
    const key = keys[0];
    const reqConfig = storage.getItem(key);
    serializedMethod = reqConfig ? JSONParse(reqConfig) : undefinedValue;
    remove = () => {
      delete storageKeys[key];
      storage.setItem(namespacedSilentStorageKey, JSONStringify(storageKeys));
      storage.removeItem(key);
    };
  }
  return { serializedMethod, remove };
}