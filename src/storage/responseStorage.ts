import { AlovaGlobalStorage, AlovaMethodStorage, StorageConnector } from '../../typings';
import Method from '../Method';
import { key } from '../utils/helper';
import { getConfig, getTime, nullValue } from '../utils/variables';

const responseStorageKey = 'alova.';
export const buildNamespacedStorageKey = (namespace: string, methodInstance: Method) =>
  responseStorageKey + namespace + key(methodInstance);

const wrapGetter = (
  namespace: string,
  methodInstance: Method,
  storage: AlovaGlobalStorage,
  tag: string | number | null = nullValue
) => {
  const storagedData = storage.get(buildNamespacedStorageKey(namespace, methodInstance));
  if (storagedData) {
    const [response, expireTimestamp, storedTag = nullValue] = storagedData;
    // 如果没有过期时间则表示数据永不过期，否则需要判断是否过期
    if (storedTag === tag && (!expireTimestamp || expireTimestamp > getTime())) {
      return response;
    }
    // 如果过期，则删除缓存
    removePersistentResponse(namespace, methodInstance, storage);
  }
};
const wrapSetter = (
  namespace: string,
  methodInstance: Method,
  storage: AlovaGlobalStorage,
  response: any,
  expireTimestamp: number,
  tag: string | number | null = nullValue
) => {
  // 过期时间已过则不缓存数据
  if (expireTimestamp > getTime() && response) {
    storage.set(buildNamespacedStorageKey(namespace, methodInstance), [
      response,
      expireTimestamp === Infinity ? nullValue : expireTimestamp,
      tag
    ]);
  }
};

/**
 * 创建storageConnector实例
 * @param storage 存储实例
 * @param namespace 命名空间
 * @returns storageConnector实例
 */
const createStorageConnector = (
  namespace: string,
  storage: AlovaGlobalStorage,
  tag: string | number | null = nullValue
) =>
  ({
    set(methodInstance, response, expireTimestamp = Infinity) {
      wrapSetter(namespace, methodInstance, storage, response, expireTimestamp, tag);
    },
    get(methodInstance) {
      return wrapGetter(namespace, methodInstance, storage, tag);
    },
    remove(methodInstance) {
      storage.remove(buildNamespacedStorageKey(namespace, methodInstance));
    }
  } as StorageConnector);

/**
 * 持久化响应数据
 * @param namespace 命名空间
 * @param methodInstance method实例
 * @param response 存储的响应内容
 * @param expireTimestamp 过期时间点的时间戳表示
 * @param storage 存储对象
 * @param tag 存储标签，用于区分不同的存储标记
 */
export const persistResponse = (
  namespace: string,
  methodInstance: Method,
  response: any,
  expireTimestamp: number,
  storage: AlovaGlobalStorage,
  tag: string | number | null = nullValue
) => {
  const scopedStorage = getConfig(methodInstance).storage as AlovaMethodStorage | undefined;
  if (scopedStorage?.set) {
    scopedStorage.set(createStorageConnector(namespace, storage, tag), methodInstance, response);
  } else {
    wrapSetter(namespace, methodInstance, storage, response, expireTimestamp, tag);
  }
};

/**
 * 获取存储的响应数据
 * @param namespace 命名空间
 * @param methodInstance method实例
 * @param storage 存储对象
 * @param tag 存储标签，标记改变了数据将会失效
 */
export const getPersistentResponse = (
  namespace: string,
  methodInstance: Method,
  storage: AlovaGlobalStorage,
  tag: string | number | null = nullValue
) => {
  const scopedStorage = getConfig(methodInstance).storage as AlovaMethodStorage;
  return scopedStorage && scopedStorage.get
    ? scopedStorage.get(createStorageConnector(namespace, storage, tag), methodInstance)
    : wrapGetter(namespace, methodInstance, storage, tag);
};

/**
 * 删除存储的响应数据
 * @param namespace 命名空间
 * @param methodInstance method实例
 * @param storage 存储对象
 */
export const removePersistentResponse = (namespace: string, methodInstance: Method, storage: AlovaGlobalStorage) => {
  const scopedStorage = getConfig(methodInstance).storage as AlovaMethodStorage;
  scopedStorage && scopedStorage.remove
    ? scopedStorage.remove(createStorageConnector(namespace, storage), methodInstance)
    : storage.remove(buildNamespacedStorageKey(namespace, methodInstance));
};
