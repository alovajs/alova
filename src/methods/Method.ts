import { MethodConfig, MethodType } from '../../typings';
import Alova, { RequestBody } from '../Alova';
import { getOptions } from '../utils/helper';

// get、head请求默认缓存5分钟（300000毫秒），其他请求默认不缓存
const staledConfig = {
  staleTime: 300000,
};
const submitConfig = {};
const methodDefaultConfig: Record<MethodType, MethodConfig<any, any>> = {
  GET: staledConfig,
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
    
    const contextConcatConfig: Record<string, any> = {};
    (['timeout', 'staleTime'] as const).forEach(key => {
      contextConcatConfig[key] = getOptions(this)[key];
    });
    this.config = {
      ...(methodDefaultConfig[type] || {}),
      ...contextConcatConfig,
      ...config,
    };
    this.requestBody = requestBody;
  }
}