import { MethodConfig, MethodType, RequestBody } from '../../typings';
import Alova from '../Alova';
import { getOptions, undefinedValue } from '../utils/variables';

// get、head请求默认缓存5分钟（300000毫秒），其他请求默认不缓存
const cachedConfig = {
  localCache: 300000,
};
const submitConfig = {};
const methodDefaultConfig: Record<MethodType, MethodConfig<any, any>> = {
  GET: cachedConfig,
  HEAD: submitConfig,
  POST: submitConfig,
  PUT: submitConfig,
  PATCH: submitConfig,
  DELETE: submitConfig,
  OPTIONS: submitConfig,
};
export default class Method<S, E, R, T> {
  public type: MethodType;
  public url: string;
  public config: MethodConfig<R, T>;
  public requestBody?: RequestBody;
  public context: Alova<S, E>;
  public response: R;
  constructor(type: MethodType, context: Alova<S, E>, url: string, config: MethodConfig<R, T> = {}, requestBody?: RequestBody) {
    this.type = type;
    this.url = url;
    this.context = context;
    
    // 将请求相关的全局配置合并到Method对象中
    const contextConcatConfig: Record<string, any> = {};
    (['timeout', 'localCache'] as const).forEach(key => {
      const contextOptions = getOptions(this);
      if (contextOptions[key] !== undefinedValue) {
        contextConcatConfig[key] = contextOptions[key];
      }
    });
    this.config = {
      ...(methodDefaultConfig[type] || {}),
      ...contextConcatConfig,
      ...config,
    };
    this.requestBody = requestBody;
  }
}