import type {
  Alova,
  AlovaGenerics,
  CacheExpire,
  CacheMode,
  EffectRequestParams,
  Method,
  ReferingObject,
  StatesExport,
  StatesHook
} from '../../alova/typings';
import { AlovaMethodHandler, ExportedComputed, ExportedState } from '../../client/typings/clienthook';
import { FrameworkReadableState, FrameworkState } from './model/FrameworkState';
import { BackoffPolicy, GeneralFn, GeneralState, UsePromiseExposure } from './types';
import {
  JSONStringify,
  MEMORY,
  ObjectCls,
  PromiseCls,
  STORAGE_RESTORE,
  falseValue,
  forEach,
  includes,
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
 * 空函数，做兼容处理
 */
export const noop = () => {};
/**
 * 返回参数自身的函数，做兼容处理用
 * 由于部分系统将self作为了保留字，故使用$self来区分
 * @param arg 任意参数
 * @returns 返回参数本身
 */
export const $self = <T>(arg: T) => arg;
/**
 * 判断参数是否为函数
 * @param fn 任意参数
 * @returns 该参数是否为函数
 */
export const isFn = (arg: any): arg is GeneralFn => typeOf(arg) === 'function';
/**
 * 判断参数是否为数字
 * @param arg 任意参数
 * @returns 该参数是否为数字
 */
export const isNumber = (arg: any): arg is number => typeOf(arg) === 'number' && !Number.isNaN(arg);
/**
 * 判断参数是否为字符串
 * @param arg 任意参数
 * @returns 该参数是否为字符串
 */
export const isString = (arg: any): arg is string => typeOf(arg) === 'string';
/**
 * 判断参数是否为对象
 * @param arg 任意参数
 * @returns 该参数是否为对象
 */
export const isObject = <T = any>(arg: any): arg is T => arg !== nullValue && typeOf(arg) === 'object';
/**
 * 全局的toString
 * @param arg 任意参数
 * @returns 字符串化的参数
 */
export const globalToString = (arg: any) => ObjectCls.prototype.toString.call(arg);
/**
 * 判断是否为普通对象
 * @param arg 任意参数
 * @returns 判断结果
 */
export const isPlainObject = (arg: any): arg is Record<string | number | symbol, any> =>
  globalToString(arg) === '[object Object]';
/**
 * 判断是否为某个类的实例
 * @param arg 任意参数
 * @returns 判断结果
 */
export const instanceOf = <T>(arg: any, cls: new (...args: any[]) => T): arg is T => arg instanceof cls;
/**
 * 统一的时间戳获取函数
 * @returns 时间戳
 */
export const getTime = (date?: Date) => (date ? date.getTime() : Date.now());
/**
 * 通过method实例获取alova实例
 * @returns alova实例
 */
export const getContext = <AG extends AlovaGenerics>(methodInstance: Method<AG>) => methodInstance.context;
/**
 * 获取method实例配置数据
 * @returns 配置对象
 */
export const getConfig = <AG extends AlovaGenerics>(methodInstance: Method<AG>) => methodInstance.config;
/**
 * 获取alova配置数据
 * @returns alova配置对象
 */
export const getContextOptions = <AG extends AlovaGenerics>(alovaInstance: Alova<AG>) => alovaInstance.options;
/**
 * 通过method实例获取alova配置数据
 * @returns alova配置对象
 */
export const getOptions = <AG extends AlovaGenerics>(methodInstance: Method<AG>) =>
  getContextOptions(getContext(methodInstance));

/**
 * 获取请求方式的key值
 * @returns 此请求方式的key值
 */
export const key = <AG extends AlovaGenerics>(methodInstance: Method<AG>) => {
  const { params, headers } = getConfig(methodInstance);
  return JSONStringify([methodInstance.type, methodInstance.url, params, methodInstance.data, headers]);
};

/**
 * 创建uuid简易版
 * @returns uuid
 */
export const uuid = () => {
  const timestamp = new Date().getTime();
  return Math.floor(Math.random() * timestamp).toString(36);
};

/**
 * 获取method实例的key值
 * @param methodInstance method实例
 * @returns 此method实例的key值
 */
export const getMethodInternalKey = <AG extends AlovaGenerics>(methodInstance: Method<AG>) => methodInstance.key;

/**
 * 获取请求方法对象
 * @param methodHandler 请求方法句柄
 * @param args 方法调用参数
 * @returns 请求方法对象
 */
export const getHandlerMethod = <AG extends AlovaGenerics>(
  methodHandler: Method<AG> | AlovaMethodHandler<AG>,
  assert: (expression: boolean, msg: string) => void,
  args: any[] = []
) => {
  const methodInstance = isFn(methodHandler) ? methodHandler(...args) : methodHandler;
  assert(!!methodInstance.key, 'hook handler must be a method instance or a function that returns method instance');
  return methodInstance;
};
/**
 * 是否为特殊数据
 * @param data 提交数据
 * @returns 判断结果
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

// 编写一个omit的函数类型
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * 排除一个数据集合中指定的属性，并返回新的数据集合
 * @param obj 数据集合
 * @param keys 排除的key
 * @returns 新的数据集合
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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { promise, resolve: retResolve!, reject: retReject! };
}

/**
 * 获取缓存的配置参数，固定返回{ e: function, c: any, f: any, m: number, s: boolean, t: string }格式的对象
 * e为expire缩写，它返回缓存失效时间点（时间戳），单位为毫秒
 * c为controlled，表示是否为受控缓存
 * f为cacheFor原始值，用于在c为true时调用获取缓存数据
 * m为mode缩写，存储模式
 * s为storage缩写，是否存储到本地
 * t为tag缩写，持久化存储标签
 * @param methodInstance method实例
 * @returns 统一的缓存参数对象
 */
export const getLocalCacheConfigParam = <AG extends AlovaGenerics>(methodInstance: Method<AG>) => {
  const { cacheFor } = getConfig(methodInstance);
  const getCacheExpireTs = (cacheExpire: CacheExpire) =>
    isNumber(cacheExpire) ? getTime() + cacheExpire : getTime(cacheExpire || undefinedValue);
  let cacheMode: CacheMode = MEMORY;
  let expire: (mode: CacheMode) => ReturnType<typeof getCacheExpireTs> = () => 0;
  let store = falseValue;
  let tag: undefined | string = undefinedValue;
  const controlled = isFn(cacheFor);
  if (!controlled) {
    let expireColumn = cacheFor;
    if (isPlainObject(cacheFor)) {
      const { mode = MEMORY, expire, tag: configTag } = cacheFor || {};
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
 * 创建类实例
 * @param Cls 构造函数
 * @param args 构造函数参数
 * @returns 类实例
 */
export const newInstance = <T extends { new (...args: any[]): InstanceType<T> }>(
  Cls: T,
  ...args: ConstructorParameters<T>
) => new Cls(...args);
/**
 * 统一配置
 * @param 数据
 * @returns 统一的配置
 */
export const sloughConfig = <T>(config: T | ((...args: any[]) => T), args: any[] = []) =>
  isFn(config) ? config(...args) : config;
export const sloughFunction = <T, U>(arg: T | undefined, defaultFn: U) =>
  isFn(arg) ? arg : ![falseValue, nullValue].includes(arg as any) ? defaultFn : noop;

/**
 * 创建同步多次调用只在异步执行一次的执行器
 */
export const createSyncOnceRunner = (delay = 0) => {
  let timer: NodeJS.Timeout | number | undefined = undefinedValue;

  // 执行多次调用此函数将异步执行一次
  return (fn: () => void) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeoutFn(fn, delay);
  };
};

/**
 * 创建异步函数队列，异步函数将串行执行
 * @returns 队列添加函数
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
 * 深层遍历目标对象
 * @param target 目标对象
 * @param callback 遍历回调
 * @param preorder 是否前序遍历，默认为true
 * @param key 当前遍历的key
 * @param parent 当前遍历的父节点
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

  // 前序遍历
  preorder && callCallback();
  if (isObject(target)) {
    for (const i in target) {
      if (!instanceOf(target, String)) {
        walkObject(target[i], callback, preorder, i, target);
      }
    }
  }
  // 后序遍历
  !preorder && callCallback();
  return target;
};

interface MemorizedFunction {
  (...args: any[]): any;
  memorized: true;
}

type ActualStateTranslator<AG extends AlovaGenerics, StateProxy extends FrameworkReadableState<any, string>> =
  StateProxy extends FrameworkState<any, string>
    ? ExportedState<StateProxy['v'], AG['StatesExport']>
    : ExportedComputed<StateProxy['v'], AG['StatesExport']>;
type CompletedExposingProvider<AG extends AlovaGenerics, O extends Record<string | number | symbol, any>> = {
  [K in keyof O]: O[K] extends FrameworkReadableState<any, string>
    ? ActualStateTranslator<AG, O[K]>
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
      K extends `on${infer _}`
      ? (...args: Parameters<O[K]>) => CompletedExposingProvider<AG, O>
      : O[K];
};
/**
 * create simple and unified, framework-independent states creators and handlers.
 * @param statesHook states hook from `promiseStatesHook` function of alova
 * @param referingObject refering object exported from `promiseStatesHook` function
 * @returns simple and unified states creators and handlers
 */
export function statesHookHelper<AG extends AlovaGenerics>(
  statesHook: StatesHook<StatesExport<unknown>>,
  referingObject: ReferingObject = { trackedKeys: {}, bindError: falseValue }
) {
  const ref = <Data>(initialValue: Data) => (statesHook.ref ? statesHook.ref(initialValue) : { current: initialValue });
  referingObject = ref(referingObject).current;
  const exportState = <Data>(state: GeneralState<Data>) =>
    (statesHook.export || $self)(state, referingObject) as GeneralState<Data>;
  const memorize = <Callback extends GeneralFn>(fn: Callback) => {
    if (!isFn(statesHook.memorize)) {
      return fn;
    }
    const memorizedFn = statesHook.memorize(fn);
    (memorizedFn as unknown as MemorizedFunction).memorized = true;
    return memorizedFn;
  };
  const { dehydrate } = statesHook;

  // For performance reasons, only value is different, and the key is tracked can be updated.
  const update = (newValue: any, state: GeneralState, key: string) =>
    newValue !== dehydrate(state, key, referingObject) &&
    referingObject.trackedKeys[key] &&
    statesHook.update(newValue, state, key, referingObject);
  const mapDeps = (deps: (GeneralState | FrameworkReadableState<any, string>)[]) =>
    mapItem(deps, item => (instanceOf(item, FrameworkReadableState) ? item.e : item));
  const createdStateList = [] as string[];

  // key of deps on computed
  const depKeys: Record<string, true> = {};

  return {
    create: <Data, Key extends string>(initialValue: Data, key: Key) => {
      pushItem(createdStateList, key); // record the keys of created states.
      return newInstance(
        FrameworkState<Data, Key>,
        statesHook.create(initialValue, key, referingObject) as GeneralState<Data>,
        key,
        state => dehydrate(state, key, referingObject),
        exportState,
        (state, newValue) => update(newValue, state, key)
      );
    },
    computed: <Data, Key extends string>(
      getter: () => Data,
      depList: (GeneralState | FrameworkReadableState<any, string>)[],
      key: Key
    ) => {
      // Collect all dependencies in computed
      forEach(depList, dep => {
        if (dep.k) {
          depKeys[dep.k as string] = true;
        }
      });

      return newInstance(
        FrameworkReadableState<Data, Key>,
        statesHook.computed(getter, mapDeps(depList), key, referingObject) as GeneralState<Data>,
        key,
        state => dehydrate(state, key, referingObject),
        exportState
      );
    },
    effectRequest: (effectRequestParams: EffectRequestParams<any>) =>
      statesHook.effectRequest(effectRequestParams, referingObject),
    ref,
    watch: (source: (GeneralState | FrameworkReadableState<any, string>)[], callback: () => void) =>
      statesHook.watch(mapDeps(source), callback, referingObject),
    onMounted: (callback: () => void) => statesHook.onMounted(callback, referingObject),
    onUnmounted: (callback: () => void) => statesHook.onUnmounted(callback, referingObject),

    /**
     * refering object that sharing some value with this object.
     */
    __referingObj: referingObject,

    /**
     * expose provider for specified use hook.
     * @param object object that contains state proxy, framework state, operating function and event binder.
     * @returns provider component.
     */
    exposeProvider: <O extends Record<string | number | symbol, any>>(object: O) => {
      const provider: Record<string | number | symbol, any> = {};
      const originalStatesMap: Record<string, GeneralState> = {};
      for (const key in object) {
        const value = object[key];
        const isValueFunction = isFn(value);
        // if it's a memorized function, don't memorize it any more, add it to provider directly.
        // if it's start with `on`, it indicates it is an event binder, we should define a new function which return provider object.
        // if it's a common function, add it to provider with memorize mode.
        if (isValueFunction) {
          provider[key] = key.startsWith('on')
            ? (...args: any[]) => {
                value(...args);
                // eslint-disable-next-line
                return completedProvider;
              }
            : (value as MemorizedFunction).memorized
              ? value
              : memorize(value);
        } else {
          const isFrameworkState = instanceOf(value, FrameworkReadableState);
          if (isFrameworkState) {
            originalStatesMap[key] = value.s;
          }
          // otherwise, it's a state proxy or framework state, add it to provider with getter mode.
          ObjectCls.defineProperty(provider, key, {
            get: () => {
              // record the key that is being tracked.
              referingObject.trackedKeys[key] = trueValue;
              return isFrameworkState ? value.e : value;
            },

            // set need to set an function,
            // otherwise it will throw `TypeError: Cannot set property __referingObj of #<Object> which has only a getter` when setting value
            set: noop,
            enumerable: trueValue,
            configurable: trueValue
          });
        }
      }

      const { update: nestedHookUpdate, __proxyState: nestedProxyState } = provider;
      // reset the tracked keys and bingError flag, so that the nest hook providers can be initialized.
      // Always track the dependencies in computed
      referingObject.trackedKeys = {
        ...depKeys
      };
      referingObject.bindError = falseValue;

      const extraProvider = {
        // expose referingObject automatically.
        __referingObj: referingObject,

        // the new updating function that can update the new states and nested hook states.
        update: memorize(
          (newStates: {
            [K in keyof O]?: any;
          }) => {
            objectKeys(newStates).forEach(key => {
              if (includes(createdStateList, key)) {
                update(newStates[key], originalStatesMap[key], key);
              } else if (key in provider && isFn(nestedHookUpdate)) {
                nestedHookUpdate({
                  [key]: newStates[key]
                });
              }
            });
          }
        ),
        __proxyState: memorize(<K extends keyof O>(key: K) => {
          if (includes(createdStateList, key as string) && instanceOf(object[key], FrameworkReadableState)) {
            // need to tag the key that is being tracked so that it can be updated with `state.v = xxx`.
            referingObject.trackedKeys[key as string] = trueValue;
            return object[key];
          }
          return nestedProxyState(key);
        })
      };

      const completedProvider = objAssign(provider, extraProvider) as CompletedExposingProvider<
        AG,
        O & typeof extraProvider
      >;
      return completedProvider;
    },

    /**
     * transform state proxies to object.
     * @param states proxy array of framework states
     * @param filterKey filter key of state proxy
     * @returns an object that contains the states of target form
     */
    objectify: <S extends FrameworkReadableState<any, string>[], Key extends 's' | 'v' | 'e' | undefined = undefined>(
      states: S,
      filterKey?: Key
    ) =>
      states.reduce(
        (result, item) => {
          (result as any)[item.k] = filterKey ? item[filterKey] : item;
          return result;
        },
        {} as {
          [K in S[number]['k']]: Key extends undefined
            ? Extract<S[number], { k: K }>
            : Extract<S[number], { k: K }>[NonNullable<Key>];
        }
      ),

    transformState2Proxy: <Key extends string>(state: GeneralState<any>, key: Key) =>
      newInstance(
        FrameworkState<any, Key>,
        state,
        key,
        state => dehydrate(state, key, referingObject),
        exportState,
        (state, newValue) => update(newValue, state, key)
      )
  };
}

const cacheKeyPrefix = '$a.';
/**
 * build common cache key.
 */
export const buildNamespacedCacheKey = (namespace: string, key: string) => cacheKeyPrefix + namespace + key;

/**
 * 根据避让策略和重试次数计算重试延迟时间
 * @param backoff 避让参数
 * @param retryTimes 重试次数
 * @returns 重试延迟时间
 */
export const delayWithBackoff = (backoff: BackoffPolicy, retryTimes: number) => {
  let { startQuiver, endQuiver } = backoff;
  const { delay, multiplier = 1 } = backoff;
  let retryDelayFinally = (delay || 0) * multiplier ** (retryTimes - 1);
  // 如果startQuiver或endQuiver有值，则需要增加指定范围的随机抖动值
  if (startQuiver || endQuiver) {
    startQuiver = startQuiver || 0;
    endQuiver = endQuiver || 1;
    retryDelayFinally +=
      retryDelayFinally * startQuiver + Math.random() * retryDelayFinally * (endQuiver - startQuiver);
    retryDelayFinally = Math.floor(retryDelayFinally); // 取整数延迟
  }
  return retryDelayFinally;
};
