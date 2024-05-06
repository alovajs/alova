import type {
  Alova,
  AlovaEvent,
  CacheExpire,
  CacheMode,
  EffectRequestParams,
  Method,
  ReferingObject,
  StatesHook
} from '../../alova/typings';
import { FrameworkState, GeneralFn } from './types';
import {
  JSONStringify,
  MEMORY,
  ObjectCls,
  STORAGE_RESTORE,
  falseValue,
  forEach,
  len,
  nullValue,
  objectKeys,
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
 * 由于部分系统将self作为了保留字，故使用_self来区分
 * @param arg 任意参数
 * @returns 返回参数本身
 */
export const _self = <T>(arg: T) => arg;
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
export const isPlainObject = (arg: any): arg is Record<string, any> => globalToString(arg) === '[object Object]';
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
export const getContext = (methodInstance: Method) => methodInstance.context;
/**
 * 获取method实例配置数据
 * @returns 配置对象
 */
export const getConfig = (methodInstance: Method) => methodInstance.config;
/**
 * 获取alova配置数据
 * @returns alova配置对象
 */
export const getContextOptions = (alovaInstance: Alova<any, any, any, any, any, any, any>) => alovaInstance.options;
/**
 * 通过method实例获取alova配置数据
 * @returns alova配置对象
 */
export const getOptions = (methodInstance: Method) => getContextOptions(getContext(methodInstance));

/**
 * 获取请求方式的key值
 * @returns 此请求方式的key值
 */
export const key = (methodInstance: Method) => {
  const { params, headers } = getConfig(methodInstance);
  return JSONStringify([methodInstance.type, methodInstance.url, params, methodInstance.data, headers]);
};
/**
 * 获取method实例的key值
 * @param methodInstance method实例
 * @returns 此method实例的key值
 */
export const getMethodInternalKey = (methodInstance: Method) => methodInstance.__key__;
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

/**
 * 获取缓存的配置参数，固定返回{ e: number, m: number, s: boolean, t: string }格式的对象
 * e为expire缩写，表示缓存失效时间点（时间戳），单位为毫秒
 * m为mode缩写，存储模式
 * s为storage缩写，是否存储到本地
 * t为tag缩写，持久化存储标签
 * @param localCache 本地缓存参数
 * @returns 统一的缓存参数对象
 */
export const getLocalCacheConfigParam = (methodInstance: Method) => {
  const { localCache } = getConfig(methodInstance);
  const getCacheExpireTs = (cacheExpire: CacheExpire) =>
    isNumber(cacheExpire) ? getTime() + cacheExpire : getTime(cacheExpire || undefinedValue);
  let cacheMode: CacheMode = MEMORY;
  let expire = 0;
  let storage = falseValue;
  let tag: undefined | string = undefinedValue;
  if (!isFn(localCache)) {
    if (isNumber(localCache) || instanceOf(localCache, Date)) {
      expire = getCacheExpireTs(localCache);
    } else {
      const { mode = MEMORY, expire: configExpire = 0, tag: configTag } = localCache || {};
      cacheMode = mode;
      expire = getCacheExpireTs(configExpire);
      storage = [STORAGE_RESTORE].includes(mode);
      tag = configTag ? configTag.toString() : undefinedValue;
    }
  }
  return {
    e: expire,
    m: cacheMode,
    s: storage,
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
 * run event handlers with event.
 * @param handlers event handlers
 * @param event event instance
 * @param decorator event decorator defined on usehook middleware
 */
export const runEventHandlers = (
  handlers: GeneralFn[],
  event?: AlovaEvent<any, any, any, any, any, any, any, any, any>,
  decorator?: ((...args: any[]) => void) | undefined
) => {
  forEach(handlers, (handler, index) =>
    isFn(decorator) ? decorator(handler, event, index, len(handlers)) : handler(event)
  );
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

type GeneralFrameworkState = FrameworkState<unknown>;
export function statesHookHelper(
  statesHook: StatesHook<GeneralFrameworkState, GeneralFrameworkState>,
  referingObject: ReferingObject = {}
) {
  const ref = <D>(initialValue: D) => (statesHook.ref ? statesHook.ref(initialValue) : { current: initialValue });
  referingObject = ref(referingObject).current;
  const exportState = (state: GeneralFrameworkState) => (statesHook.export || _self)(state, referingObject);
  const memorize = <Callback extends (...args: any[]) => any>(fn: Callback) =>
    statesHook.memorize ? statesHook.memorize(fn) : fn;
  const update = (newValue: any, state: GeneralFrameworkState, key: string) =>
    statesHook.update({ [key]: newValue }, { [key]: state }, referingObject);
  const statesList = [] as string[];
  return {
    create: <D>(initialValue: D, key: string, isRef = falseValue) => {
      const state = statesHook.create(initialValue, referingObject, isRef) as FrameworkState<D>;
      statesList.push(key); // record the keys of created states.
      return [state, (newValue: D) => update(newValue, state, key)] as const;
    },
    computed: <D>(getter: () => D, depList: GeneralFrameworkState[], isRef = falseValue) =>
      statesHook.computed(getter, depList, referingObject, isRef) as FrameworkState<D>,
    export: exportState,
    batchExport: (...states: GeneralFrameworkState[]) => states.map(state => exportState(state)),
    dehydrate: <D>(state: FrameworkState<D>) => statesHook.dehydrate(state, referingObject) as D,
    effectRequest: (effectRequestParams: EffectRequestParams<any>) =>
      statesHook.effectRequest(effectRequestParams, referingObject),
    memorize,
    ref,
    watch: (source: GeneralFrameworkState[], callback: () => void) =>
      statesHook.watch(source, callback, referingObject),
    onMounted: (callback: () => void) => statesHook.onMounted(callback, referingObject),
    onUnmounted: (callback: () => void) => statesHook.onUnmounted(callback, referingObject),

    /**
     * refering object that sharing some value with this object.
     */
    __referingObj: referingObject,

    /**
     * batch export states and provide a update function that update states simply.
     * @param states new States
     * @param coreHookStates the returns of useRequest/useWatcher/useFetcher that contains update function
     * @returns exported states and update function
     */
    exportObject: <S extends Record<string, GeneralFrameworkState>>(
      states: S,
      coreHookStates: Record<string, any> = {}
    ) => {
      const exportedStates = objectKeys(states).reduce(
        (result, key) => {
          result[key] = exportState(states[key]);
          return result;
        },
        {} as Record<string, GeneralFrameworkState>
      );

      return {
        ...(exportedStates as Record<keyof S, GeneralFrameworkState>),
        __referingObj: referingObject,
        update: memorize((newStates: Record<string, any>) => {
          objectKeys(newStates).forEach(key => {
            if (statesList.includes(key)) {
              update(newStates[key], states[key], key);
            } else if (coreHookStates[key] && isFn(coreHookStates.update)) {
              coreHookStates.update({
                [key]: newStates[key]
              });
            }
          });
        })
      };
    }
  };
}
