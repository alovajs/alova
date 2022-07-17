import Method from '../Method';

// 以下为减少编译代码量而添加的统一处理函数或变量
export const PromiseCls = Promise;
export const getTime = (date?: Date) => date ? date.getTime() : Date.now();
export const promiseResolve = <T>(value: T) => PromiseCls.resolve(value);
export const promiseReject = <T>(value: T) => PromiseCls.reject(value);
export const getContext = <S, E, R, T>(methodInstance: Method<S, E, R, T>) => methodInstance.context;
export const getConfig = <S, E, R, T>(methodInstance: Method<S, E, R, T>) => methodInstance.config;
export const getOptions = <S, E, R, T>(methodInstance: Method<S, E, R, T>) => getContext(methodInstance).options;
export const JSONStringify = <T>(value: T) => JSON.stringify(value);
export const JSONParse = (value: string) => JSON.parse(value);
export const setTimeoutFn = (fn: Function, delay: number = 0) => setTimeout(fn, delay);
export const clearTimeoutTimer = (timer: number) => clearTimeout(timer);
export const undefinedValue = undefined;
export const nullValue = null;
export const trueValue = true;
export const falseValue = false;


/** 三种缓存模式 */
// 只在内存中缓存，默认是此选项
export const MEMORY = 0;

// 缓存会持久化，但当内存中没有缓存时，持久化缓存只会作为响应数据的占位符，且还会发送请求更新缓存
export const STORAGE_PLACEHOLDER = 1;

// 缓存会持久化，且每次刷新会读取持久化缓存到内存中，这意味着内存一直会有缓存
export const STORAGE_RESTORE = 2;
export const cacheMode = {
  MEMORY,
  STORAGE_PLACEHOLDER,
  STORAGE_RESTORE,
};