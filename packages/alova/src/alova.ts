import { newInstance } from '@alova/shared/function';
import { pushItem, trueValue, undefinedValue } from '@alova/shared/vars';
import { AlovaGlobalCacheAdapter, AlovaMethodCreateConfig, AlovaOptions, RequestBody, StatesHook } from '~/typings';
import Method from './Method';
import { defaultL1CacheAdapter, defaultL2CacheAdapter } from './defaults/cacheAdapter';
import { getStatesHook } from './utils/helper';
import myAssert from './utils/myAssert';

const typeGet = 'GET';
const typeHead = 'HEAD';
const typePost = 'POST';
const typePut = 'PUT';
const typePatch = 'PATCH';
const typeDelete = 'DELETE';
const typeOptions = 'OPTIONS';

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

let idCount = 0;
export class Alova<State, Computed, Watched, Export, RequestConfig, Response, ResponseHeader> {
  public id: string;

  public options: AlovaOptions<State, Computed, Watched, Export, RequestConfig, Response, ResponseHeader>;

  public l1Cache: AlovaGlobalCacheAdapter;

  public l2Cache: AlovaGlobalCacheAdapter;

  constructor(options: AlovaOptions<State, Computed, Watched, Export, RequestConfig, Response, ResponseHeader>) {
    this.id = idCount.toString();
    idCount += 1;
    // 如果storage未指定，则默认使用localStorage
    this.l1Cache = options.l1Cache || defaultL1CacheAdapter;
    this.l2Cache = options.l2Cache || defaultL2CacheAdapter;

    // 合并默认options
    this.options = {
      ...defaultAlovaOptions,
      ...options
    };
  }

  Get<Responded, Transformed = unknown>(
    url: string,
    config?: AlovaMethodCreateConfig<Responded, Transformed, RequestConfig, ResponseHeader>
  ) {
    return newInstance(
      Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
      typeGet,
      this,
      url,
      config
    );
  }

  Post<Responded, Transformed = unknown>(
    url: string,
    data: RequestBody = {},
    config?: AlovaMethodCreateConfig<Responded, Transformed, RequestConfig, ResponseHeader>
  ) {
    return newInstance(
      Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
      typePost,
      this,
      url,
      config,
      data
    );
  }

  Delete<Responded, Transformed = unknown>(
    url: string,
    data: RequestBody = {},
    config?: AlovaMethodCreateConfig<Responded, Transformed, RequestConfig, ResponseHeader>
  ) {
    return newInstance(
      Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
      typeDelete,
      this,
      url,
      config,
      data
    );
  }

  Put<Responded, Transformed = unknown>(
    url: string,
    data: RequestBody = {},
    config?: AlovaMethodCreateConfig<Responded, Transformed, RequestConfig, ResponseHeader>
  ) {
    return newInstance(
      Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
      typePut,
      this,
      url,
      config,
      data
    );
  }

  Head<Responded, Transformed = unknown>(
    url: string,
    config?: AlovaMethodCreateConfig<Responded, Transformed, RequestConfig, ResponseHeader>
  ) {
    return newInstance(
      Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
      typeHead,
      this,
      url,
      config
    );
  }

  Patch<Responded, Transformed = unknown>(
    url: string,
    data: RequestBody = {},
    config?: AlovaMethodCreateConfig<Responded, Transformed, RequestConfig, ResponseHeader>
  ) {
    return newInstance(
      Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
      typePatch,
      this,
      url,
      config,
      data
    );
  }

  Options<Responded, Transformed = unknown>(
    url: string,
    config?: AlovaMethodCreateConfig<Responded, Transformed, RequestConfig, ResponseHeader>
  ) {
    return newInstance(
      Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
      typeOptions,
      this,
      url,
      config
    );
  }

  // matchSnapshot<M extends boolean = true>(
  //   matcher: MethodFilter,
  //   matchAll?: M
  // ): M extends true ? Method[] : Method | undefined {
  //   return matchAll ? ([] as Method[]) : undefined;
  // }
}

export let boundStatesHook: StatesHook<any, any> | undefined = undefinedValue;
export const usingL1CacheAdapters: AlovaGlobalCacheAdapter[] = [];
export const usingL2CacheAdapters: AlovaGlobalCacheAdapter[] = [];

/**
 * create an alova instance.
 * @param options alova configuration.
 * @returns alova instance.
 */
export const createAlova = <State, Computed, Watched, Export, RequestConfig, Response, ResponseHeader>(
  options: AlovaOptions<State, Computed, Watched, Export, RequestConfig, Response, ResponseHeader>
) => {
  const alovaInstance = newInstance(
    Alova<State, Computed, Watched, Export, RequestConfig, Response, ResponseHeader>,
    options
  );
  const newStatesHook = getStatesHook(alovaInstance);
  if (boundStatesHook) {
    myAssert(boundStatesHook === newStatesHook, 'expected to use the same `statesHook`');
  }
  boundStatesHook = newStatesHook;
  const { l1Cache, l2Cache } = alovaInstance;
  !usingL1CacheAdapters.includes(l1Cache) && pushItem(usingL1CacheAdapters, l1Cache);
  !usingL2CacheAdapters.includes(l2Cache) && pushItem(usingL2CacheAdapters, l2Cache);
  return alovaInstance;
};
