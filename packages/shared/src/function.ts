import type {
  Alova,
  AlovaGenerics,
  CacheExpire,
  CacheMode,
  EffectRequestParams,
  Method,
  ReferingObject,
  StatesHook
} from '../../alova/typings';
import { AlovaMethodHandler, ExportedComputed, ExportedState } from '../../client/typings';
import { FrameworkReadableState, FrameworkState } from './model/FrameworkState';
import { GeneralFn, GeneralState } from './types';
import {
  JSONStringify,
  MEMORY,
  ObjectCls,
  STORAGE_RESTORE,
  falseValue,
  mapItem,
  nullValue,
  objectKeys,
  pushItem,
  setTimeoutFn,
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
export const isPlainObject = (arg: any): arg is Record<any, any> => globalToString(arg) === '[object Object]';
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
 * 获取method实例的key值
 * @param methodInstance method实例
 * @returns 此method实例的key值
 */
export const getMethodInternalKey = <AG extends AlovaGenerics>(methodInstance: Method<AG>) => methodInstance.__key__;

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
  assert(!!methodInstance.__key__, 'hook handler must be a method instance or a function that returns method instance');
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
export const objAssign = <T extends Record<string, any>>(target: T, ...sources: Record<string, any>[]): T =>
  ObjectCls.assign(target, ...sources);

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
 * 获取缓存的配置参数，固定返回{ e: number, m: number, s: boolean, t: string }格式的对象
 * e为expire缩写，表示缓存失效时间点（时间戳），单位为毫秒
 * m为mode缩写，存储模式
 * s为storage缩写，是否存储到本地
 * t为tag缩写，持久化存储标签
 * @param localCache 本地缓存参数
 * @returns 统一的缓存参数对象
 */
export const getLocalCacheConfigParam = <AG extends AlovaGenerics>(methodInstance: Method<AG>) => {
  const { cacheFor } = getConfig(methodInstance);
  const getCacheExpireTs = (cacheExpire: CacheExpire) =>
    isNumber(cacheExpire) ? getTime() + cacheExpire : getTime(cacheExpire || undefinedValue);
  let cacheMode: CacheMode = MEMORY;
  let expire = 0;
  let store = falseValue;
  let tag: undefined | string = undefinedValue;
  const controlled = isFn(cacheFor);
  if (!controlled) {
    if (isNumber(cacheFor) || instanceOf(cacheFor, Date)) {
      expire = getCacheExpireTs(cacheFor);
    } else {
      const { mode = MEMORY, expire: configExpire = 0, tag: configTag } = cacheFor || {};
      cacheMode = mode;
      expire = getCacheExpireTs(configExpire);
      store = mode === STORAGE_RESTORE;
      tag = configTag ? configTag.toString() : undefinedValue;
    }
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
  if (isPlainObject(target)) {
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

/**
 * create simpe and unified, framework-independent states creators and handlers.
 * @param statesHook states hook from `promiseStatesHook` function of alova
 * @param referingObject refering object exported from `promiseStatesHook` function
 * @returns simple and unified states creators and handlers
 */
export function statesHookHelper<AG extends AlovaGenerics>(
  statesHook: StatesHook<GeneralState, GeneralState>,
  referingObject: ReferingObject = {}
) {
  const ref = <Data>(initialValue: Data) => (statesHook.ref ? statesHook.ref(initialValue) : { current: initialValue });
  referingObject = ref(referingObject).current;
  const exportState = <Data>(state: GeneralState<Data>) =>
    (statesHook.export || $self)(state, referingObject) as GeneralState<Data>;
  const memorize = <Callback extends (...args: any[]) => any>(fn: Callback) =>
    statesHook.memorize ? statesHook.memorize(fn) : fn;
  const update = (newValue: any, state: GeneralState, key: string) =>
    statesHook.update({ [key]: newValue }, { [key]: state }, referingObject);
  const mapDeps = (deps: (GeneralState | FrameworkReadableState<any, string>)[]) =>
    mapItem(deps, item => (instanceOf(item, FrameworkReadableState) ? item.e : item));
  const { dehydrate } = statesHook;
  const statesList = [] as string[];

  return {
    create: <Data, Key extends string>(initialValue: Data, key: Key, isRef = falseValue) => {
      pushItem(statesList, key); // record the keys of created states.
      return newInstance(
        FrameworkState<Data, Key>,
        statesHook.create(initialValue, referingObject, isRef) as GeneralState<Data>,
        key,
        state => dehydrate(state, key, referingObject),
        exportState,
        (state, newValue) => update(newValue, state, key)
      );
    },
    computed: <Data, Key extends string>(
      getter: () => Data,
      depList: (GeneralState | FrameworkReadableState<any, string>)[],
      key: Key,
      isRef = falseValue
    ) =>
      newInstance(
        FrameworkReadableState<Data, Key>,
        statesHook.computed(getter, mapDeps(depList), referingObject, isRef) as GeneralState<Data>,
        key,
        state => dehydrate(state, key, referingObject),
        exportState
      ),
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
     * batch export states and provide a update function that update states simply.
     * @param states framework state proxy array
     * @param coreHookStates the returns of useRequest/useWatcher/useFetcher that contains update function
     * @returns exported states and update function
     */
    exportObject: <S extends FrameworkReadableState<any, string>[]>(
      states: S,
      coreHookStates: Record<string, any> = {}
    ) => {
      const exportedStates = states.reduce(
        (result, item) => {
          result[item.k] = item.e;
          return result;
        },
        {} as Record<string, GeneralState>
      );

      type ExportedStateRecord<S extends FrameworkReadableState<any, string>[]> = {
        [K in S[number]['k']]: Extract<S[number], { k: K }> extends FrameworkState<any, string>
          ? ExportedState<Extract<S[number], { k: K }>['v'], AG['State']>
          : ExportedComputed<Extract<S[number], { k: K }>['v'], AG['Computed']>;
      };

      return {
        ...(exportedStates as ExportedStateRecord<S>),
        __referingObj: referingObject,
        update: memorize((newStates: Record<string, any>, targetStates?: Record<string, GeneralState>) => {
          targetStates = targetStates || exportedStates;
          objectKeys(newStates).forEach(key => {
            if (statesList.includes(key)) {
              update(newStates[key], targetStates[key], key);
            } else if (coreHookStates[key] && isFn(coreHookStates.update)) {
              coreHookStates.update({
                [key]: newStates[key]
              });
            }
          });
        })
      };
    },

    /**
     * state proxies to framework related states.
     * @param framework state proxy array
     * @returns framework related states array
     */
    statesObject: <S extends FrameworkReadableState<any, string>[]>(states: S) =>
      states.reduce(
        (result, item) => {
          (result as any)[item.k] = item.e;
          return result;
        },
        {} as {
          [K in S[number]['k']]: Extract<S[number], { k: K }>['s'];
        }
      ),

    /**
     * batch memorize operate functions.
     * they will be wrapped with `useCallback` on React, and return self function on other UI frameworks
     * @param operators operating functions
     * @returns memorized operating functions
     */
    memorizeOperators: <O extends Record<string, GeneralFn>>(operators: O) =>
      objectKeys(operators).reduce(
        (result, key) => {
          result[key] = memorize(operators[key]);
          return result;
        },
        {} as Record<string, GeneralFn>
      ) as O
  };
}

const cacheKeyPrefix = '$a.';
/**
 * build common cache key.
 */
export const buildNamespacedCacheKey = (namespace: string, key: string) => cacheKeyPrefix + namespace + key;
