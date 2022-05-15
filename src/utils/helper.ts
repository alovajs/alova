import { Ref } from 'vue';
import {
  RequestState
} from '../../typings';
import Method from '../methods/Method';

/**
 * 空函数，做兼容处理
 */
export function noop() {}

type SuccessHandler = () => void;
type ErrorHandler = (error: Error) => void;
/**
 * 创建请求状态，统一处理useRequest、useWatcher、useEffectWatcher中一致的逻辑
 * 该函数会调用statesHook的创建函数来创建对应的请求状态
 * @param method 请求方法对象
 * @param handleRequest 请求处理的回调函数
 * @returns 当前的请求状态
 */
type HandleRequest<S> = (
  originalState: S,
  successHandlers: SuccessHandler[],
  errorHandlers: ErrorHandler[]
) => void;
export function createRequestState<S extends RequestState, E extends RequestState, R, T>(
  method: Method<S, E, R, T>, 
  handleRequest: HandleRequest<S>
) {
  const {
    create,
    export: stateExport,
  } = method.context.options.statesHook;
  const originalState = create();
  const successHandlers = [] as SuccessHandler[];
  const errorHandlers = [] as ErrorHandler[];

  // type fn = NonNullable<typeof method.config.transformResponse>;
  // type aa = ReturnType<fn>;

  // 调用请求处理回调函数
  handleRequest(originalState, successHandlers, errorHandlers);
  const exportedState = stateExport(originalState);
  return {
    ...exportedState,
    // 以支持React和Vue的方式写法
    data: exportedState.data as E['data'] extends Ref ? Ref<R> : R,
    onSuccess(handler: SuccessHandler) {
      successHandlers.push(handler);
    },
    onError(handler: ErrorHandler) {
      errorHandlers.push(handler);
    },
  };
}


/**
 * 实际的请求函数
 * @param method 请求方法对象
 * @returns 响应数据
 */
export function sendRequest<S extends RequestState, E extends RequestState, R, T>(method: Method<S, E, R, T>) {
  const {
    response,
    type,
    url,
    config,
    requestBody
  } = method;
    if (response) {
      return Promise.resolve(response);
    }
    
    const {
      beforeRequest = noop,
      responsed = noop,
      requestAdapter,
    } = method.context.options;

    // 发送请求前调用钩子函数
    const newConfig = beforeRequest({
      url,
      method: type,
      data: requestBody,
      ...config,
    });

    // 将params对象转换为get字符串
    const {
      url: newUrl,
      params,
      data,
    } = newConfig;
    let paramsStr = params ? Object.keys(params).map(key => `${key}=${params[key]}`).join('&') : '';

    // 将get参数拼接到url后面，注意url可能已存在参数
    const urlWithParams = newUrl.indexOf('?') > -1 ? `${newUrl}&${paramsStr}` : `${newUrl}?${paramsStr}`;
    
    // 请求数据
    return requestAdapter(urlWithParams, data, newConfig)
      .then((rawData: any) => {
        console.log(type, url, config, rawData);
        return responsed(rawData);
      });
}

/**
 * 获取请求方式的key值
 * @returns {string} 此请求方式的key值
 */
export function key<S extends RequestState, E extends RequestState, R, T>(method: Method<S, E, R, T>) {
  return JSON.stringify([
    method.type,
    method.url,
    method.config.params,
    method.requestBody,
    method.config.headers,
  ]);
}


/**
 * 创建节流函数
 * @param fn 回调函数
 * @param delay 延迟描述
 * @returns 延迟后的回调函数
 */
export function debounce(fn: Function, delay: number) {
  let timer: any = null;
  return function(this: any, ...args: any[]) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}