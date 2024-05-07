import { GeneralFn } from './types';

declare const Deno: any;
const undefStr = 'undefined';
// 以下为减少编译代码量而添加的统一处理函数或变量
export const PromiseCls = Promise as typeof Promise<any>;
export const promiseResolve = <T>(value: T) => PromiseCls.resolve(value);
export const promiseReject = <T>(value: T) => PromiseCls.reject(value);
export const ObjectCls = Object;
export const undefinedValue = undefined;
export const nullValue = null;
export const trueValue = true;
export const falseValue = false;
export const promiseThen = <T, TResult1 = T, TResult2 = never>(
  promise: Promise<T>,
  onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
  onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
): Promise<TResult1 | TResult2> => promise.then(onFulfilled, onrejected);
export const promiseCatch = <T, TResult = never>(
  promise: Promise<T>,
  onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
) => promise.catch(onrejected);
export const promiseFinally = <T>(promise: Promise<T>, onfinally?: (() => void) | undefined | null) =>
  promise.finally(onfinally);
export const JSONStringify = <T>(
  value: T,
  replacer?: (this: any, key: string, value: any) => any,
  space?: string | number
) => JSON.stringify(value, replacer, space);
export const JSONParse = (value: string) => JSON.parse(value);
export const setTimeoutFn = (fn: GeneralFn, delay = 0) => setTimeout(fn, delay);
export const clearTimeoutTimer = (timer: NodeJS.Timeout | string | number) => clearTimeout(timer);
export const objectKeys = (obj: object) => ObjectCls.keys(obj);
export const forEach = <T>(ary: T[], fn: (item: T, index: number, ary: T[]) => void) => ary.forEach(fn);
export const pushItem = <T>(ary: T[], ...item: T[]) => ary.push(...item);
export const mapItem = <T, R>(ary: T[], callbackfn: (value: T, index: number, array: T[]) => R) => ary.map(callbackfn);
export const filterItem = <T>(ary: T[], predicate: (value: T, index: number, array: T[]) => unknown) =>
  ary.filter(predicate);
export const slice = <T>(ary: T[], start?: number, end?: number) => ary.slice(start, end);
export const len = (data: any[] | Uint8Array | string) => data.length;
export const isArray = (arg: any): arg is any[] => Array.isArray(arg);
export const deleteAttr = <T extends Record<any, any>>(arg: T, attr: keyof T) => delete arg[attr];
export const typeOf = (arg: any) => typeof arg;

// 是否为服务端运行，node和bun通过process判断，deno通过Deno判断，但是支付宝小程序有process需要再判断下process.browser
export const isSSR = typeof process !== undefStr ? !(process as any).browser : typeof Deno !== undefStr;

/** cache mode */
// only cache in memory, it's default option
export const MEMORY = 'memory';

// persistent cahce, and will be read to memory when page is refreshed, it means that the memory cache always exist until cache is expired.
export const STORAGE_RESTORE = 'restore';
