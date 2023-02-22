import { AlovaMethodConfig, MethodType, RequestBody } from '../typings';
import Alova from './Alova';
import sendRequest from './functions/sendRequest';
import { instanceOf, key } from './utils/helper';
import { deleteAttr, falseValue, getConfig, getContextOptions, isArray, undefinedValue } from './utils/variables';

export const typeGet = 'GET';
export const typeHead = 'HEAD';
export const typePost = 'POST';
export const typePut = 'PUT';
export const typePatch = 'PATCH';
export const typeDelete = 'DELETE';
export const typeOptions = 'OPTIONS';
export default class Method<S = any, E = any, R = any, T = any, RC = any, RE = any, RH = any> {
  public type: MethodType;
  public baseURL: string;
  public url: string;
  public config: AlovaMethodConfig<R, T, RC, RH>;
  public data?: RequestBody;
  public hitSource?: (string | RegExp)[];
  public context: Alova<S, E, RC, RE, RH>;
  public response: R;
  constructor(
    type: MethodType,
    context: Alova<S, E, RC, RE, RH>,
    url: string,
    config?: AlovaMethodConfig<R, T, RC, RH>,
    data?: RequestBody
  ) {
    const contextOptions = getContextOptions(context);
    this.baseURL = contextOptions.baseURL || '';
    this.url = url;
    this.type = type;
    this.context = context;

    // 将请求相关的全局配置合并到Method对象中
    const contextConcatConfig: any = {};

    // 合并timeout
    const mergedTimeoutKey = 'timeout';
    if (contextOptions[mergedTimeoutKey] !== undefinedValue) {
      contextConcatConfig[mergedTimeoutKey] = contextOptions[mergedTimeoutKey];
    }

    // 合并localCache
    const mergedLocalCacheKey = 'localCache';
    const globalLocalCache =
      contextOptions[mergedLocalCacheKey] !== undefinedValue
        ? contextOptions[mergedLocalCacheKey][type]
        : undefinedValue;
    if (globalLocalCache !== undefinedValue) {
      contextConcatConfig[mergedLocalCacheKey] = globalLocalCache;
    }

    // 将hitSource统一处理成数组，且当有method实例时将它们转换为methodKey
    const hitSource = config?.hitSource;
    if (hitSource) {
      this.hitSource = (isArray(hitSource) ? hitSource : [hitSource]).map(sourceItem =>
        instanceOf(sourceItem, Method) ? key(sourceItem) : (sourceItem as string | RegExp)
      );
      deleteAttr(config, 'hitSource');
    }

    this.config = {
      ...contextConcatConfig,
      ...(config || {})
    };
    this.data = data;
  }

  /**
   * 直接发出请求，返回promise对象
   */
  public send(forceRequest = falseValue): Promise<R> {
    return sendRequest(this, forceRequest).response();
  }

  /**
   * 设置方法名称，如果已有名称将被覆盖
   * @param name 方法名称
   */
  public setName(name: string | number) {
    getConfig(this).name = name;
  }
}
