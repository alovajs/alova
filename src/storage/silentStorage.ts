import { SerializedMethod, Storage } from '../../typings';
import { noop } from '../utils/helper';
import { JSONParse, JSONStringify, len, nullValue, objectKeys, undefinedValue } from '../utils/variables';


const silentRequestStorageKeyPrefix = '__$$a_sreqssk$$__';

/**
 * 将静默请求的配置信息放入对应storage中
 * 逻辑：通过构造一个key，并用这个key将静默请求的配置信息放入对应storage中，然后将key存入统一管理key的存储中
 * @param namespace 命名空间，即alovaId
 * @param key 存储的key
 * @param config 存储的配置
 * @param storage 存储对象
 */
export const pushSilentRequest = (namespace: string, key: string, config: Record<string, any>, storage: Storage) => {
  const namespacedSilentStorageKey = silentRequestStorageKeyPrefix + namespace;
  key = '__$$sreq$$__' + namespace + key;
  storage.setItem(key, JSONStringify(config));
  const storageKeys = JSONParse(storage.getItem(namespacedSilentStorageKey) || '{}') as Record<string, null>;
  storageKeys[key] = nullValue;
  storage.setItem(namespacedSilentStorageKey, JSONStringify(storageKeys));
}

/**
 * 从storage中获取静默请求的配置信息
 * @param namespace 命名空间，即alovaId
 * @returns 返回一个对象，包含serializedMethod和remove方法
 */
export const getSilentRequest = (namespace: string, storage: Storage) => {
  const namespacedSilentStorageKey = silentRequestStorageKeyPrefix + namespace;
  const storageKeys = JSONParse(storage.getItem(namespacedSilentStorageKey) || '{}') as Record<string, null>;
  let serializedMethod = undefinedValue as SerializedMethod<any, any, any, any> | undefined;
  let remove = noop;
  const keys = objectKeys(storageKeys);
  if (len(keys) > 0) {
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