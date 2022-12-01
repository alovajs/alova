import { AlovaMethodConfig, MethodType, RequestBody } from '../typings';
import Alova from './Alova';
import sendRequest from './functions/sendRequest';
import { getContextOptions, undefinedValue } from './utils/variables';

export const typeGet = 'GET';
export const typeHead = 'HEAD';
export const typePost = 'POST';
export const typePut = 'PUT';
export const typePatch = 'PATCH';
export const typeDelete = 'DELETE';
export const typeOptions = 'OPTIONS';
export default class Method<S, E, R, T, RC, RE, RH> {
  public type: MethodType;
  public baseURL: string;
  public url: string;
  public config: AlovaMethodConfig<R, T, RC, RH>;
  public requestBody?: RequestBody;
  public context: Alova<S, E, RC, RE, RH>;
  public response: R;
  constructor(
    type: MethodType,
    context: Alova<S, E, RC, RE, RH>,
    url: string,
    config?: AlovaMethodConfig<R, T, RC, RH>,
    requestBody?: RequestBody
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
    this.config = {
      ...contextConcatConfig,
      ...(config || {})
    };
    this.requestBody = requestBody;
  }

  /**
   * 直接发出请求，返回promise对象
   */
  send(forceRequest = false): Promise<R> {
    return sendRequest(this, forceRequest).response();
  }
}
