import { newInstance } from '@alova/shared/function';
import { pushItem, trueValue, undefinedValue } from '@alova/shared/vars';
import {
  AlovaGenerics,
  AlovaGlobalCacheAdapter,
  AlovaMethodCreateConfig,
  AlovaOptions,
  RequestBody,
  StatesHook,
  Alova as TAlova
} from '~/typings';
import Method from './Method';
import { createDefaultL1CacheAdapter, createDefaultL2CacheAdapter } from './defaults/cacheAdapter';
import MethodSnapshotContainer from './storage/MethodSnapshotContainer';
import myAssert from './utils/myAssert';

interface RespondedAlovaGenerics<AG extends AlovaGenerics, Responded, Transformed> {
  State: AG['State'];
  Computed: AG['Computed'];
  Watched: AG['Watched'];
  Export: AG['Export'];
  Responded: Responded;
  Transformed: Transformed;
  RequestConfig: AG['RequestConfig'];
  Response: AG['Response'];
  ResponseHeader: AG['ResponseHeader'];
}

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

  public l1Cache: AlovaGlobalCacheAdapter;

  public l2Cache: AlovaGlobalCacheAdapter;

  public snapshots: MethodSnapshotContainer<AG>;

  constructor(options: AlovaOptions<AG>) {
    const instance = this;
    instance.id = (options.id || (idCount += 1)).toString();
    // 如果storage未指定，则默认使用localStorage
    instance.l1Cache = options.l1Cache || createDefaultL1CacheAdapter();
    instance.l2Cache = options.l2Cache || createDefaultL2CacheAdapter();

    // 合并默认options
    instance.options = {
      ...(defaultAlovaOptions as Partial<AlovaOptions<AG>>),
      ...options
    };
    instance.snapshots = newInstance(MethodSnapshotContainer<AG>, options.snapshots ?? defaultAlovaOptions.snapshots ?? 0);
  }

  Get<Responded = unknown, Transformed = unknown>(
    url: string,
    config?: AlovaMethodCreateConfig<Responded, Transformed, AG['RequestConfig'], AG['ResponseHeader']>
  ) {
    return newInstance(Method<AG>, typeGet, this, url, config) as unknown as Method<RespondedAlovaGenerics<AG, Responded, Transformed>>;
  }

  Post<Responded = unknown, Transformed = unknown>(
    url: string,
    data: RequestBody = {},
    config?: AlovaMethodCreateConfig<Responded, Transformed, AG['RequestConfig'], AG['ResponseHeader']>
  ) {
    return newInstance(Method<AG>, typePost, this, url, config, data) as unknown as Method<
      RespondedAlovaGenerics<AG, Responded, Transformed>
    >;
  }

  Delete<Responded = unknown, Transformed = unknown>(
    url: string,
    data: RequestBody = {},
    config?: AlovaMethodCreateConfig<Responded, Transformed, AG['RequestConfig'], AG['ResponseHeader']>
  ) {
    return newInstance(Method<AG>, typeDelete, this, url, config, data) as unknown as Method<
      RespondedAlovaGenerics<AG, Responded, Transformed>
    >;
  }

  Put<Responded = unknown, Transformed = unknown>(
    url: string,
    data: RequestBody = {},
    config?: AlovaMethodCreateConfig<Responded, Transformed, AG['RequestConfig'], AG['ResponseHeader']>
  ) {
    return newInstance(Method<AG>, typePut, this, url, config, data) as unknown as Method<
      RespondedAlovaGenerics<AG, Responded, Transformed>
    >;
  }

  Head<Responded = unknown, Transformed = unknown>(
    url: string,
    config?: AlovaMethodCreateConfig<Responded, Transformed, AG['RequestConfig'], AG['ResponseHeader']>
  ) {
    return newInstance(Method<AG>, typeHead, this, url, config) as unknown as Method<RespondedAlovaGenerics<AG, Responded, Transformed>>;
  }

  Patch<Responded = unknown, Transformed = unknown>(
    url: string,
    data: RequestBody = {},
    config?: AlovaMethodCreateConfig<Responded, Transformed, AG['RequestConfig'], AG['ResponseHeader']>
  ) {
    return newInstance(Method<AG>, typePatch, this, url, config, data) as unknown as Method<
      RespondedAlovaGenerics<AG, Responded, Transformed>
    >;
  }

  Options<Responded = unknown, Transformed = unknown>(
    url: string,
    config?: AlovaMethodCreateConfig<Responded, Transformed, AG['RequestConfig'], AG['ResponseHeader']>
  ) {
    return newInstance(Method<AG>, typeOptions, this, url, config) as unknown as Method<RespondedAlovaGenerics<AG, Responded, Transformed>>;
  }
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
  options: AlovaOptions<AlovaGenerics<State, Computed, Watched, Export, any, any, RequestConfig, Response, ResponseHeader>>
) => {
  const alovaInstance = newInstance(
    Alova<AlovaGenerics<State, Computed, Watched, Export, any, any, RequestConfig, Response, ResponseHeader>>,
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

const tt: Alova<AlovaGenerics> = null as unknown as TAlova<AlovaGenerics>;
const cv = await tt.Get<{ a: 1 }>('');
