import { AlovaGlobalStorage, AlovaMethodStorage, StorageConnector, StoragedData } from '../../typings';
import Method from '../Method';
import { key } from '../utils/helper';
import { getConfig, getContext, getTime, nullValue } from '../utils/variables';

const responseStorageKey = 'alova.';
export const buildNamespacedStorageKey = (namespace: string, methodInstance: Method) =>
  responseStorageKey + namespace + key(methodInstance);

const wrapGetter = (
  storagedData: StoragedData | undefined | null,
  namespace: string,
  methodInstance: Method,
  tag: string | number | null = nullValue
) => {
  if (storagedData) {
    const [response, expireTimestamp, storedTag = nullValue] = storagedData;
    // 如果没有过期时间则表示数据永不过期，否则需要判断是否过期
    if (storedTag === tag && (!expireTimestamp || expireTimestamp > getTime())) {
      return response;
    }
    // 如果过期，则删除缓存
    removePersistentResponse(namespace, methodInstance, getContext(methodInstance).storage);
  }
};
const wrapSetter = (
  namespace: string,
  methodInstance: Method,
  response: any,
  expireTimestamp: number,
  tag: string | number | null = nullValue
) => {
  // 小于0则不持久化了
  if (expireTimestamp > 0 && response) {
    getContext(methodInstance).storage.set(buildNamespacedStorageKey(namespace, methodInstance), [
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
    set(methodInstance, response, expireTimestamp) {
      wrapSetter(namespace, methodInstance, response, expireTimestamp, tag);
    },
    get(methodInstance) {
      const storagedResponse = storage.get(buildNamespacedStorageKey(namespace, methodInstance));
      return wrapGetter(storagedResponse, namespace, methodInstance, tag);
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
  const scopedStorage = getConfig(methodInstance).storage as AlovaMethodStorage;
  if (scopedStorage && scopedStorage.set) {
    scopedStorage.set(methodInstance, response, createStorageConnector(namespace, storage, tag));
  } else {
    wrapSetter(namespace, methodInstance, response, expireTimestamp, tag);
  }

  // 小于0则不持久化了
  if (expireTimestamp > 0 && response) {
    const storageData = [response, expireTimestamp === Infinity ? nullValue : expireTimestamp, tag] as StoragedData;
    storage.set(buildNamespacedStorageKey(namespace, methodInstance), storageData);
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
    ? scopedStorage.get(methodInstance, createStorageConnector(namespace, storage, tag))
    : wrapGetter(storage.get(buildNamespacedStorageKey(namespace, methodInstance)), namespace, methodInstance, tag);
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
    ? scopedStorage.remove(methodInstance, createStorageConnector(namespace, storage))
    : storage.remove(buildNamespacedStorageKey(namespace, methodInstance));
};
