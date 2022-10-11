import { AlovaMethodConfig, MethodType, RequestBody } from '../typings';
import Alova from './Alova';
import sendRequest from './functions/sendRequest';
import { forEach, getOptions, undefinedValue } from './utils/variables';

// get、head请求默认缓存5分钟（300000毫秒），其他请求默认不缓存
const cachedConfig = {
  localCache: 300000,
};
const submitConfig = {};
export const typeGet = 'GET';
export const typeHead = 'HEAD';
export const typePost = 'POST';
export const typePut = 'PUT';
export const typePatch = 'PATCH';
export const typeDelete = 'DELETE';
export const typeOptions = 'OPTIONS';
export const methodDefaultConfig: Record<MethodType, AlovaMethodConfig<any, any, any, any>> = {
  [typeGet]: cachedConfig,
  [typeHead]: submitConfig,
  [typePost]: submitConfig,
  [typePut]: submitConfig,
  [typePatch]: submitConfig,
  [typeDelete]: submitConfig,
  [typeOptions]: submitConfig,
};
export default class Method<S, E, R, T, RC, RE, RH> {
  public type: MethodType;
  public url: string;
  public config: AlovaMethodConfig<R, T, RC, RH>;
  public requestBody?: RequestBody;
  public context: Alova<S, E, RC, RE, RH>;
  public response: R;
  constructor(type: MethodType, context: Alova<S, E, RC, RE, RH>, url: string, config?: AlovaMethodConfig<R, T, RC, RH>, requestBody?: RequestBody) {
    this.type = type;
    this.url = url;
    this.context = context;
    
    // 将请求相关的全局配置合并到Method对象中
    const contextConcatConfig: Record<string, any> = {};
    forEach(['timeout', 'localCache'], key => {
      const contextOptions = getOptions(this);
      type ContextOptionsKey = keyof typeof contextOptions;
      if (contextOptions[key as ContextOptionsKey] !== undefinedValue) {
        contextConcatConfig[key] = contextOptions[key as ContextOptionsKey];
      }
    });
    this.config = {
      ...(methodDefaultConfig[type] || {}),
      ...contextConcatConfig,
      ...(config || {}),
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