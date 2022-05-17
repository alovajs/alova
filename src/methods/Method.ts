import { MethodConfig, MethodType, RequestState } from '../../typings';
import Alova, { RequestBody } from '../Alova';

const defaultConfig = [{
  method: ['GET', 'HEAD'],
  config: {
    staleTime: 300000,   // get、head请求默认缓存5分钟（300000毫秒），其他请求默认不缓存
  }
}, {
  method: ['POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'TRACE'],
  config: {}
}];
export default class Method<S extends RequestState, E extends RequestState, R, T> {
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
      contextConcatConfig[key] = context.options[key];
    });
    this.config = {
      ...(defaultConfig.find(({ method }) => method.includes(type))?.config || {}),
      ...contextConcatConfig,
      ...config,
    };
    this.requestBody = requestBody;
  }
}