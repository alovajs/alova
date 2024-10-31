import { newInstance, pushItem, trueValue, undefinedValue } from '@alova/shared';
import {
  AlovaDefaultCacheAdapter,
  AlovaGenerics,
  AlovaGlobalCacheAdapter,
  AlovaMethodCreateConfig,
  AlovaOptions,
  RequestBody,
  RespondedAlovaGenerics,
  StatesExport,
  StatesHook
} from '~/typings';
import Method from './Method';
import { localStorageAdapter, memoryAdapter } from './defaults/cacheAdapter';
import MethodSnapshotContainer from './storage/MethodSnapshotContainer';
import myAssert from './utils/myAssert';

const typeGet = 'GET';
const typeHead = 'HEAD';
const typePost = 'POST';
const typePut = 'PUT';
const typePatch = 'PATCH';
const typeDelete = 'DELETE';
const typeOptions = 'OPTIONS';

const defaultAlovaOptions: Partial<AlovaOptions<AlovaGenerics>> = {
  /**
   * GET请求默认缓存5分钟（300000毫秒），其他请求默认不缓存
   */
  cacheFor: {
    [typeGet]: 300000
  },

  /**
   * 共享请求默认为true
   */
  shareRequest: trueValue,

  /**
   * method快照数量，默认为1000
   */
  snapshots: 1000
};

let idCount = 0;
export class Alova<AG extends AlovaGenerics> {
  public id: string;

  public options: AlovaOptions<AG>;

  public l1Cache: AG['L1Cache'];

  public l2Cache: AG['L2Cache'];

  public snapshots: MethodSnapshotContainer<AG>;

  constructor(options: AlovaOptions<AG>) {
    const instance = this;
    instance.id = (options.id || (idCount += 1)).toString();
    // 如果storage未指定，则默认使用localStorage
    instance.l1Cache = options.l1Cache || memoryAdapter();
    instance.l2Cache = options.l2Cache || localStorageAdapter();

    // 合并默认options
    instance.options = {
      ...(defaultAlovaOptions as Partial<AlovaOptions<AG>>),
      ...options
    };
    instance.snapshots = newInstance(
      MethodSnapshotContainer<AG>,
      options.snapshots ?? defaultAlovaOptions.snapshots ?? 0
    );
  }

  Get<Responded = unknown, Transformed = unknown>(
    url: string,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ) {
    return newInstance(Method<RespondedAlovaGenerics<AG, Responded, Transformed>>, typeGet, this as any, url, config);
  }

  Post<Responded = unknown, Transformed = unknown>(
    url: string,
    data?: RequestBody,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ) {
    return newInstance(
      Method<RespondedAlovaGenerics<AG, Responded, Transformed>>,
      typePost,
      this as any,
      url,
      config,
      data
    );
  }

  Delete<Responded = unknown, Transformed = unknown>(
    url: string,
    data?: RequestBody,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ) {
    return newInstance(
      Method<RespondedAlovaGenerics<AG, Responded, Transformed>>,
      typeDelete,
      this as any,
      url,
      config,
      data
    );
  }

  Put<Responded = unknown, Transformed = unknown>(
    url: string,
    data?: RequestBody,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ) {
    return newInstance(
      Method<RespondedAlovaGenerics<AG, Responded, Transformed>>,
      typePut,
      this as any,
      url,
      config,
      data
    );
  }

  Head<Responded = unknown, Transformed = unknown>(
    url: string,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ) {
    return newInstance(Method<RespondedAlovaGenerics<AG, Responded, Transformed>>, typeHead, this as any, url, config);
  }

  Patch<Responded = unknown, Transformed = unknown>(
    url: string,
    data?: RequestBody,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ) {
    return newInstance(
      Method<RespondedAlovaGenerics<AG, Responded, Transformed>>,
      typePatch,
      this as any,
      url,
      config,
      data
    );
  }

  Options<Responded = unknown, Transformed = unknown>(
    url: string,
    config?: AlovaMethodCreateConfig<AG, Responded, Transformed>
  ) {
    return newInstance(
      Method<RespondedAlovaGenerics<AG, Responded, Transformed>>,
      typeOptions,
      this as any,
      url,
      config
    );
  }
}

export let boundStatesHook: StatesHook<StatesExport<any>> | undefined = undefinedValue;
export const usingL1CacheAdapters: AlovaGlobalCacheAdapter[] = [];
export const usingL2CacheAdapters: AlovaGlobalCacheAdapter[] = [];

/**
 * create an alova instance.
 * @param options alova configuration.
 * @returns alova instance.
 */
export const createAlova = <
  RequestConfig,
  Response,
  ResponseHeader,
  L1Cache extends AlovaGlobalCacheAdapter = AlovaDefaultCacheAdapter,
  L2Cache extends AlovaGlobalCacheAdapter = AlovaDefaultCacheAdapter
>(
  options: AlovaOptions<AlovaGenerics<any, any, RequestConfig, Response, ResponseHeader, L1Cache, L2Cache>>
) => {
  const alovaInstance = newInstance(
    Alova<AlovaGenerics<any, any, RequestConfig, Response, ResponseHeader, L1Cache, L2Cache>>,
    options
  );
  const newStatesHook = alovaInstance.options.statesHook;
  if (boundStatesHook) {
    myAssert(boundStatesHook === newStatesHook, 'expected to use the same `statesHook`');
  }
  boundStatesHook = newStatesHook;
  const { l1Cache, l2Cache } = alovaInstance;
  !usingL1CacheAdapters.includes(l1Cache) && pushItem(usingL1CacheAdapters, l1Cache);
  !usingL2CacheAdapters.includes(l2Cache) && pushItem(usingL2CacheAdapters, l2Cache);
  return alovaInstance;
};
