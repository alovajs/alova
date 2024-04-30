import { newInstance } from '@alova/shared/function';
import { pushItem, trueValue, undefinedValue } from '@alova/shared/vars';
import {
  AlovaGlobalStorage,
  AlovaMethodConfig,
  AlovaOptions,
  MethodRequestConfig,
  RequestBody,
  StatesHook
} from '~/typings';
import Method from './Method';
import globalLocalStorage from './defaults/globalLocalStorage';
import { getStatesHook } from './utils/helper';
import myAssert from './utils/myAssert';

const typeGet = 'GET',
  typeHead = 'HEAD',
  typePost = 'POST',
  typePut = 'PUT',
  typePatch = 'PATCH',
  typeDelete = 'DELETE',
  typeOptions = 'OPTIONS';

type AlovaMethodCreateConfig<R, T, RC, RH> = Partial<MethodRequestConfig> & AlovaMethodConfig<R, T, RC, RH>;
const defaultAlovaOptions = {
  /**
   * GET请求默认缓存5分钟（300000毫秒），其他请求默认不缓存
   */
  localCache: {
    [typeGet]: 300000
  },

  /**
   * 共享请求默认为true
   */
  shareRequest: trueValue
};

let idCounter = 0;
export class Alova<S, E, RC, RE, RH> {
  public options: AlovaOptions<S, E, RC, RE, RH>;
  public id = ++idCounter + '';
  public storage: AlovaGlobalStorage;
  constructor(options: AlovaOptions<S, E, RC, RE, RH>) {
    // 如果storage未指定，则默认使用localStorage
    this.storage = options.storageAdapter || globalLocalStorage;

    // 合并默认options
    this.options = {
      ...defaultAlovaOptions,
      ...options
    };
  }
  Get<R, T = unknown>(url: string, config?: AlovaMethodCreateConfig<R, T, RC, RH>) {
    return newInstance(Method<S, E, R, T, RC, RE, RH>, typeGet, this, url, config);
  }
  Post<R, T = unknown>(url: string, data: RequestBody = {}, config?: AlovaMethodCreateConfig<R, T, RC, RH>) {
    return newInstance(Method<S, E, R, T, RC, RE, RH>, typePost, this, url, config, data);
  }
  Delete<R, T = unknown>(url: string, data: RequestBody = {}, config?: AlovaMethodCreateConfig<R, T, RC, RH>) {
    return newInstance(Method<S, E, R, T, RC, RE, RH>, typeDelete, this, url, config, data);
  }
  Put<R, T = unknown>(url: string, data: RequestBody = {}, config?: AlovaMethodCreateConfig<R, T, RC, RH>) {
    return newInstance(Method<S, E, R, T, RC, RE, RH>, typePut, this, url, config, data);
  }
  Head<R, T = unknown>(url: string, config?: AlovaMethodCreateConfig<R, T, RC, RH>) {
    return newInstance(Method<S, E, R, T, RC, RE, RH>, typeHead, this, url, config);
  }
  Patch<R, T = unknown>(url: string, data: RequestBody = {}, config?: AlovaMethodCreateConfig<R, T, RC, RH>) {
    return newInstance(Method<S, E, R, T, RC, RE, RH>, typePatch, this, url, config, data);
  }
  Options<R, T = unknown>(url: string, config?: AlovaMethodCreateConfig<R, T, RC, RH>) {
    return newInstance(Method<S, E, R, T, RC, RE, RH>, typeOptions, this, url, config);
  }
}

export let boundStatesHook: StatesHook<any, any> | undefined = undefinedValue;
export const usingStorageAdapters: AlovaGlobalStorage[] = [];

/**
 * 创建Alova实例
 * @param options alova配置参数
 * @returns Alova实例
 */
export const createAlova = <S, E, RC, RE, RH>(options: AlovaOptions<S, E, RC, RE, RH>) => {
  const alovaInstance = newInstance(Alova<S, E, RC, RE, RH>, options),
    newStatesHook = getStatesHook(alovaInstance);
  if (boundStatesHook) {
    myAssert(boundStatesHook === newStatesHook, 'must use the same `statesHook` in single project');
  }
  boundStatesHook = newStatesHook;
  const storageAdapter = alovaInstance.storage;
  !usingStorageAdapters.includes(storageAdapter) && pushItem(usingStorageAdapters, storageAdapter);
  return alovaInstance;
};
