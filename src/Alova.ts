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
  setResponseCache,
} from './cache';
import { key, sendRequest } from './utils/helper';

let idCounter = 0;
export type RequestBody = Record<string, any> | FormData | string;
export default class Alova<S extends RequestState, E extends RequestState> {
  public options: AlovaOptions<S, E>;
  public id = `alova-${++idCounter}`;
  constructor(options: AlovaOptions<S, E>) {
    this.options = options;
  }
  Get<R, T = any>(url: string, config?: MethodConfig<R, T>) {
    const get = new Get<S, E, R, T>(url, config);
    get.context = this;
    return get;
  }
  Post<R, T = any>(url: string, data: RequestBody = {}, config: MethodConfig<R, T> = {}) {
    const post = new Post<S, E, R, T>(url, data, config);
    post.context = this;
    return post;
  }
  Delete<R, T = any>(url: string, data: RequestBody = {}, config: MethodConfig<R, T> = {}) {
    const del = new Delete<S, E, R, T>(url, data, config);
    del.context = this;
    return del;
  }
  Put<R, T = any>(url: string, data: RequestBody = {}, config: MethodConfig<R, T> = {}) {
    const put = new Put<S, E, R, T>(url, data, config);
    put.context = this;
    return put;
  }
  Head<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    const head = new Head<S, E, R, T>(url, config);
    head.context = this;
    return head;
  }
  Patch<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    const patch = new Patch<S, E, R, T>(url, config);
    patch.context = this;
    return patch;
  }
  Options<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    const options = new Options<S, E, R, T>(url, config);
    options.context = this;
    return options;
  }
  Trace<R, T = any>(url: string, config: MethodConfig<R, T> = {}) {
    const trace = new Trace<S, E, R, T>(url, config);
    trace.context = this;
    return trace;
  }

  // setAbort() {

  // }
  
  /**
   * 让对应的返回数据缓存失效
   * @param method 请求方法对象
   */
  invalidate(method: Method<S, E, unknown, unknown>) {
    removeResponseCache(this.options.baseURL, key(method));
  }

  /**
   * 更新缓存的数据
   * @param method 请求方法对象
   * @param handleUpdate 更新回调
   */
  update(method: Method<S, E, unknown, unknown>, handleUpdate: (data: unknown) => unknown) {
    const { baseURL } = this.options;
    const methodKey = key(method);
    const states = getStateCache(baseURL, methodKey);
    states && handleUpdate(states.data);
  }
  
  /**
   * 获取请求数据并缓存
   * @param method 请求方法对象
   */
  fetch(method: Method<S, E, unknown, unknown>) {
    const {
      baseURL,
      staleTime,
      responsed,
    } = this.options;
    // 调用请求函数
    const {
      response,
      headers,
    } = sendRequest(method);
    // Promise.all([response(), headers()]).then(([data, headers]) => {
    //   // TODO: 是否需要同步更新到data状态中？？？
    //   if (data && )
    //   const expireMilliseconds = typeof staleTime === 'function' ? staleTime(data, headers, type) : staleTime;
    //    && setResponseCache(baseURL, key(method), data, expireMilliseconds);
    // });

    Promise.all([
      response(),
      headers(),
    ]).then(([rawResponse, headers]) => {
      // 将响应数据存入缓存，以便后续调用
      const responsedData = responsed(rawResponse);
      let ret = responsedData;
      if (responsedData instanceof Promise) {
        ret = responsedData.then(data => {
          const expireMilliseconds = typeof staleTime === 'function' ? staleTime(data, headers, type) : staleTime;
          setResponseCache(baseURL, methodKey, data, expireMilliseconds);
          return data;
        });
      } else {
        const expireMilliseconds = typeof staleTime === 'function' ? staleTime(responsedData, headers, type) : staleTime;
        setResponseCache(baseURL, methodKey, responsedData, expireMilliseconds);
      }
      return ret;
    });
  }
}