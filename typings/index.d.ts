import { Writable } from 'svelte/store';
import { Ref, WatchSource } from 'vue';

type Arg = Record<string, any>;
export type RequestBody = Arg | string | FormData | Blob | ArrayBuffer | URLSearchParams | ReadableStream;

/** 进度信息 */
export type Progress = {
  total: number;
  loaded: number;
};

/**
 * 请求要素，发送请求必备的信息
 */
export interface RequestElements {
  readonly url: string;
  readonly type: MethodType;
  readonly headers: Arg;
  readonly data?: RequestBody;
}
export type ProgressUpdater = (loaded: number, total: number) => void;
export type AlovaRequestAdapter<R, T, RC, RE, RH> = (
  elements: RequestElements,
  method: Method<any, any, R, T, RC, RE, RH>
) => {
  response: () => Promise<RE>;
  headers: () => Promise<RH>;
  onDownload?: (handler: ProgressUpdater) => void;
  onUpload?: (handler: ProgressUpdater) => void;
  abort: () => void;
};

export type FrontRequestState<L = any, R = any, E = any, D = any, U = any> = {
  loading: L;
  data: R;
  error: E;
  downloading: D;
  uploading: U;
};
export type FetchRequestState<F = any, E = any, D = any, U = any> = {
  fetching: F;
  error: E;
  downloading: D;
  uploading: U;
};
export type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';

/** 全局的存储适配器 */
export interface AlovaGlobalStorage {
  /**
   * 设置存储
   * @param key 存储key
   * @param value 存储值
   */
  set(key: string, value: any): void;

  /**
   * 获取存储值
   * @param key 存储key
   */
  get(key: string): any;

  /**
   * 移除存储值
   * @param key 存储key
   */
  remove(key: string): void;
}

/**
 * 请求缓存设置
 * expire: 过期时间
 *  1. 当设置为数字时：如果大于0则首先返回缓存数据，过期时间单位为毫秒，小于等于0不缓存，Infinity为永不过期；
 *  2. 当设置为Date对象时，表示
 * mode: 缓存模式，可选值为memory、placeholder、restore
 */
export type CacheExpire = number | Date | null;
export type CacheMode = 'memory' | 'placeholder' | 'restore';
export type DetailLocalCacheConfig = {
  expire: CacheExpire;
  mode?: CacheMode;

  /** 持久化缓存标签，标签改变后原有持久化数据将会失效 */
  tag?: string | number;
};
export type LocalCacheConfig = CacheExpire | DetailLocalCacheConfig;
export type LocalCacheController<R> = () => R | undefined | Promise<R | undefined>;
export interface MethodRequestConfig {
  /**
   * url参数
   */
  params: Arg;

  /**
   * 请求头
   */
  headers: Arg;
}
export type AlovaMethodConfig<R, T, RC, RH> = {
  /**
   * method对象名称，在updateState、invalidateCache、setCache、以及fetch函数中可以通过名称或通配符获取对应method对象
   */
  name?: string | number;

  /**
   * 当前中断时间
   */
  timeout?: number;

  /**
   * 响应数据在缓存时间内则不再次请求。get、head请求默认保鲜5分钟（300000毫秒），其他请求默认不缓存
   */
  localCache?: LocalCacheConfig | LocalCacheController<R>;

  /**
   * 打击源方法实例，当源方法实例请求成功时，当前方法实例的缓存将被失效
   * 作为自动失效功能，只需设置打击源即可，而不需要手动调用invalidateCache失效缓存
   * 同时，此功能在错综复杂的失效关系中比invalidateCache方法更简洁
   * 该字段值可设置为method实例、其他method实例的name、name正则匹配，或者它们的数组
   */
  hitSource?: string | RegExp | Method | (string | RegExp | Method)[];

  /**
   * 是否启用下载进度信息，启用后每次请求progress才会有进度值，否则一致为0，默认不开启
   * @default false
   * @deprecated [v2.20.0+]自动判断是否启用下载进度
   */
  enableDownload?: boolean;

  /**
   * 是否启用上传进度信息，启用后每次请求progress才会有进度值，否则一致为0，默认不开启
   * @default false
   * @deprecated [v2.20.0+]自动判断是否启用上传进度
   */
  enableUpload?: boolean;

  /**
   * 响应数据转换，转换后的数据将转换为data状态，没有转换数据则直接用响应数据作为data状态
   */
  transformData?: (data: T, headers: RH) => R | Promise<R>;

  /**
   * 请求级共享请求开关
   * 开启共享请求后，同时发起相同请求时将共用同一个请求
   * 当这边设置后将覆盖全局的设置
   */
  shareRequest?: boolean;

  /**
   * method元数据
   */
  meta?: any;
} & RC;
export type AlovaMethodCreateConfig<R, T, RC, RH> = Partial<MethodRequestConfig> & AlovaMethodConfig<R, T, RC, RH>;

export type ResponsedHandler<S, E, RC, RE, RH> = (
  response: RE,
  methodInstance: Method<S, E, any, any, RC, RE, RH>
) => any;
export type ResponseErrorHandler<S, E, RC, RE, RH> = (
  error: any,
  methodInstance: Method<S, E, any, any, RC, RE, RH>
) => void | Promise<void>;
export type ResponseCompleteHandler<S, E, RC, RE, RH> = (methodInstance: Method<S, E, any, any, RC, RE, RH>) => any;
export type ResponsedHandlerRecord<S, E, RC, RE, RH> = {
  /**
   * 全局的请求成功钩子函数
   * 如果在全局onSuccess中抛出错误不会触发全局onError，而是会触发请求位置的onError
   */
  onSuccess?: ResponsedHandler<S, E, RC, RE, RH>;

  /**
   * 全局的请求错误钩子函数，请求错误是指网络请求失败，服务端返回404、500等错误代码不会进入此钩子函数
   * 当指定了全局onError捕获错误时，如果没有抛出错误则会触发请求位置的onSuccess
   */
  onError?: ResponseErrorHandler<S, E, RC, RE, RH>;

  /**
   * 请求完成钩子函数
   * 请求成功、缓存匹配成功、请求失败都将触发此钩子函数
   */
  onComplete?: ResponseCompleteHandler<S, E, RC, RE, RH>;
};

export const enum EnumHookType {
  USE_REQUEST = 1,
  USE_WATCHER = 2,
  USE_FETCHER = 3
}
export interface Hook {
  /** 最后一次请求的method实例 */
  m?: Method;

  /** saveStatesFns */
  sf: ((frontStates: FrontRequestState) => void)[];

  /** removeStatesFns */
  rf: (() => void)[];

  /** frontStates */
  fs: FrontRequestState;

  /** successHandlers */
  sh: SuccessHandler<any, any, any, any, any, any, any>[];

  /** errorHandlers */
  eh: ErrorHandler<any, any, any, any, any, any, any>[];

  /** completeHandlers */
  ch: CompleteHandler<any, any, any, any, any, any, any>[];

  /** hookType, useRequest=1, useWatcher=2, useFetcher=3 */
  ht: EnumHookType;

  /** hook config */
  c: UseHookConfig;

  /** enableDownload */
  ed: boolean;

  /** enableUpload */
  eu: boolean;
}
export interface EffectRequestParams<E> {
  handler: (...args: any[]) => void;
  removeStates: () => void;
  saveStates: (frontStates: FrontRequestState) => void;
  frontStates: FrontRequestState;
  watchingStates?: E[];
  immediate: boolean;
}

// create阶段，hook中的fs(frontStates)还未创建，此时的值为object类型
export interface CreateStageHook extends Hook {
  fs: FrontRequestState;
}
export interface StatesHook<S, E> {
  /**
   * 创建状态
   * @param initialValue 初始数据
   * @returns 状态值
   */
  create: <D>(initialValue: D, hook: CreateStageHook) => S;

  /**
   * 导出给开发者使用的值
   * @param state 状态值
   * @returns 导出的值
   */
  export: (state: S, hook: Hook) => E;

  /** 将状态转换为普通数据 */
  dehydrate: (state: S, key: string | symbol, hook: Hook) => any;
  /**
   * 更新状态值
   * @param newVal 新的数据集合
   * @param state 原状态值
   * @param hook use hook实例，每次use hook调用时都将生成一个hook实例
   */
  update: (newVal: Record<string, any>, state: Record<string, S>, hook: Hook) => void;

  /**
   * 控制执行请求的函数，此函数将在useRequest、useWatcher被调用时执行一次
   * 在useFetcher中的fetch函数中执行一次
   * 当watchingStates为空数组时，执行一次handleRequest函数
   * 当watchingStates为非空数组时，当状态变化时调用，immediate为true时，需立即调用一次
   * hook是use hook的实例，每次use hook调用时都将生成一个hook实例
   * 在vue中直接执行即可，而在react中需要在useEffect中执行
   * removeStates函数为清除当前状态的函数，应该在组件卸载时调用
   */
  effectRequest: (effectParams: EffectRequestParams<any>, hook: Hook) => void;

  /**
   * 包装send、abort等use hooks操作函数
   * 这主要用于优化在react中，每次渲染都会生成新函数的问题，优化性能
   * @param fn use hook操作函数
   * @returns 包装后的操作函数
   */
  memorize?: <T extends (...args: any[]) => any>(fn: T) => T;

  /**
   * 创建引用对象
   * @param initialValue 初始值
   * @returns 包含初始值的引用对象
   */
  ref?: <D>(initialValue: D) => { current: D };
}

export type GlobalLocalCacheConfig = Partial<Record<MethodType, LocalCacheConfig>> | null;
export type CacheLoggerHandler<S, E, RC, RE, RH> = (
  response: any,
  methodInstance: Method<S, E, any, any, RC, RE, RH>,
  cacheMode: CacheMode,
  tag: DetailLocalCacheConfig['tag']
) => void | Promise<void>;
/**
 * 泛型类型解释：
 * S: create函数创建的状态组的类型
 * E: export函数返回的状态组的类型
 * RC(RequestConfig): requestAdapter的请求配置类型，自动推断
 * RE(Response): 类型requestAdapter的响应配置类型，自动推断
 * RH(ResponseHeader): requestAdapter的响应头类型，自动推断
 */
export interface AlovaOptions<S, E, RC, RE, RH> {
  /** base地址 */
  baseURL?: string;

  /** 状态hook函数，用于定义和更新指定MVVM库的状态 */
  statesHook?: StatesHook<S, E>;

  /** 请求适配器 */
  requestAdapter: AlovaRequestAdapter<any, any, RC, RE, RH>;

  /** 请求超时时间 */
  timeout?: number;

  /**
   * 全局的请求本地缓存设置
   * expire: 过期时间，如果大于0则首先返回缓存数据，过期时间单位为毫秒，小于等于0不缓存，Infinity为永不过期
   * mode: 缓存模式，可选值为MEMORY、STORAGE_PLACEHOLDER、STORAGE_RESTORE
   * get请求默认缓存5分钟（300000毫秒），其他请求默认不缓存
   * @default { GET: 300000 }
   */
  localCache?: GlobalLocalCacheConfig;

  /** 持久化缓存接口，用于静默请求、响应数据持久化等 */
  storageAdapter?: AlovaGlobalStorage;

  /** 全局的请求前置钩子 */
  beforeRequest?: (method: Method<S, E, any, any, RC, RE, RH>) => void | Promise<void>;

  /**
   * @deprecated 因单词拼写错误并计划废弃，建议使用responded字段
   */
  responsed?: ResponsedHandler<S, E, RC, RE, RH> | ResponsedHandlerRecord<S, E, RC, RE, RH>;

  /**
   * 全局的响应钩子，可传一个也可以设置为带onSuccess和onError的对象，表示请求成功和请求错误的钩子
   * 如果在全局onSuccess中抛出错误不会触发全局onError，而是会触发请求位置的onError
   * 当指定了全局onError捕获错误时，如果没有抛出错误则会触发请求位置的onSuccess
   * @version 2.1.0
   */
  responded?: ResponsedHandler<S, E, RC, RE, RH> | ResponsedHandlerRecord<S, E, RC, RE, RH>;

  /**
   * 全局的共享请求开关
   * 开启共享请求后，同时发起相同请求时将共用同一个请求
   * @default true
   */
  shareRequest?: boolean;

  /**
   * 错误日志打印
   * 当请求错误，或者在全局的响应回调函数、请求级的transformData、localCache函数抛出错误时，将会触发onError，同时在控制台输出错误信息（默认）
   * 设置为false、null值时将不打印错误日志
   * 设置为自定义函数时将自定义接管错误信息的任务
   * @version 2.6.0
   * @default true
   */
  errorLogger?: boolean | null | ResponseErrorHandler<S, E, RC, RE, RH>;

  /**
   * 缓存日志打印
   * 当命中响应缓存时将默认在控制台打印匹配的缓存信息，以提醒开发者
   * 设置为false、null值时将不打印日志
   * 设置为自定义函数时将自定义接管缓存匹配的任务
   * @version 2.8.0
   * @default true
   */
  cacheLogger?: boolean | null | CacheLoggerHandler<S, E, RC, RE, RH>;
}

export type ProgressHandler = (progress: Progress) => void;

export interface AbortFunction {
  (): void;
  a: () => void;
}

/**
 * 请求方法类型
 */
export interface Method<S = any, E = any, R = any, T = any, RC = any, RE = any, RH = any> {
  /**
   * baseURL of alova instance
   */
  baseURL: string;
  /**
   * 请求地址
   */
  url: string;
  /**
   * 请求类型
   */
  type: MethodType;
  /**
   * method配置
   */
  config: MethodRequestConfig & AlovaMethodConfig<R, T, RC, RH>;
  /**
   * requestBody
   */
  data?: RequestBody;
  /**
   * 缓存打击源
   */
  hitSource?: (string | RegExp)[];
  /**
   * alova实例
   */
  context: Alova<S, E, RC, RE, RH>;

  /**
   * 存储临时的key
   */
  __key__: string;

  /**
   * 下载事件
   * @version 2.17.0
   */
  dhs: ProgressHandler[];

  /**
   * 上传事件
   * @version 2.17.0
   */
  uhs: ProgressHandler[];

  /**
   * 本次响应数据是否来自缓存
   * @version 2.17.0
   */
  fromCache: boolean | undefined;

  /**
   * 用于在全局的request和response钩子函数中传递额外信息所用
   * js项目中可使用任意字段
   */
  meta?: any;

  /**
   * 使用此method实例直接发送请求
   * @param forceRequest 强制请求
   * @returns 请求Promise实例
   */
  send(forceRequest?: boolean): Promise<R>;

  /**
   * 设置名称
   * @param name 名称
   */
  setName(name: string | number): void;

  /**
   * 中断此method实例直接发送的请求
   */
  abort: AbortFunction;

  /**
   * 绑定resolve和/或reject Promise的callback
   * @param onfullified resolve Promise时要执行的回调
   * @param onrejected 当Promise被reject时要执行的回调
   * @returns 返回一个Promise，用于执行任何回调
   */
  then<TResult1 = R, TResult2 = never>(
    onfulfilled?: (value: R) => TResult1 | PromiseLike<TResult1>,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2>;

  /**
   * 绑定一个仅用于reject Promise的回调
   * @param onrejected 当Promise被reject时要执行的回调
   * @returns 返回一个完成回调的Promise
   */
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<R | TResult>;

  /**
   * 绑定一个回调，该回调在Promise结算（resolve或reject）时调用
   * @param onfinally Promise结算（resolve或reject）时执行的回调。
   * @return 返回一个完成回调的Promise。
   */
  finally(onfinally?: (() => void) | undefined | null): Promise<R>;

  /**
   * 绑定下载进度回调函数
   * @param progressHandler 下载进度回调函数
   * @version 2.17.0
   * @return 解绑函数
   */
  onDownload(progressHandler: ProgressHandler): () => void;

  /**
   * 绑定上传进度回调函数
   * @param progressHandler 上传进度回调函数
   * @version 2.17.0
   * @return 解绑函数
   */
  onUpload(progressHandler: ProgressHandler): () => void;
}
export interface MethodConstructor {
  new <S, E, R, T, RC, RE, RH>(
    type: MethodType,
    context: Alova<S, E, RC, RE, RH>,
    url: string,
    config?: AlovaMethodCreateConfig<R, T, RC, RH>,
    data?: RequestBody
  ): Method<S, E, R, T, RC, RE, RH>;
  readonly prototype: Method;
}
export declare const Method: MethodConstructor;

export interface Alova<S, E, RC, RE, RH> {
  options: AlovaOptions<S, E, RC, RE, RH>;
  id: string;
  storage: AlovaGlobalStorage;
  Get<R, T = unknown>(url: string, config?: AlovaMethodCreateConfig<R, T, RC, RH>): Method<S, E, R, T, RC, RE, RH>;
  Post<R, T = unknown>(
    url: string,
    data?: RequestBody,
    config?: AlovaMethodCreateConfig<R, T, RC, RH>
  ): Method<S, E, R, T, RC, RE, RH>;
  Put<R, T = unknown>(
    url: string,
    data?: RequestBody,
    config?: AlovaMethodCreateConfig<R, T, RC, RH>
  ): Method<S, E, R, T, RC, RE, RH>;
  Delete<R, T = unknown>(
    url: string,
    data?: RequestBody,
    config?: AlovaMethodCreateConfig<R, T, RC, RH>
  ): Method<S, E, R, T, RC, RE, RH>;
  Head<R, T = unknown>(url: string, config?: AlovaMethodCreateConfig<R, T, RC, RH>): Method<S, E, R, T, RC, RE, RH>;
  Options<R, T = unknown>(url: string, config?: AlovaMethodCreateConfig<R, T, RC, RH>): Method<S, E, R, T, RC, RE, RH>;
  Patch<R, T = unknown>(
    url: string,
    data?: RequestBody,
    config?: AlovaMethodCreateConfig<R, T, RC, RH>
  ): Method<S, E, R, T, RC, RE, RH>;
}

/** 根事件对象 */
export interface AlovaEvent<S, E, R, T, RC, RE, RH, ARG = any> {
  sendArgs: [...ARG, ...any]; // F保存methodHandler的args元组类型
  method: Method<S, E, R, T, RC, RE, RH>;
}
/** 成功事件对象 */
export interface AlovaSuccessEvent<S, E, R, T, RC, RE, RH, ARG = any> extends AlovaEvent<S, E, R, T, RC, RE, RH, ARG> {
  /** data数据是否来自缓存 */
  fromCache: boolean;
  data: R;
}
/** 错误事件对象 */
export interface AlovaErrorEvent<S, E, R, T, RC, RE, RH, ARG = any> extends AlovaEvent<S, E, R, T, RC, RE, RH, ARG> {
  error: any;
}
/** 完成事件对象 */
export interface AlovaCompleteEvent<S, E, R, T, RC, RE, RH, ARG = any> extends AlovaEvent<S, E, R, T, RC, RE, RH, ARG> {
  /** 响应状态 */
  status: 'success' | 'error';
  /** data数据是否来自缓存，当status为error时，fromCache始终为false */
  fromCache: boolean;
  data?: R;
  error?: any;
}

export type SuccessHandler<S, E, R, T, RC, RE, RH, ARG = any> = (
  event: AlovaSuccessEvent<S, E, R, T, RC, RE, RH, ARG>
) => void;
export type ErrorHandler<S, E, R, T, RC, RE, RH, ARG = any> = (
  event: AlovaErrorEvent<S, E, R, T, RC, RE, RH, ARG>
) => void;
export type CompleteHandler<S, E, R, T, RC, RE, RH, ARG = any> = (
  event: AlovaCompleteEvent<S, E, R, T, RC, RE, RH, ARG>
) => void;

export type FrontExportedUpdate<R> = (
  newFrontStates: Partial<FrontRequestState<boolean, R, Error | undefined, Progress, Progress>>
) => void;
export type FetcherExportedUpdate = (
  newFetcherStates: Partial<FetchRequestState<boolean, Error | undefined, Progress, Progress>>
) => void;
export interface AlovaMiddlewareContext<S, E, R, T, RC, RE, RH> {
  /** 当前的method对象 */
  method: Method<S, E, R, T, RC, RE, RH>;

  /** 命中的缓存数据 */
  cachedResponse: R | undefined;

  /** 当前的usehook配置对象 */
  config: any;

  /** 中断函数 */
  abort: UseHookReturnType<any, S>['abort'];

  /** 成功回调装饰 */
  decorateSuccess: (
    decorator: (
      handler: SuccessHandler<S, E, R, T, RC, RE, RH>,
      event: AlovaSuccessEvent<S, E, R, T, RC, RE, RH>,
      index: number,
      length: number
    ) => void
  ) => void;

  /** 失败回调装饰 */
  decorateError: (
    decorator: (
      handler: ErrorHandler<S, E, R, T, RC, RE, RH>,
      event: AlovaErrorEvent<S, E, R, T, RC, RE, RH>,
      index: number,
      length: number
    ) => void
  ) => void;

  /** 完成回调装饰 */
  decorateComplete: (
    decorator: (
      handler: CompleteHandler<S, E, R, T, RC, RE, RH>,
      event: AlovaCompleteEvent<S, E, R, T, RC, RE, RH>,
      index: number,
      length: number
    ) => void
  ) => void;
}

/**
 * useRequest和useWatcher中间件的context参数
 */
export interface AlovaFrontMiddlewareContext<S, E, R, T, RC, RE, RH, ARG extends any[] = any[]>
  extends AlovaMiddlewareContext<S, E, R, T, RC, RE, RH> {
  /** 发送请求函数 */
  send: SendHandler<R, ARG>;

  /** sendArgs 响应处理回调的参数，该参数由use hooks的send传入 */
  sendArgs: any[];

  /** 前端状态集合 */
  frontStates: FrontRequestState<
    ExportedType<boolean, S>,
    ExportedType<R, S>,
    ExportedType<Error | undefined, S>,
    ExportedType<Progress, S>,
    ExportedType<Progress, S>
  >;

  /** 状态更新函数 */
  update: FrontExportedUpdate<R>;

  /**
   * 调用后将自定义控制loading的状态，内部不再触发loading状态的变更
   * 传入control为false时将取消控制
   *
   * @param control 是否控制loading，默认为true
   */
  controlLoading: (control?: boolean) => void;
}

/**
 * useFetcher中间件的context参数
 */
export interface AlovaFetcherMiddlewareContext<S, E, R, T, RC, RE, RH, ARG extends any[] = any[]>
  extends AlovaMiddlewareContext<S, E, R, T, RC, RE, RH> {
  /** 数据预加载函数 */
  fetch<R>(matcher: MethodMatcher<any, any, R, any, any, any, any>, ...args: [...ARG, ...any]): Promise<R>;

  /** fetchArgs 响应处理回调的参数，该参数由useFetcher的fetch传入 */
  fetchArgs: any[];

  /** fetch状态集合 */
  fetchStates: FetchRequestState<
    ExportedType<boolean, S>,
    ExportedType<Error | undefined, S>,
    ExportedType<Progress, S>,
    ExportedType<Progress, S>
  >;

  /** 状态更新函数 */
  update: FetcherExportedUpdate;

  /**
   * 调用后将自定义控制fetching的状态，内部不再触发fetching状态的变更
   * 传入control为false时将取消控制
   *
   * @param control 是否控制fetching，默认为true
   */
  controlFetching: (control?: boolean) => void;
}

/** 中间件next函数 */
export interface MiddlewareNextGuardConfig<S, E, R, T, RC, RE, RH> {
  force?: UseHookConfig['force'];
  method?: Method<S, E, R, T, RC, RE, RH>;
}
export interface AlovaGuardNext<S, E, R, T, RC, RE, RH> {
  (guardNextConfig?: MiddlewareNextGuardConfig<S, E, R, T, RC, RE, RH>): Promise<R>;
}

/**
 * alova useRequest/useWatcher中间件
 */
export interface AlovaFrontMiddleware<S, E, R, T, RC, RE, RH, ARG = any> {
  (
    context: AlovaFrontMiddlewareContext<S, E, R, T, RC, RE, RH, ARG>,
    next: AlovaGuardNext<S, E, R, T, RC, RE, RH>
  ): any;
}
/**
 * alova useRequest/useWatcher中间件
 */
export interface AlovaFetcherMiddleware<S, E, R, T, RC, RE, RH, ARG = any> {
  (
    context: AlovaFetcherMiddlewareContext<S, E, R, T, RC, RE, RH, ARG>,
    next: AlovaGuardNext<S, E, R, T, RC, RE, RH>
  ): any;
}

/** hook通用配置 */
export interface UseHookConfig<ARG = any> {
  /** 是否强制请求 */
  force?: boolean | ((...args: [...ARG, ...any]) => boolean);

  [attr: string]: any;
}

/** useRequest和useWatcher都有的类型 */
export interface FrontRequestHookConfig<S, E, R, T, RC, RE, RH, ARG = any> extends UseHookConfig<ARG> {
  /** 是否立即发起一次请求 */
  immediate?: boolean;

  /** 初始数据 */
  initialData?: any;

  /** 额外的监管状态，可通过updateState更新 */
  managedStates?: Record<string | symbol, S>;

  /** 中间件 */
  middleware?: AlovaFrontMiddleware<S, E, R, T, RC, RE, RH, ARG>;
}

/** useRequest config export type */
export type RequestHookConfig<S, E, R, T, RC, RE, RH, ARG> = FrontRequestHookConfig<S, E, R, T, RC, RE, RH, ARG>;

export type SendableConfig<S, E, R, T, RC, RE, RH> = (alovaEvent: AlovaEvent<S, E, R, T, RC, RE, RH>) => boolean;

/** useWatcher config export type */
export interface WatcherHookConfig<S, E, R, T, RC, RE, RH, ARG = any>
  extends FrontRequestHookConfig<S, E, R, T, RC, RE, RH, ARG> {
  /** 请求防抖时间（毫秒），传入数组时可按watchingStates的顺序单独设置防抖时间 */
  debounce?: number | number[];
  sendable?: SendableConfig<S, E, R, T, RC, RE, RH>;
  abortLast?: boolean;
}

/** useFetcher config export type */
export interface FetcherHookConfig<ARG = any> extends UseHookConfig<ARG> {
  /** 中间件 */
  middleware?: AlovaFetcherMiddleware<any, any, any, any, any, any, any, ARG>;
  /** fetch是否同步更新data状态 */
  updateState?: boolean;
}

/** 调用useFetcher时需要传入的类型，否则会导致状态类型错误 */
export type FetcherType<A extends Alova<any, any, any, any, any>> = {
  state: ReturnType<NonNullable<A['options']['statesHook']>['create']>;
  export: ReturnType<NonNullable<A['options']['statesHook']>['export']>;
};

/**
 * 以支持React和Vue的方式定义类型，后续需要其他类型再在这个基础上变化
 * 使用不同库的特征作为父类进行判断
 */
export interface SvelteWritable {
  set(this: void, value: any): void;
}
export interface VueRef {
  value: any;
}
export type ExportedType<R, S> = S extends VueRef ? Ref<R> : S extends SvelteWritable ? Writable<R> : R;
export type SendHandler<R, ARG extends any[] = any[]> = (...args: [...ARG, ...any]) => Promise<R>;
export type UseHookReturnType<
  S = any,
  E = any,
  R = any,
  T = any,
  RC = any,
  RE = any,
  RH = any,
  ARG extends any[] = any[]
> = FrontRequestState<
  ExportedType<boolean, S>,
  ExportedType<R, S>,
  ExportedType<Error | undefined, S>,
  ExportedType<Progress, S>,
  ExportedType<Progress, S>
> & {
  abort: () => void;
  update: FrontExportedUpdate<R>;
  send: SendHandler<R, ARG>;
  onSuccess: (handler: SuccessHandler<S, E, R, T, RC, RE, RH, ARG>) => void;
  onError: (handler: ErrorHandler<S, E, R, T, RC, RE, RH, ARG>) => void;
  onComplete: (handler: CompleteHandler<S, E, R, T, RC, RE, RH, ARG>) => void;
};
export type UseFetchHookReturnType<S, ARG extends any[] = any[]> = FetchRequestState<
  ExportedType<boolean, S>,
  ExportedType<Error | undefined, S>,
  ExportedType<Progress, S>,
  ExportedType<Progress, S>
> & {
  fetch<R>(matcher: MethodMatcher<any, any, R, any, any, any, any>, ...args: [...ARG, ...any]): Promise<R>;
  update: FetcherExportedUpdate;
  abort: UseHookReturnType<any, S, any, any, any, any, any, ARG>['abort'];
  onSuccess: UseHookReturnType<any, S, any, any, any, any, any, ARG>['onSuccess'];
  onError: UseHookReturnType<any, S, any, any, any, any, any, ARG>['onError'];
  onComplete: UseHookReturnType<any, S, any, any, any, any, any, ARG>['onComplete'];
};

export interface MethodFilterHandler {
  (method: Method, index: number, methods: Method[]): boolean;
}

export type MethodDetaiedFilter = {
  name?: string | RegExp;
  filter?: MethodFilterHandler;
  alova?: Alova<any, any, any, any, any>;
};
export type MethodFilter = string | RegExp | MethodDetaiedFilter;
export type MethodMatcher<S, E, R, T, RC, RE, RH> = Method<S, E, R, T, RC, RE, RH> | MethodFilter;

export type UpdateStateCollection<R> = {
  [key: string | number | symbol]: (data: any) => any;
} & {
  data?: (data: R) => any;
};
/**
 * MethodHandler类型用于约束methodhandler为回调函数
 */
export type MethodHandler<S, E, R, T, RC, RE, RH, ARG extends any[] = any[]> = (
  ...args: ARG
) => Method<S, E, R, T, RC, RE, RH>;

export type AlovaMethodHandler<S, E, R, T, RC, RE, RH, ARG> = MethodHandler<S, E, R, T, RC, RE, RH, ARG>;

/**
 * alova全局配置
 */
export interface AlovaGlobalConfig {
  /**
   * method快照数量限制，设置为0表示关闭保存快照，关闭后method快照匹配器将不可用
   * @default 1000
   */
  limitSnapshots?: number;
}

// ************ 导出类型 ***************

/**
 * 创建alova实例
 * @param options 全局选项
 * @returns alova实例
 */
export declare function createAlova<S, E, RC, RE, RH>(options: AlovaOptions<S, E, RC, RE, RH>): Alova<S, E, RC, RE, RH>;

/**
 * 自动管理响应状态hook
 * @example
 * ```js
 * const { loading, data, error, send, onSuccess } = useRequest(alova.Get('/api/user'))
 * ```
 * @param methodHandler method实例或获取函数
 * @param config 配置项
 * @returns 响应式请求数据、操作函数及事件绑定函数
 */
export declare function useRequest<S, E, R, T, RC, RE, RH, ARG extends any[]>(
  methodHandler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH, ARG>,
  config?: RequestHookConfig<S, E, R, T, RC, RE, RH, ARG>
): UseHookReturnType<S, E, R, T, RC, RE, RH, ARG>;

/**
 * 监听特定状态值变化后请求
 * @example
 * ```js
 *  const { data, loading, error, send, onSuccess } = useWatcher(() => alova.Get('/api/user-list'), [keywords])
 * ```
 * @param methodHandler method实例或获取函数
 * @param watchingStates 监听状态数组
 * @param config 配置项
 * @returns 响应式请求数据、操作函数及事件绑定函数
 */
export declare function useWatcher<S, E, R, T, RC, RE, RH, ARG extends any[]>(
  methodHandler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH, ARG>,
  watchingStates: S extends VueRef ? (WatchSource<any> | object)[] : S extends SvelteWritable ? Writable<any>[] : any[],
  config?: WatcherHookConfig<S, E, R, T, RC, RE, RH, ARG>
): UseHookReturnType<S, E, R, T, RC, RE, RH, ARG>;

/**
 * 数据预拉取
 * @example
 * ```js
 * const { fetching, error, fetch } = useFetcher();
 * const handleFetch = () => {
 *   fetch(alova.Get('/api/profile'));
 * };
 * ```
 * @param config 配置项
 * @returns 响应式请求数据、操作函数及事件绑定函数
 */
export declare function useFetcher<SE extends FetcherType<any>, ARG extends any[]>(
  config?: FetcherHookConfig<ARG>
): UseFetchHookReturnType<SE['state'], ARG>;

/**
 * 失效缓存数据
 * @example
 * ```js
 * // 失效指定请求的缓存数据
 * invalidateCAche(alova.Get('/api/profile'));
 *
 * // 通过method名称匹配失效源
 * invalidateCAche('profile-test');
 *
 * // 失效所有请求的缓存数据
 * invalidateCAche();
 * ```
 * @param matcher method实例数组或method匹配器参数
 */
export declare function invalidateCache<S, E, R, T, RC, RE, RH>(
  matcher?: MethodMatcher<S, E, R, T, RC, RE, RH> | Method<S, E, R, T, RC, RE, RH>[]
): void;

export interface UpdateOptions {
  onMatch?: (method: Method) => void;
}
/**
 * 根据method实例更新对应的状态化响应数据
 * @example
 * ```js
 * updateState(methodInstance, newData);
 * updateState(methodInstance, oldData => {
 *   oldData.name = 'new name';
 *   return oldData;
 * });
 * ```
 * @param matcher method实例或method匹配器参数
 * @param handleUpdate 新的响应数据或更新函数
 * @param options 配置项
 * @returns 是否已更新
 */
export declare function updateState<R = any, S = any, E = any, T = any, RC = any, RE = any, RH = any>(
  matcher: MethodMatcher<S, E, R, T, RC, RE, RH>,
  handleUpdate: UpdateStateCollection<R>['data'] | UpdateStateCollection<R>,
  options?: UpdateOptions
): boolean;

/**
 * 设置缓存
 * @example
 * ```js
 * // 设置静态缓存
 * setCache(methodInstance, newData);
 *
 * // 动态设置缓存
 * setCache(methodInstance, oldData => {
 *   if (oldData.name === 'new name') {
 *     // 不返回数据表示取消更新缓存
 *     return;
 *   }
 *   old.name = 'new name';
 *   return oldData;
 * });
 * ```
 * @param matcher method实例或method匹配器参数
 */
export declare function setCache<R = any, S = any, E = any, T = any, RC = any, RE = any, RH = any>(
  matcher: MethodMatcher<S, E, R, T, RC, RE, RH> | Method<S, E, R, T, RC, RE, RH>[],
  dataOrUpdater: R | ((oldCache: R) => R | undefined | void)
): void;

/**
 * 查询缓存数据
 * @param matcher method实例或method匹配器参数
 * @returns 缓存数据，未查到则返回undefined
 */
export declare function queryCache<R = any, S = any, E = any, T = any, RC = any, RE = any, RH = any>(
  matcher: MethodMatcher<S, E, R, T, RC, RE, RH>
): R | undefined;

/**
 * 以匹配的方式获取method实例快照，即已经请求过的method实例
 * @param {MethodFilter} matcher method实例匹配器
 * @param {boolean} matchAll 是否匹配全部，默认为true
 * @returns {Method[] | Method} matchAll为true时返回method实例数组，否则返回method实例或undefined
 */
export declare function matchSnapshotMethod<M extends boolean = true>(
  matcher: MethodFilter,
  matchAll?: M
): M extends true ? Method[] : Method | undefined;

/**
 * 获取请求方式的key值
 * @param {Method} methodInstance method实例
 * @returns — 此请求方式的key值
 */
export declare function getMethodKey<S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>): string;

/**
 * 全局设置
 * @param config 配置项
 */
export declare function globalConfig(config: AlovaGlobalConfig): void;
