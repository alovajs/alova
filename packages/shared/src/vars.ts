import { GeneralFn } from './types';

declare const Deno: any;
const undefStr = 'undefined';
// The following unified processing functions or variables added to reduce the amount of compiled code
export const PromiseCls = Promise;
export const promiseResolve = <T = void>(value?: T) => PromiseCls.resolve(value);
export const promiseReject = <T>(value: T) => PromiseCls.reject(value);
export const ObjectCls = Object;
export const RegExpCls = RegExp;
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
export const promiseAll = <T>(values: (Promise<T> | T)[]): Promise<T[]> => PromiseCls.all(values);
export const JSONStringify = <T>(
  value: T,
  replacer?: (this: any, key: string, value: any) => any,
  space?: string | number
) => JSON.stringify(value, replacer, space);
export const JSONParse = (value: string) => JSON.parse(value);
export const setTimeoutFn = (fn: GeneralFn, delay = 0) => setTimeout(fn, delay);
export const clearTimeoutTimer = (timer: NodeJS.Timeout | string | number) => clearTimeout(timer);
export const objectKeys = (obj: object) => ObjectCls.keys(obj);
export const objectValues = (obj: object) => ObjectCls.values(obj);
export const forEach = <T>(ary: T[], fn: (item: T, index: number, ary: T[]) => void) => ary.forEach(fn);
export const pushItem = <T>(ary: T[], ...item: T[]) => ary.push(...item);
export const mapItem = <T, R>(ary: T[], callbackfn: (value: T, index: number, array: T[]) => R) => ary.map(callbackfn);
export const filterItem = <T>(ary: T[], predicate: (value: T, index: number, array: T[]) => unknown) =>
  ary.filter(predicate);
export const shift = <T>(ary: T[]) => ary.shift();
export const slice = <T>(ary: T[], start?: number, end?: number) => ary.slice(start, end);
export const splice = <T>(ary: T[], start: number, deleteCount = 0, ...items: T[]) =>
  ary.splice(start, deleteCount, ...items);
export const len = (data: any[] | Uint8Array | string) => data.length;
export const isArray = (arg: any): arg is any[] => Array.isArray(arg);
export const deleteAttr = <T extends Record<any, any>>(arg: T, attr: keyof T) => delete arg[attr];
export const typeOf = (arg: any) => typeof arg;
export const regexpTest = (reg: RegExp, str: string | number) => reg.test(`${str}`);
export const includes = <T>(ary: T[], target: T) => ary.includes(target);
export const valueObject = <T>(value: T, writable = falseValue) => ({ value, writable });
export const defineProperty = (o: object, key: string | symbol, value: any, isDescriptor = falseValue) =>
  ObjectCls.defineProperty(o, key, isDescriptor ? value : valueObject(value, falseValue));
// Whether it is running on the server side, node and bun are judged by process, and deno is judged by Deno.
// Some frameworks (such as Alipay and uniapp) will inject the process object as a global variable which `browser` is true
export const isSSR =
  typeof window === undefStr && (typeof process !== undefStr ? !(process as any).browser : typeof Deno !== undefStr);

/** cache mode */
// only cache in memory, it's default option
export const MEMORY = 'memory';

// persistent cache, and will be read to memory when page is refreshed, it means that the memory cache always exist until cache is expired.
export const STORAGE_RESTORE = 'restore';
