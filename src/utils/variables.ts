import Alova from '../Alova';
import Method from '../Method';
import { GeneralFn } from './helper';

// 以下为减少编译代码量而添加的统一处理函数或变量
export const PromiseCls = Promise as typeof Promise<any>,
  promiseResolve = <T>(value: T) => PromiseCls.resolve(value),
  promiseReject = <T>(value: T) => PromiseCls.reject(value),
  ObjectCls = Object,
  undefinedValue = undefined,
  nullValue = null,
  trueValue = true,
  falseValue = false,
  promiseThen = <T, TResult1 = T, TResult2 = never>(
    promise: Promise<T>,
    onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> => promise.then(onFulfilled, onrejected),
  promiseCatch = <T, O>(promise: Promise<T>, onrejected: (reason: any) => O) => promise.catch(onrejected),
  getTime = (date?: Date) => (date ? date.getTime() : Date.now()),
  getContext = <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => methodInstance.context,
  getConfig = <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => methodInstance.config,
  getContextOptions = <S, E, RC, RE, RH>(alovaInstance: Alova<S, E, RC, RE, RH>) => alovaInstance.options,
  getOptions = <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) =>
    getContextOptions(getContext(methodInstance)),
  getStatesHook = <S, E, RC, RE, RH>(alovaInstance: Alova<S, E, RC, RE, RH>) =>
    getContextOptions(alovaInstance).statesHook,
  JSONStringify = <T>(value: T) => JSON.stringify(value),
  JSONParse = (value: string) => JSON.parse(value),
  setTimeoutFn = (fn: GeneralFn, delay = 0) => setTimeout(fn, delay),
  clearTimeoutTimer = (timer: NodeJS.Timeout) => clearTimeout(timer),
  objectKeys = (obj: object) => ObjectCls.keys(obj),
  forEach = <T>(ary: T[], fn: (item: T, index: number, ary: T[]) => void) => ary.forEach(fn),
  pushItem = <T>(ary: T[], ...item: T[]) => ary.push(...item),
  slice = <T>(ary: T[], start?: number, end?: number) => ary.slice(start, end),
  len = (data: any[] | Uint8Array | string) => data.length,
  isArray = (arg: any): arg is any[] => Array.isArray(arg),
  deleteAttr = <T extends Record<any, any>>(arg: T, attr: keyof T) => delete arg[attr],
  /** 三种缓存模式 */
  // 只在内存中缓存，默认是此选项
  MEMORY = 'memory',
  // 缓存会持久化，但当内存中没有缓存时，持久化缓存只会作为响应数据的占位符，且还会发送请求更新缓存

  STORAGE_PLACEHOLDER = 'placeholder',
  // 缓存会持久化，且每次刷新会读取持久化缓存到内存中，这意味着内存一直会有缓存
  STORAGE_RESTORE = 'restore';
