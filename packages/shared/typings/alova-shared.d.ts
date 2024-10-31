/**
 * @alova/shared 1.0.7 (https://alova.js.org)
 * Document https://alova.js.org
 * Copyright 2024 Scott Hu. All Rights Reserved
 * Licensed under MIT (https://github.com/alovajs/alova/blob/main/LICENSE)
 */

/**
 * alova错误类
 */
declare class AlovaError extends Error {
  constructor(prefix: string, message: string, errorCode?: number);
}
/**
 * 自定义断言函数，表达式为false时抛出错误
 * 当传入了errorCode时，将提供链接到错误文档，引导用户改正
 * @param expression 判断表达式，true或false
 * @param message 断言消息
 */
declare const createAssert: (prefix?: string) => (expression: boolean, message: string, errorCode?: number) => void;

interface EventManager<E extends object> {
  on<K extends keyof E>(type: K, handler: (event: E[K]) => void): () => void;
  off<K extends keyof E>(type: K, handler?: (event: E[K]) => void): () => void;
  /**
   * @param type
   * @param event
   * @param sync Whether to synchronize emit events, if set to `true`, this will wait for all listeners to return results using Promise.all
   */
  emit<K extends keyof E>(type: K, event: E[K]): any[];
  eventMap: EventMap<E>;
}
type EventMap<E extends object> = {
  [K in keyof E]?: ((event: E[K]) => void)[];
};
declare const createEventManager: <E extends object>() => EventManager<E>;
declare const decorateEvent: <OnEvent extends (handler: (event: any) => void) => any>(
  onEvent: OnEvent,
  decoratedHandler: (handler: Parameters<OnEvent>[0], event: Parameters<Parameters<OnEvent>[0]>[0]) => void
) => (handler: Parameters<OnEvent>[0]) => any;

type GeneralFn = (...args: any[]) => any;
/**
 * common UI framework state type
 */
interface GeneralState<T = unknown> {
  [x: string]: T;
}
/**
 * is any type
 */
type IsAny<T, P, N> = 0 extends 1 & T ? P : N;
/**
 * is unknown type
 */
type IsUnknown<T, P, N> = IsAny<T, P, N> extends P ? N : unknown extends T ? P : N;
type IsAssignable<T, T2> = T2 extends T ? true : false;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
type UsePromiseExposure<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
};
interface BackoffPolicy {
  /**
   * Delay time for re-request, in milliseconds
   * @default 1000
   */
  delay?: number;
  /**
   * Specify the delay multiple. For example, if the multiplier is set to 1.5 and the delay is 2 seconds, the first retry will be 2 seconds, the second will be 3 seconds, and the third will be 4.5 seconds
   * @default 0
   */
  multiplier?: number;
  /**
   * The jitter starting percentage value of the delay request, ranging from 0-1
   * When only startQuiver is set, endQuiver defaults to 1
   * For example, if it is set to 0.5, it will add a random time of 50% to 100% to the current delay time
   * If endQuiver has a value, the delay time will increase by a random value in the range of startQuiver and endQuiver
   */
  startQuiver?: number;
  /**
   * The jitter ending percentage value of the delay request, ranging from 0-1
   * When only endQuiver is set, startQuiver defaults to 0
   * For example, if it is set to 0.5, it will add a random time from 0% to 50% to the current delay time
   * If startQuiver has a value, the delay time will increase by a random value between startQuiver and endQuiver
   */
  endQuiver?: number;
}
declare const type: {};

type UpdateFn<Data> = (state: GeneralState<Data>, newValue: Data) => void;
type DehydrateFn<Data> = (state: GeneralState<Data>) => Data;
type ExportFn<Data> = (state: GeneralState<Data>) => GeneralState<Data>;
declare class FrameworkReadableState<Data, Key extends string> {
  s: GeneralState<Data>;
  k: Key;
  protected $dhy: DehydrateFn<Data>;
  protected $exp: ExportFn<Data>;
  constructor(state: GeneralState<Data>, key: Key, dehydrate: DehydrateFn<Data>, exportState: ExportFn<Data>);
  get v(): Data;
  get e(): GeneralState<Data>;
}
declare class FrameworkState<Data, Key extends string> extends FrameworkReadableState<Data, Key> {
  private $upd;
  constructor(
    state: GeneralState<Data>,
    key: Key,
    dehydrate: DehydrateFn<Data>,
    exportState: ExportFn<Data>,
    update: UpdateFn<Data>
  );
  set v(newValue: Data);
  get v(): Data;
}

/**
 * 请求缓存设置
 * expire: 过期时间
 *  1. 当设置为数字时：如果大于0则首先返回缓存数据，过期时间单位为毫秒，小于等于0不缓存，Infinity为永不过期；
 *  2. 当设置为Date对象时，表示
 * mode: 缓存模式，可选值为memory、restore
 */
type CacheExpire = number | Date | null;
type CacheMode = 'memory' | 'restore';

/**
 * Empty function for compatibility processing
 */
declare const noop: () => void;
/**
 * A function that returns the parameter itself, used for compatibility processing
 * Since some systems use self as a reserved word, $self is used to distinguish it.
 * @param arg any parameter
 * @returns return parameter itself
 */
declare const $self: <T>(arg: T) => T;
/**
 * Determine whether the parameter is a function
 * @param fn any parameter
 * @returns Whether the parameter is a function
 */
declare const isFn: (arg: any) => arg is GeneralFn;
/**
 * Determine whether the parameter is a number
 * @param arg any parameter
 * @returns Whether the parameter is a number
 */
declare const isNumber: (arg: any) => arg is number;
/**
 * Determine whether the parameter is a string
 * @param arg any parameter
 * @returns Whether the parameter is a string
 */
declare const isString: (arg: any) => arg is string;
/**
 * Determine whether the parameter is an object
 * @param arg any parameter
 * @returns Whether the parameter is an object
 */
declare const isObject: <T = any>(arg: any) => arg is T;
/**
 * Global toString
 * @param arg any parameter
 * @returns stringified parameters
 */
declare const globalToString: (arg: any) => string;
/**
 * Determine whether it is a normal object
 * @param arg any parameter
 * @returns Judgment result
 */
declare const isPlainObject: (arg: any) => arg is Record<any, any>;
/**
 * Determine whether it is an instance of a certain class
 * @param arg any parameter
 * @returns Judgment result
 */
declare const instanceOf: <T>(arg: any, cls: new (...args: any[]) => T) => arg is T;
/**
 * Unified timestamp acquisition function
 * @returns Timestamp
 */
declare const getTime: (date?: Date) => number;
/**
 * Get the alova instance through the method instance
 * @returns alova example
 */
declare const getContext: <
  T extends {
    context: any;
  }
>(
  methodInstance: T
) => T['context'];
/**
 * Get method instance configuration data
 * @returns Configuration object
 */
declare const getConfig: <
  T extends {
    config: any;
  }
>(
  methodInstance: T
) => T['config'];
/**
 * Get alova configuration data
 * @returns alova configuration object
 */
declare const getContextOptions: <
  T extends {
    options: any;
  }
>(
  alovaInstance: T
) => T['options'];
/**
 * Get alova configuration data through method instance
 * @returns alova configuration object
 */
declare const getOptions: <
  T extends {
    context: any;
  }
>(
  methodInstance: T
) => T['context']['options'];
/**
 * Get the key value of the request method
 * @returns The key value of this request method
 */
declare const key: <
  T extends {
    config: any;
    type: string;
    url: string;
    data?: any;
  }
>(
  methodInstance: T
) => string;
/**
 * Create uuid simple version
 * @returns uuid
 */
declare const uuid: () => string;
/**
 * Get the key value of the method instance
 * @param methodInstance method instance
 * @returns The key value of this method instance
 */
declare const getMethodInternalKey: <
  T extends {
    key: string;
  }
>(
  methodInstance: T
) => T['key'];
/**
 * Get the request method object
 * @param methodHandler Request method handle
 * @param args Method call parameters
 * @returns request method object
 */
declare const getHandlerMethod: <
  T extends {
    key: string;
  }
>(
  methodHandler: T | ((...args: any[]) => T),
  assert: (expression: boolean, msg: string) => void,
  args?: any[]
) => T;
/**
 * Is it special data
 * @param data Submit data
 * @returns Judgment result
 */
declare const isSpecialRequestBody: (data: any) => boolean;
declare const objAssign: <T extends Record<string, any>, U extends Record<string, any>[]>(
  target: T,
  ...sources: U
) => T & U[number];
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/**
 * Excludes specified attributes from a data collection and returns a new data collection
 * @param obj data collection
 * @param keys Excluded keys
 * @returns new data collection
 */
declare const omit: <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  ...keys: K[]
) => Pick<T, Exclude<keyof T, K>>;
/**
 * the same as `Promise.withResolvers`
 * @returns promise with resolvers.
 */
declare function usePromise<T = any>(): UsePromiseExposure<T>;
/**
 * Get cached configuration parameters, fixedly returning an object in the format { e: function, c: any, f: any, m: number, s: boolean, t: string }
 * e is the abbreviation of expire, which returns the cache expiration time point (timestamp) in milliseconds.
 * c is controlled, indicating whether it is a controlled cache
 * f is the original value of cacheFor, which is used to call to obtain cached data when c is true.
 * m is the abbreviation of mode, storage mode
 * s is the abbreviation of storage, whether to store it locally
 * t is the abbreviation of tag, which stores tags persistently.
 * @param methodInstance method instance
 * @returns Unified cache parameter object
 */
declare const getLocalCacheConfigParam: <
  T extends {
    config: any;
  }
>(
  methodInstance: T
) => {
  f: any;
  c: boolean;
  e: (mode: CacheMode) => ReturnType<(cacheExpire: CacheExpire) => number>;
  m: CacheMode;
  s: boolean;
  t: string | undefined;
};
/**
 * Create class instance
 * @param Cls Constructor
 * @param args Constructor parameters
 * @returns class instance
 */
declare const newInstance: <
  T extends {
    new (...args: any[]): InstanceType<T>;
  }
>(
  Cls: T,
  ...args: ConstructorParameters<T>
) => InstanceType<T>;
/**
 * Unified configuration
 * @param data
 * @returns unified configuration
 */
declare const sloughConfig: <T>(config: T | ((...args: any[]) => T), args?: any[]) => T;
declare const sloughFunction: <T, U>(arg: T | undefined, defaultFn: U) => (() => void) | U | (T & GeneralFn);
/**
 * Create an executor that calls multiple times synchronously and only executes it once asynchronously
 */
declare const createSyncOnceRunner: (delay?: number) => (fn: () => void) => void;
/**
 * Create an asynchronous function queue, the asynchronous function will be executed serially
 * @returns queue add function
 */
declare const createAsyncQueue: (catchError?: boolean) => {
  addQueue: <T>(asyncFunc: (...args: any[]) => Promise<T>) => Promise<T>;
  onComplete: (fn: GeneralFn) => void;
};
/**
 * Traverse the target object deeply
 * @param target target audience
 * @param callback Traversal callback
 * @param preorder Whether to traverse in preorder, the default is true
 * @param key The currently traversed key
 * @param parent The parent node currently traversed
 */
declare const walkObject: (
  target: any,
  callback: (value: any, key: string | number | symbol, parent: any) => void,
  preorder?: boolean,
  key?: string | number | symbol,
  parent?: any
) => any;
/**
 * build common cache key.
 */
declare const buildNamespacedCacheKey: (namespace: string, key: string) => string;
/**
 * Calculate retry delay time based on avoidance strategy and number of retries
 * @param backoff avoid parameters
 * @param retryTimes Number of retries
 * @returns Retry delay time
 */
declare const delayWithBackoff: (backoff: BackoffPolicy, retryTimes: number) => number;
/**
 * Build the complete url
 * @param base baseURL
 * @param url path
 * @param params url parameters
 * @returns complete url
 */
declare const buildCompletedURL: (baseURL: string, url: string, params: Record<string, any>) => string;

type CallbackFn = () => void | Promise<void>;
declare class QueueCallback {
  protected limit?: (number | null) | undefined;
  private callbackQueue;
  private isProcessing;
  private interrupt;
  /**
   * @param [limit=null] no limit if set undefined or null
   * @param [initialProcessing=false]
   */
  constructor(limit?: (number | null) | undefined, initialProcessing?: boolean);
  /**
   * Adds a callback function to the callback queue.
   * If a limit is set and the queue has reached its limit, the callback will not be added.
   * @param callback The callback function to be added to the queue.
   */
  queueCallback(callback: CallbackFn): void;
  /**
   * Tries to run the callbacks in the queue.
   * If there are callbacks in the queue, it removes the first callback and executes it.
   * This method is called recursively until there are no more callbacks in the queue.
   */
  tryRunQueueCallback(): Promise<void>;
  /**
   * If set the param `state` to true, it will interrupt the current job (whether or not the current processing state is true)
   * If set the param `state` to false, then get on with the rest of the work
   */
  setProcessingState(state: boolean): void;
}

declare const PromiseCls: PromiseConstructor;
declare const promiseResolve: <T = void>(value?: T) => Promise<Awaited<T> | undefined>;
declare const promiseReject: <T>(value: T) => Promise<never>;
declare const ObjectCls: ObjectConstructor;
declare const RegExpCls: RegExpConstructor;
declare const undefinedValue: undefined;
declare const nullValue: null;
declare const trueValue = true;
declare const falseValue = false;
declare const promiseThen: <T, TResult1 = T, TResult2 = never>(
  promise: Promise<T>,
  onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
  onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
) => Promise<TResult1 | TResult2>;
declare const promiseCatch: <T, TResult = never>(
  promise: Promise<T>,
  onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
) => Promise<T | TResult>;
declare const promiseFinally: <T>(promise: Promise<T>, onfinally?: (() => void) | undefined | null) => Promise<T>;
declare const JSONStringify: <T>(
  value: T,
  replacer?: (this: any, key: string, value: any) => any,
  space?: string | number
) => string;
declare const JSONParse: (value: string) => any;
declare const setTimeoutFn: (fn: GeneralFn, delay?: number) => number;
declare const clearTimeoutTimer: (timer: NodeJS.Timeout | string | number) => void;
declare const objectKeys: (obj: object) => string[];
declare const objectValues: (obj: object) => any[];
declare const forEach: <T>(ary: T[], fn: (item: T, index: number, ary: T[]) => void) => void;
declare const pushItem: <T>(ary: T[], ...item: T[]) => number;
declare const mapItem: <T, R>(ary: T[], callbackfn: (value: T, index: number, array: T[]) => R) => R[];
declare const filterItem: <T>(ary: T[], predicate: (value: T, index: number, array: T[]) => unknown) => T[];
declare const shift: <T>(ary: T[]) => T | undefined;
declare const slice: <T>(ary: T[], start?: number, end?: number) => T[];
declare const splice: <T>(ary: T[], start: number, deleteCount?: number, ...items: T[]) => T[];
declare const len: (data: any[] | Uint8Array | string) => number;
declare const isArray: (arg: any) => arg is any[];
declare const deleteAttr: <T extends Record<any, any>>(arg: T, attr: keyof T) => boolean;
declare const typeOf: (
  arg: any
) => 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function';
declare const regexpTest: (reg: RegExp, str: string | number) => boolean;
declare const includes: <T>(ary: T[], target: T) => boolean;
declare const valueObject: <T>(
  value: T,
  writable?: boolean
) => {
  value: T;
  writable: boolean;
};
declare const defineProperty: (o: object, key: string | symbol, value: any, isDescriptor?: boolean) => object;
declare const isSSR: boolean;
/** cache mode */
declare const MEMORY = 'memory';
declare const STORAGE_RESTORE = 'restore';

export {
  $self,
  AlovaError,
  type BackoffPolicy,
  type CallbackFn,
  type Equal,
  type EventManager,
  FrameworkReadableState,
  FrameworkState,
  type GeneralFn,
  type GeneralState,
  type IsAny,
  type IsAssignable,
  type IsUnknown,
  JSONParse,
  JSONStringify,
  MEMORY,
  ObjectCls,
  type Omit,
  PromiseCls,
  QueueCallback,
  RegExpCls,
  STORAGE_RESTORE,
  type UsePromiseExposure,
  buildCompletedURL,
  buildNamespacedCacheKey,
  clearTimeoutTimer,
  createAssert,
  createAsyncQueue,
  createEventManager,
  createSyncOnceRunner,
  decorateEvent,
  defineProperty,
  delayWithBackoff,
  deleteAttr,
  falseValue,
  filterItem,
  forEach,
  getConfig,
  getContext,
  getContextOptions,
  getHandlerMethod,
  getLocalCacheConfigParam,
  getMethodInternalKey,
  getOptions,
  getTime,
  globalToString,
  includes,
  instanceOf,
  isArray,
  isFn,
  isNumber,
  isObject,
  isPlainObject,
  isSSR,
  isSpecialRequestBody,
  isString,
  key,
  len,
  mapItem,
  newInstance,
  noop,
  nullValue,
  objAssign,
  objectKeys,
  objectValues,
  omit,
  promiseCatch,
  promiseFinally,
  promiseReject,
  promiseResolve,
  promiseThen,
  pushItem,
  regexpTest,
  setTimeoutFn,
  shift,
  slice,
  sloughConfig,
  sloughFunction,
  splice,
  trueValue,
  type,
  typeOf,
  undefinedValue,
  usePromise,
  uuid,
  valueObject,
  walkObject
};
