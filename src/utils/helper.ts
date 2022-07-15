import {
  LocalCacheConfig,
  LocalCacheConfigParam,
  SerializedMethod
} from '../../typings';
import Alova from '../Alova';
import Method from '../Method';
import { clearTimeoutTimer, getConfig, getOptions, JSONStringify, MEMORY, nullValue, setTimeoutFn, STORAGE_PLACEHOLDER, STORAGE_RESTORE, undefinedValue } from './variables';

/**
 * 空函数，做兼容处理
 */
export function noop() {}

// 返回自身函数，做兼容处理
export const self = <T>(arg: T) => arg;

/**
 * 判断参数是否为函数
 * @param fn 任意参数
 * @returns 该参数是否为函数
 */
export const isFn = (arg: any): arg is Function => typeof arg === 'function';

/**
 * 判断参数是否为数字
 * @param arg 任意参数
 * @returns 该参数是否为数字
 */
export const isNumber = (arg: any): arg is number => typeof arg === 'number' && !isNaN(arg);


/**
 * 判断参数是否为字符串
 * @param arg 任意参数
 * @returns 该参数是否为字符串
 */
 export const isString = (arg: any): arg is string => typeof arg === 'string';


// 判断是否为普通对象
export const isPlainObject = (arg: any) => Object.prototype.toString.call(arg) === '[object Object]';

/**
 * 获取请求方式的key值
 * @returns {string} 此请求方式的key值
 */
export function key<S, E, R, T>(methodInstance: Method<S, E, R, T>) {
  const { type, url, requestBody } = methodInstance;
  const { params, headers } = getConfig(methodInstance);
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

  const serializingConfig: Record<string, any> = {};
  const serializingConfigKeys = ['params', 'headers', 'timeout', 'localCache'] as const;
  type SerializingConfigKey = typeof serializingConfigKeys[number];
  Object.keys(config).forEach(key => {
    if (serializingConfigKeys.includes(key as SerializingConfigKey)) {
      serializingConfig[key] = config[key as SerializingConfigKey];
    }
  });

  return {
    type,
    url,
    config: serializingConfig,
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
 * 创建防抖函数，只有enable为true时会进入防抖环节，否则将立即触发此函数
 * 场景：在调用useWatcher并设置了immediate为true时，首次调用需立即执行，否则会造成延迟调用
 * @param fn 回调函数
 * @param delay 延迟描述
 * @param enable 是否启用防抖
 * @returns 延迟后的回调函数
 */
export function debounce(fn: Function, delay: number, enable: () => boolean) {
  let timer: any = nullValue;
  return function(this: any, ...args: any[]) {
    const bindFn = fn.bind(this, ...args);
    if (!enable()) {
      bindFn();
      return;
    }
    if (timer) {
      clearTimeoutTimer(timer);
    }
    timer = setTimeoutFn(bindFn, delay);
  };
}


/**
 * 获取缓存的配置参数，固定返回{ e: number, s: boolean }格式的对象
 * e为expire缩写，表示缓存失效时间，单位为毫秒
 * s为storage缩写，是否存储到本地
 * @param localCache 本地缓存参数
 * @returns 统一的缓存参数对象
 */
export function getLocalCacheConfigParam<S, E, R, T>(methodInstance?: Method<S, E, R, T>, localCache?: LocalCacheConfigParam) {
  const _localCache = localCache !== undefinedValue
    ? localCache 
    : methodInstance 
      ? (getOptions(methodInstance).localCache || getConfig(methodInstance).localCache) 
      : undefinedValue;
  const defaultCacheMode = MEMORY;
  if (isNumber(_localCache)) {
    return {
      e: _localCache,
      m: defaultCacheMode,
      s: false,
    }
  }
  const mode = (_localCache as LocalCacheConfig).mode || defaultCacheMode;
  return {
    e: (_localCache as LocalCacheConfig).expire || 0,
    m: mode,
    s: [STORAGE_PLACEHOLDER, STORAGE_RESTORE].includes(mode),
  };
}