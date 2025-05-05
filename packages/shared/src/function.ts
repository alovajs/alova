import type { CacheExpire, CacheMode, MethodRequestConfig } from '../../alova/typings';
import type { BackoffPolicy, GeneralFn, UsePromiseExposure } from './types';
import {
  JSONStringify,
  MEMORY,
  ObjectCls,
  PromiseCls,
  STORAGE_RESTORE,
  falseValue,
  filterItem,
  forEach,
  isArray,
  len,
  mapItem,
  nullValue,
  objectKeys,
  promiseThen,
  pushItem,
  setTimeoutFn,
  shift,
  trueValue,
  typeOf,
  undefinedValue
} from './vars';

/**
 * Empty function for compatibility processing
 */
export const noop = () => {};
/**
 * A function that returns the parameter itself, used for compatibility processing
 * Since some systems use self as a reserved word, $self is used to distinguish it.
 * @param arg any parameter
 * @returns return parameter itself
 */
export const $self = <T>(arg: T) => arg;
/**
 * Determine whether the parameter is a function any parameter
 * @returns Whether the parameter is a function
 */
export const isFn = (arg: any): arg is GeneralFn => typeOf(arg) === 'function';
/**
 * Determine whether the parameter is a number any parameter
 * @returns Whether the parameter is a number
 */
export const isNumber = (arg: any): arg is number => typeOf(arg) === 'number' && !Number.isNaN(arg);
/**
 * Determine whether the parameter is a string any parameter
 * @returns Whether the parameter is a string
 */
export const isString = (arg: any): arg is string => typeOf(arg) === 'string';
/**
 * Determine whether the parameter is an object any parameter
 * @returns Whether the parameter is an object
 */
export const isObject = <T = any>(arg: any): arg is T => arg !== nullValue && typeOf(arg) === 'object';
/**
 * Global toString any parameter stringified parameters
 */
export const globalToString = (arg: any) => ObjectCls.prototype.toString.call(arg);
/**
 * Determine whether it is a normal object any parameter
 * @returns Judgment result
 */
export const isPlainObject = (arg: any): arg is Record<any, any> => globalToString(arg) === '[object Object]';
/**
 * Determine whether it is an instance of a certain class any parameter
 * @returns Judgment result
 */
export const instanceOf = <T>(arg: any, cls: new (...args: any[]) => T): arg is T => arg instanceof cls;
/**
 * Unified timestamp acquisition function
 * @returns Timestamp
 */
export const getTime = (date?: Date) => (date ? date.getTime() : Date.now());
/**
 * Get the alova instance through the method instance alova example
 */
export const getContext = <T extends { context: any }>(methodInstance: T): T['context'] => methodInstance.context;
/**
 * Get method instance configuration data
 * @returns Configuration object
 */
export const getConfig = <T extends { config: any }>(methodInstance: T): T['config'] => methodInstance.config;
/**
 * Get alova configuration data alova configuration object
 */
export const getContextOptions = <T extends { options: any }>(alovaInstance: T): T['options'] => alovaInstance.options;
/**
 * Get alova configuration data through method instance alova configuration object
 */
export const getOptions = <T extends { context: any }>(methodInstance: T) =>
  getContextOptions(getContext(methodInstance));

/**
 * Get the key value of the request method
 * @returns The key value of this request method
 */
export const key = <
  T extends {
    config: any;
    type: string;
    url: string;
    data?: any;
  }
>(
  methodInstance: T
) => {
  const { params, headers } = getConfig(methodInstance);
  return JSONStringify([methodInstance.type, methodInstance.url, params, methodInstance.data, headers]);
};

/**
 * Create uuid simple version uuid
 */
export const uuid = () => {
  const timestamp = new Date().getTime();
  return Math.floor(Math.random() * timestamp).toString(36);
};

/**
 * Get the key value of the method instance method instance
 * @returns The key value of this method instance
 */
export const getMethodInternalKey = <T extends { key: string }>(methodInstance: T): T['key'] => methodInstance.key;

/**
 * Get the request method object
 * @param methodHandler Request method handle
 * @param args Method call parameters request method object
 */
export const getHandlerMethod = <T extends { key: string }>(
  methodHandler: T | ((...args: any[]) => T),
  assert: (expression: boolean, msg: string) => void,
  args: any[] = []
) => {
  const methodInstance = isFn(methodHandler) ? methodHandler(...args) : methodHandler;
  assert(!!methodInstance.key, 'hook handler must be a method instance or a function that returns method instance');
  return methodInstance;
};
/**
 * Is it special data
 * @param data Submit data
 * @returns Judgment result
 */
export const isSpecialRequestBody = (data: any) => {
  const dataTypeString = globalToString(data);
  return (
    /^\[object (Blob|FormData|ReadableStream|URLSearchParams)\]$/i.test(dataTypeString) || instanceOf(data, ArrayBuffer)
  );
};

export const objAssign = <T extends Record<string, any>, U extends Record<string, any>[]>(
  target: T,
  ...sources: U
): T & U[number] => ObjectCls.assign(target, ...sources);

// Write an omit function type
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Excludes specified attributes from a data collection and returns a new data collection data collection
 * @param keys Excluded keys new data collection
 */
export const omit = <T extends Record<string, any>, K extends keyof T>(obj: T, ...keys: K[]) => {
  const result = {} as Pick<T, Exclude<keyof T, K>>;
  for (const key in obj) {
    if (!keys.includes(key as any)) {
      (result as any)[key] = obj[key];
    }
  }
  return result;
};

/**
 * the same as `Promise.withResolvers`
 * @returns promise with resolvers.
 */
export function usePromise<T = any>(): UsePromiseExposure<T> {
  let retResolve: UsePromiseExposure<T>['resolve'];
  let retReject: UsePromiseExposure<T>['reject'];
  const promise = new Promise<T>((resolve, reject) => {
    retResolve = resolve;
    retReject = reject;
  });

  return { promise, resolve: retResolve!, reject: retReject! };
}

/**
 * Get cached configuration parameters, fixedly returning an object in the format { e: function, c: any, f: any, m: number, s: boolean, t: string } e is the abbreviation of expire, which returns the cache expiration time point (timestamp) in milliseconds.
 * c is controlled, indicating whether it is a controlled cache
 * f is the original value of cacheFor, which is used to call to obtain cached data when c is true.
 * m is the abbreviation of mode, storage mode
 * s is the abbreviation of storage, whether to store it locally
 * t is the abbreviation of tag, which stores tags persistently.
 * @param methodInstance method instance
 * @returns Unified cache parameter object
 */
export const getLocalCacheConfigParam = <T extends { config: any }>(methodInstance: T) => {
  const { cacheFor } = getConfig(methodInstance);

  const getCacheExpireTs = (cacheExpire: CacheExpire) =>
    isNumber(cacheExpire) ? getTime() + cacheExpire : getTime(cacheExpire || undefinedValue);
  let cacheMode: CacheMode = MEMORY;
  let expire: (mode: CacheMode) => ReturnType<typeof getCacheExpireTs> = () => 0;
  let store = falseValue;
  let tag: undefined | string = undefinedValue;
  const controlled = isFn(cacheFor);
  if (!controlled) {
    let expireColumn: any = cacheFor;
    if (isPlainObject(cacheFor)) {
      const { mode = MEMORY, expire, tag: configTag } = (cacheFor as Exclude<typeof cacheFor, Date>) || {};
      cacheMode = mode;
      store = mode === STORAGE_RESTORE;
      tag = configTag ? configTag.toString() : undefinedValue;
      expireColumn = expire;
    }
    expire = (mode: CacheMode) =>
      getCacheExpireTs(isFn(expireColumn) ? expireColumn({ method: methodInstance, mode }) : expireColumn);
  }
  return {
    f: cacheFor,
    c: controlled,
    e: expire,
    m: cacheMode,
    s: store,
    t: tag
  };
};

/**
 * Create class instance
 * @param Cls Constructor
 * @param args Constructor parameters class instance
 */
export const newInstance = <T extends { new (...args: any[]): InstanceType<T> }>(
  Cls: T,
  ...args: ConstructorParameters<T>
) => new Cls(...args);
/**
 * Unified configuration
 * @param data
 * @returns unified configuration
 */
export const sloughConfig = <T>(config: T | ((...args: any[]) => T), args: any[] = []) =>
  isFn(config) ? config(...args) : config;
export const sloughFunction = <T, U>(arg: T | undefined, defaultFn: U) =>
  isFn(arg) ? arg : ![falseValue, nullValue].includes(arg as any) ? defaultFn : noop;

/**
 * Create an executor that calls multiple times synchronously and only executes it once asynchronously
 */
export const createSyncOnceRunner = (delay = 0) => {
  let timer: NodeJS.Timeout | number | undefined = undefinedValue;

  // Executing multiple calls to this function will execute once asynchronously
  return (fn: () => void) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeoutFn(fn, delay);
  };
};

/**
 * Create an asynchronous function queue, the asynchronous function will be executed serially queue add function
 */
export const createAsyncQueue = (catchError = falseValue) => {
  type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;
  const queue: AsyncFunction[] = [];
  let completedHandler: GeneralFn | undefined = undefinedValue;
  let executing = false;

  const executeQueue = async () => {
    executing = true;
    while (len(queue) > 0) {
      const asyncFunc = shift(queue);
      if (asyncFunc) {
        await asyncFunc();
      }
    }
    completedHandler && completedHandler();
    executing = false;
  };
  const addQueue = <T>(asyncFunc: AsyncFunction<T>): Promise<T> =>
    newInstance(PromiseCls<T>, (resolve, reject) => {
      const wrappedFunc = () =>
        promiseThen(asyncFunc(), resolve, err => {
          catchError ? resolve(undefinedValue as T) : reject(err);
        });
      pushItem(queue, wrappedFunc);
      if (!executing) {
        executeQueue();
      }
    });

  const onComplete = (fn: GeneralFn) => {
    completedHandler = fn;
  };

  return {
    addQueue,
    onComplete
  };
};

/**
 * Traverse the target object deeply target audience
 * @param callback Traversal callback
 * @param preorder Whether to traverse in preorder, the default is true
 * @param key The currently traversed key
 * @param parent The parent node currently traversed
 */
export const walkObject = (
  target: any,
  callback: (value: any, key: string | number | symbol, parent: any) => void,
  preorder = trueValue,
  key?: string | number | symbol,
  parent?: any
) => {
  const callCallback = () => {
    if (parent && key) {
      target = callback(target, key, parent);
      if (target !== parent[key]) {
        parent[key] = target;
      }
    }
  };

  // Preorder traversal
  preorder && callCallback();
  if (isObject(target)) {
    for (const i in target) {
      if (!instanceOf(target, String)) {
        walkObject(target[i], callback, preorder, i, target);
      }
    }
  }
  // Postal order traversal
  !preorder && callCallback();
  return target;
};

const cacheKeyPrefix = '$a.';
/**
 * build common cache key.
 */
export const buildNamespacedCacheKey = (namespace: string, key: string) => cacheKeyPrefix + namespace + key;

/**
 * Calculate retry delay time based on avoidance strategy and number of retries avoid parameters
 * @param retryTimes Number of retries
 * @returns Retry delay time
 */
export const delayWithBackoff = (backoff: BackoffPolicy, retryTimes: number) => {
  let { startQuiver, endQuiver } = backoff;
  const { delay, multiplier = 1 } = backoff;
  let retryDelayFinally = (delay || 0) * multiplier ** (retryTimes - 1);
  // If start quiver or end quiver has a value, you need to increase the random jitter value in the specified range
  if (startQuiver || endQuiver) {
    startQuiver = startQuiver || 0;
    endQuiver = endQuiver || 1;
    retryDelayFinally +=
      retryDelayFinally * startQuiver + Math.random() * retryDelayFinally * (endQuiver - startQuiver);
    retryDelayFinally = Math.floor(retryDelayFinally); // round delay
  }
  return retryDelayFinally;
};

/**
 * Build the complete url baseURL path url parameters complete url
 */
export const buildCompletedURL = (baseURL: string, url: string, params: MethodRequestConfig['params']) => {
  // Check if the URL starts with http/https
  const startsWithPrefix = /^https?:\/\//i.test(url);

  if (!startsWithPrefix) {
    // If the Base url ends with /, remove /
    baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    // If it does not start with /or http protocol, you need to add /

    // Compatible with some RESTful usage fix: https://github.com/alovajs/alova/issues/382
    if (url !== '') {
      // Since absolute URLs (http/https) are handled above,
      // we only need to ensure relative URLs start with a forward slash
      url = url.startsWith('/') ? url : `/${url}`;
    }
  }

  // fix: https://github.com/alovajs/alova/issues/653
  const completeURL = startsWithPrefix ? url : baseURL + url;

  // Convert params object to get string
  // Filter out those whose value is undefined
  const paramsStr = isString(params)
    ? params
    : mapItem(
        filterItem(objectKeys(params), key => params[key] !== undefinedValue),
        key => `${key}=${params[key]}`
      ).join('&');
  // Splice the get parameters behind the url. Note that the url may already have parameters.
  return paramsStr
    ? +completeURL.includes('?')
      ? `${completeURL}&${paramsStr}`
      : `${completeURL}?${paramsStr}`
    : completeURL;
};

/**
 * Deep clone an object.
 *
 * @param obj The object to be cloned.
 * @returns The cloned object.
 */
export const deepClone = <T>(obj: T): T => {
  if (isArray(obj)) {
    return mapItem(obj, deepClone) as T;
  }

  if (isPlainObject(obj) && obj.constructor === ObjectCls) {
    const clone = {} as T;
    forEach(objectKeys(obj), key => {
      clone[key as keyof T] = deepClone(obj[key as keyof T]);
    });
    return clone;
  }
  return obj;
};
