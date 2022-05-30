import {
  SerializedMethod
} from '../../typings';
import Alova from '../Alova';
import Method from '../methods/Method';

/**
 * 空函数，做兼容处理
 */
export function noop() {}

// 返回自身函数，做兼容处理
export const self = <T>(arg: T) => arg;


/**
 * 获取请求方式的key值
 * @returns {string} 此请求方式的key值
 */
export function key<S, E, R, T>(methodInstance: Method<S, E, R, T>) {
  const { type, url, requestBody } = methodInstance;
  const { params, headers } = methodInstance.config
  return JSONStringify([
    type,
    url,
    params,
    requestBody,
    headers,
  ]);
}

/**
 * 序列化请求方法对象
 * @param methodInstance 请求方法对象
 * @returns 请求方法的序列化对象
 */
export function serializeMethod<S, E, R, T>(methodInstance: Method<S, E, R, T>) {
  const {
    type,
    url,
    config,
    requestBody
  } = methodInstance;
  const {
    params,
    headers,
    timeout,
  } = config;

  return {
    type,
    url,
    config: {
      params,
      headers,
      timeout,
    },
    requestBody
  };
}


/**
 * 反序列化请求方法对象
 * @param methodInstance 请求方法对象
 * @returns 请求方法对象
 */
export function deserializeMethod<S, E>({
  type,
  url,
  config,
  requestBody
}: SerializedMethod, alova: Alova<S, E>) {
  return new Method(type, alova, url, config, requestBody);
}

/**
 * 创建节流函数，只有enable为true时会进入节流环节，否则将立即触发此函数
 * 场景：在调用useWatcher并设置了immediate为true时，首次调用需立即执行，否则会造成延迟调用
 * @param fn 回调函数
 * @param delay 延迟描述
 * @param enable 是否启用节流
 * @returns 延迟后的回调函数
 */
export function debounce(fn: Function, delay: number, enable: () => boolean) {
  let timer: any = null;
  return function(this: any, ...args: any[]) {
    const bindFn = fn.bind(this, ...args);
    if (!enable()) {
      bindFn();
      return;
    }
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      bindFn();
    }, delay);
  };
}


// 以下为减少编译代码量而添加的统一处理函数
export const getTime = (date?: Date) => date ? date.getTime() : Date.now();
export const promiseResolve = <T>(value: T) => Promise.resolve(value);
export const promiseReject = <T>(value: T) => Promise.reject(value);
export const undefinedValue = undefined;
export const getContext = <S, E, R, T>(methodInstance: Method<S, E, R, T>) => methodInstance.context;
export const getOptions = <S, E, R, T>(methodInstance: Method<S, E, R, T>) => getContext(methodInstance).options;
export const JSONStringify = <T>(value: T) => JSON.stringify(value);
export const JSONParse = (value: string) => JSON.parse(value);