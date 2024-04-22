import { boundStatesHook } from '@/alova';
import {
  JSONStringify,
  clearTimeoutTimer,
  falseValue,
  getConfig,
  getContextOption,
  isNumber,
  nullValue,
  setTimeoutFn,
  undefinedValue
} from '@alova/shared';
import { Alova, AlovaMethodHandler, CacheExpire, CacheMode, FrontRequestState } from '~/typings';
import Method from '../Method';
import myAssert from './myAssert';
import { MEMORY, STORAGE_PLACEHOLDER, STORAGE_RESTORE } from './variables';

/**
 * 获取alova实例的statesHook
 * @returns statesHook对象
 */
export const getStatesHook = <S, E, RC, RE, RH>(alovaInstance: Alova<S, E, RC, RE, RH>) =>
    getContextOption(alovaInstance).statesHook,
  /**
   * 获取请求方式的key值
   * @returns {string} 此请求方式的key值
   */
  key = <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => {
    const { params, headers } = getConfig(methodInstance);
    return JSONStringify([methodInstance.type, methodInstance.url, params, methodInstance.data, headers]);
  },
  /**
   * 创建防抖函数，当delay为0时立即触发函数
   * 场景：在调用useWatcher并设置了immediate为true时，首次调用需立即执行，否则会造成延迟调用
   * @param {GeneralFn} fn 回调函数
   * @param {number|(...args: any[]) => number} delay 延迟描述，设置为函数时可实现动态的延迟
   * @returns 延迟后的回调函数
   */
  debounce = (fn: GeneralFn, delay: number | ((...args: any[]) => number)) => {
    let timer: any = nullValue;
    return function (this: any, ...args: any[]) {
      const bindFn = fn.bind(this, ...args),
        delayMill = isNumber(delay) ? delay : delay(...args);
      timer && clearTimeoutTimer(timer);
      if (delayMill > 0) {
        timer = setTimeoutFn(bindFn, delayMill);
      } else {
        bindFn();
      }
    };
  },
  /**
   * 获取缓存的配置参数，固定返回{ e: number, m: number, s: boolean, t: string }格式的对象
   * e为expire缩写，表示缓存失效时间点（时间戳），单位为毫秒
   * m为mode缩写，存储模式
   * s为storage缩写，是否存储到本地
   * t为tag缩写，持久化存储标签
   * @param localCache 本地缓存参数
   * @returns 统一的缓存参数对象
   */
  getLocalCacheConfigParam = <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => {
    const _localCache = getConfig(methodInstance).localCache,
      getCacheExpireTs = (_localCache: CacheExpire) =>
        isNumber(_localCache) ? getTime() + _localCache : getTime(_localCache || undefinedValue);
    let cacheMode: CacheMode = MEMORY,
      expire = 0,
      storage = falseValue,
      tag: undefined | string = undefinedValue;
    if (!isFn(_localCache)) {
      if (isNumber(_localCache) || instanceOf(_localCache, Date)) {
        expire = getCacheExpireTs(_localCache);
      } else {
        const { mode = MEMORY, expire: configExpire = 0, tag: configTag } = _localCache || {};
        cacheMode = mode;
        expire = getCacheExpireTs(configExpire);
        storage = [STORAGE_PLACEHOLDER, STORAGE_RESTORE].includes(mode);
        tag = configTag ? configTag.toString() : undefinedValue;
      }
    }
    return {
      e: expire,
      m: cacheMode,
      s: storage,
      t: tag
    };
  },
  /**
   * 获取请求方法对象
   * @param methodHandler 请求方法句柄
   * @param args 方法调用参数
   * @returns 请求方法对象
   */
  getHandlerMethod = <S, E, R, T, RC, RE, RH>(
    methodHandler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    args: any[] = []
  ) => {
    const methodInstance = isFn(methodHandler) ? methodHandler(...args) : methodHandler;
    myAssert(
      instanceOf(methodInstance, Method),
      'hook handler must be a method instance or a function that returns method instance'
    );
    return methodInstance;
  },
  /**
   * 导出fetchStates map
   * @param frontStates front states map
   * @returns fetchStates map
   */
  exportFetchStates = <L = any, R = any, E = any, D = any, U = any>(frontStates: FrontRequestState<L, R, E, D, U>) => ({
    fetching: frontStates.loading,
    error: frontStates.error,
    downloading: frontStates.downloading,
    uploading: frontStates.uploading
  }),
  promiseStatesHook = (functionName = '') => {
    myAssert(!!boundStatesHook, `can not call ${functionName} until set the \`statesHook\` at alova instance`);
    return boundStatesHook as NonNullable<typeof boundStatesHook>;
  };
