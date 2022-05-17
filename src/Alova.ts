import {
  AlovaOptions,
  MethodConfig,
  RequestState,
} from '../typings';
import Delete from './methods/Delete';
import Get from './methods/Get';
import Head from './methods/Head';
import Method from './methods/Method';
import Options from './methods/Options';
import Patch from './methods/Patch';
import Post from './methods/Post';
import Put from './methods/Put';
import Trace from './methods/Trace';
import {
  getStateCache,
  removeResponseCache,
} from './cache';
import {
  key,
  sendRequest
} from './utils/helper';

let idCounter = 0;
export type RequestBody = Record<string, any> | FormData | string;
export default class Alova<S extends RequestState, E extends RequestState> {
  public options: AlovaOptions<S, E>;
  public id = `alova-${++idCounter}`;
  public events: Record<string, Function[]> = {};
  constructor(options: AlovaOptions<S, E>) {
    this.options = options;
  }
  Get<R, T = any>(url: string, config?: MethodConfig<R, T>) {
    return new Get<S, E, R, T>(this, url, config);
  }
  Post<R, T = any>(url: string, data: RequestBody = {}, config: MethodConfig<R, T> = {}) {
    return new Post<S, E, R, T>(this, url, data, config);
  }
  Delete<R, T = any>(url: string, data: RequestBody = {}, config: MethodConfig<R, T> = {}) {
    return new Delete<S, E, R, T>(this, url, data, config);
  }
  Put<R, T = any>(url: string, data: RequestBody = {}, config: MethodConfig<R, T> = {}) {
    return new Put<S, E, R, T>(this, url, data, config);
  }
  Head<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    return new Head<S, E, R, T>(this, url, config);
  }
  Patch<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    return new Patch<S, E, R, T>(this, url, config);
  }
  Options<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    return new Options<S, E, R, T>(this, url, config);
  }
  Trace<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    return new Trace<S, E, R, T>(this, url, config);
  }
  
  /**
   * 让对应的返回数据缓存失效
   * @param method 请求方法对象
   */
  invalidate<R, T>(method: Method<S, E, R, T>) {
    removeResponseCache(this.options.baseURL, key(method));
  }

  /**
   * 更新缓存的数据
   * @param method 请求方法对象
   * @param handleUpdate 更新回调
   */
  update<D = any>(method: Method<S, E, any, any>, handleUpdate: (data: D) => void) {
    const { baseURL } = this.options;
    const methodKey = key(method);
    const states = getStateCache(baseURL, methodKey);
    states && handleUpdate(states.data);
  }
  
  /**
   * 获取请求数据并缓存
   * @param method 请求方法对象
   */
  fetch<R, T>(method: Method<S, E, R, T>) {
    sendRequest(method, true);
  }
}