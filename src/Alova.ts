import {
  AlovaOptions,
  MethodConfig,
  RequestAdapter,
  RequestState,
} from '../typings';
import Delete from './methods/Delete';
import Get from './methods/Get';
import Head from './methods/Head';
import Method, { MethodType } from './methods/Method';
import Options from './methods/Options';
import Patch from './methods/Patch';
import Post from './methods/Post';
import Put from './methods/Put';
import Trace from './methods/Trace';
import requestAdapter from './predefined/requestAdapter';
import {
  getCache,
  removeCache,
  setCache,
} from './cache';

// 获取fetch的第二个参数类型
type RequestInit = NonNullable<Parameters<typeof fetch>[1]>;
type RequestInterceptor<RC> = (config: RC) => RC|void;
type ResponseInterceptor<R, D> = (response: R) => Promise<D>;
export type Data = Record<string, any> | FormData | string;
type CommonMethodParameters = {
  url: string,
  readonly method: MethodType,
  data?: Data,
}

export default class Alova<S extends RequestState, E extends RequestState> {
  public requestAdapter = requestAdapter;
  public options: AlovaOptions<S, E>;
  public reqInter: RequestInterceptor<any>;
  public resInter: ResponseInterceptor<any, any>;
  constructor(options: AlovaOptions<S, E>) {
    this.options = options;
    this.requestAdapter = options.requestAdapter || requestAdapter;
  }
  
  setRequestInterceptor<RC = RequestInit>(handleRequest: RequestInterceptor<CommonMethodParameters & MethodConfig<Record<string, any>, RC>>) {
    this.reqInter = handleRequest;
    return this;
  }
  setResponseInterceptor<R = Response, D = any>(handleResponse: ResponseInterceptor<R, D>) {
    this.resInter = handleResponse;
    return this;
  }
  Get<R>(url: string, config: MethodConfig<R> = {}) {
    const get = new Get<S, E, R>(url, config);
    get.context = this;
    return get;
  }
  Post<R>(url: string, data: Data = {}, config: MethodConfig<R> = {}) {
    const post = new Post<S, E, R>(url, data, config);
    post.context = this;
    return post;
  }
  Delete<R>(url: string, data: Data = {}, config: MethodConfig<R> = {}) {
    const del = new Delete<S, E, R>(url, data, config);
    del.context = this;
    return del;
  }
  Put<R>(url: string, data: Data = {}, config: MethodConfig<R> = {}) {
    const put = new Put<S, E, R>(url, data, config);
    put.context = this;
    return put;
  }
  Head<R>(url: string, config: MethodConfig<R> = {}) {
    const head = new Head<S, E, R>(url, config);
    head.context = this;
    return head;
  }
  Patch<R>(url: string, config: MethodConfig<R> = {}) {
    const patch = new Patch<S, E, R>(url, config);
    patch.context = this;
    return patch;
  }
  Options<R>(url: string, config: MethodConfig<R> = {}) {
    const options = new Options<S, E, R>(url, config);
    options.context = this;
    return options;
  }
  Trace<R>(url: string, config: MethodConfig<R> = {}) {
    const trace = new Trace<S, E, R>(url, config);
    trace.context = this;
    return trace;
  }

  // setAbort() {

  // }
  
  /**
   * 让对应的缓存失效
   * @param method 请求方法对象
   */
  invalidate(method: Method<S, E, unknown>) {
    removeCache(this.options.baseURL, method.key());
  }

  /**
   * 更新缓存的数据
   * @param method 请求方法对象
   * @param handleUpdate 更新回调
   */
  update(method: Method<S, E, unknown>, handleUpdate: (data: unknown) => unknown) {
    const { baseURL } = this.options;
    const methodKey = method.key();
    const data = getCache(baseURL, methodKey);
    if (data) {
      const newData = handleUpdate(data);
      newData && setCache(baseURL, methodKey, newData);
    }
  }
  
  /**
   * 获取请求数据并缓存
   * @param method 请求方法对象
   */
  fetch(method: Method<S, E, unknown>) {
    // 调用请求函数
    method.send().then((data: any) => {
      data && setCache(this.options.baseURL, method.key(), data);
    });
  }
}