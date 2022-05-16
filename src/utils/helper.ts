import { Ref } from 'vue';
import {
  RequestAdapter,
  RequestState
} from '../../typings';
import { getResponseCache, setResponseCache, setStateCache } from '../cache';
import Method from '../methods/Method';

/**
 * 空函数，做兼容处理
 */
export function noop() {}

export type SuccessHandler = () => void;
export type ErrorHandler = (error: Error) => void;
export type ConnectController = ReturnType<RequestAdapter<unknown, unknown>>;
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
  errorHandlers: ErrorHandler[],
  setCtrl: (ctrl: ConnectController) => void,
) => void;
export function createRequestState<S extends RequestState, E extends RequestState, R, T>(
  method: Method<S, E, R, T>, 
  handleRequest: HandleRequest<S>
) {
  const options = method.context.options;
  const {
    create,
    export: stateExport,
  } = options.statesHook;
  const originalState = create();
  setStateCache(options.baseURL, key(method), originalState);   // 将初始状态存入缓存以便后续更新
  const successHandlers = [] as SuccessHandler[];
  const errorHandlers = [] as ErrorHandler[];
  let ctrl: ConnectController;

  // 调用请求处理回调函数
  handleRequest(originalState, successHandlers, errorHandlers, newCtrl => ctrl = newCtrl);
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
    abort() {
      if (ctrl) {
        ctrl.abort();
      }
    }
  };
}


/**
 * 实际的请求函数
 * @param method 请求方法对象
 * @returns 响应数据
 */
export function sendRequest<S extends RequestState, E extends RequestState, R, T>(method: Method<S, E, R, T>) {
  const {
    type,
    url,
    config,
    requestBody
  } = method;
  const {
    baseURL,
    beforeRequest = noop,
    responsed: alovaResponsed = noop,
    requestAdapter,
    staleTime = 0,
  } = method.context.options;
  const responsed = config.responsed || alovaResponsed;
  const methodKey = key(method);

  const response = getResponseCache(baseURL, methodKey);
  if (response) {
    return {
      response: () => Promise.resolve(response),
      headers: () => Promise.resolve({} as Headers),
      progress: () => {},
      abort: noop,
    };
  }

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
  const ctrls = requestAdapter(urlWithParams, data, newConfig);
  return {
    ...ctrls,
    response: () => Promise.all([
      ctrls.response(),
      ctrls.headers(),
    ]).then(([rawResponse, headers]) => {
      // 将响应数据存入缓存，以便后续调用
      const responsedData = responsed(rawResponse, headers);
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
    }),
  }
}


/**
 * 统一处理useRequest/useWatcher/useController等请求钩子函数的请求逻辑
 * @param method 请求方法对象
 * @param originalState 原始状态
 * @param successHandlers 成功回调函数数组
 * @param errorHandlers 失败回调函数数组
 * @returns 请求状态
 */
export function useHookRequest<S extends RequestState, E extends RequestState, R, T>(
  method: Method<S, E, R, T>,
  originalState: S,
  successHandlers: SuccessHandler[],
  errorHandlers: ErrorHandler[],
) {
  const { update } = method.context.options.statesHook;
  update({
    loading: true,
  }, originalState);
  const ctrl = sendRequest(method);
  const {
    response,
    progress,
  } = ctrl;

  response().then(data => {
    update({ data }, originalState);
    successHandlers.forEach(handler => handler());
  }).catch((error: Error) => errorHandlers.forEach(handler => handler(error)))
  .finally(() => update({
    loading: false,
  }, originalState));

  if (method.config.enableProgress) {
    progress(value => update({ progress: value }, originalState));
  }
  return ctrl;
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