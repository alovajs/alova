import { Alova, AlovaMethodHandler, CacheExpire, CacheMode, FrontRequestState } from '~/typings';
import Method from '../Method';
import myAssert from './myAssert';
import {
  clearTimeoutTimer,
  falseValue,
  JSONStringify,
  MEMORY,
  nullValue,
  ObjectCls,
  PromiseCls,
  setTimeoutFn,
  STORAGE_PLACEHOLDER,
  STORAGE_RESTORE,
  undefinedValue
} from './variables';

export type GeneralFn = (...args: any[]) => any;

/**
 * 空函数，做兼容处理
 */
export const noop = () => {},
  /**
   * 返回参数自身的函数，做兼容处理用
   * 由于部分系统将self作为了保留字，故使用_self来区分
   * @param arg 任意参数
   * @returns 返回参数本身
   */
  _self = <T>(arg: T) => arg,
  /**
   * 判断参数是否为函数
   * @param fn 任意参数
   * @returns 该参数是否为函数
   */
  isFn = (arg: any): arg is GeneralFn => typeof arg === 'function',
  /**
   * 判断参数是否为数字
   * @param arg 任意参数
   * @returns 该参数是否为数字
   */
  isNumber = (arg: any): arg is number => typeof arg === 'number' && !isNaN(arg),
  /**
   * 判断参数是否为字符串
   * @param arg 任意参数
   * @returns 该参数是否为字符串
   */
  isString = (arg: any): arg is string => typeof arg === 'string',
  /**
   * 全局的toString
   * @param arg 任意参数
   * @returns 字符串化的参数
   */
  globalToString = (arg: any) => ObjectCls.prototype.toString.call(arg),
  /**
   * 判断是否为普通对象
   * @param arg 任意参数
   * @returns 判断结果
   */
  isPlainObject = (arg: any): arg is Record<string, any> => globalToString(arg) === '[object Object]',
  /**
   * 判断是否为某个类的实例
   * @param arg 任意参数
   * @returns 判断结果
   */
  instanceOf = <T>(arg: any, cls: new (...args: any[]) => T): arg is T => arg instanceof cls,
  /**
   * 统一的时间戳获取函数
   * @returns 时间戳
   */
  getTime = (date?: Date) => (date ? date.getTime() : Date.now()),
  /**
   * 通过method实例获取alova实例
   * @returns alova实例
   */
  getContext = <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => methodInstance.context,
  /**
   * 获取method实例配置数据
   * @returns 配置对象
   */
  getConfig = <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => methodInstance.config,
  /**
   * 获取alova配置数据
   * @returns alova配置对象
   */
  getContextOptions = <S, E, RC, RE, RH>(alovaInstance: Alova<S, E, RC, RE, RH>) => alovaInstance.options,
  /**
   * 通过method实例获取alova配置数据
   * @returns alova配置对象
   */
  getOptions = <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) =>
    getContextOptions(getContext(methodInstance)),
  /**
   * 获取alova实例的statesHook
   * @returns statesHook对象
   */
  getStatesHook = <S, E, RC, RE, RH>(alovaInstance: Alova<S, E, RC, RE, RH>) =>
    getContextOptions(alovaInstance).statesHook,
  /**
   * 是否为特殊数据
   * @param data 提交数据
   * @returns 判断结果
   */
  isSpecialRequestBody = (data: any) => {
    const dataTypeString = globalToString(data);
    return (
      /^\[object (Blob|FormData|ReadableStream|URLSearchParams)\]$/i.test(dataTypeString) ||
      instanceOf(data, ArrayBuffer)
    );
  },
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
   * 统一配置
   * @param 数据
   * @returns 统一的配置
   */
  sloughConfig = <T>(config: T | ((...args: any[]) => T), args: any[] = []) =>
    isFn(config) ? config(...args) : config,
  sloughFunction = <T, U>(arg: T | undefined, defaultFn: U) =>
    isFn(arg) ? arg : ![falseValue, nullValue].includes(arg as any) ? defaultFn : noop,
  /**
   * 将targetFn转换为异步函数
   * @param targetFn 目标函数
   * @returns 异步函数
   */
  promisify =
    <T extends any[], R>(targetFn: (...args: T) => R) =>
    (...args: T) =>
      newInstance(PromiseCls, (resolve, reject) => {
        try {
          resolve(targetFn(...args));
        } catch (error) {
          reject(error);
        }
      }),
  /**
   * 创建类实例
   * @param cls 构造函数
   * @param args 构造函数参数
   * @returns 类实例
   */
  newInstance = <T extends { new (...args: any[]): InstanceType<T> }>(cls: T, ...args: ConstructorParameters<T>) =>
    new cls(...args),
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
  });
