import { Writable } from 'svelte/store';
import { Ref } from 'vue';

type Arg = Record<string, any>;
type RequestBody = Arg | FormData | Blob | ArrayBuffer | ReadableStream;

/** 进度信息 */
type Progress = {
  total: number;
  loaded: number;
};

/**
 * 请求要素，发送请求必备的信息
 */
interface RequestElements {
  readonly url: string;
  readonly type: MethodType;
  readonly headers: Arg;
  readonly data?: RequestBody;
}
type ProgressUpdater = (loaded: number, total: number) => void;
type AlovaRequestAdapter<R, T, RC, RE, RH> = (
  elements: RequestElements,
  method: Method<any, any, R, T, RC, RE, RH>
) => {
  response: () => Promise<RE>;
  headers: () => Promise<RH>;
  onDownload?: (handler: ProgressUpdater) => void;
  onUpload?: (handler: ProgressUpdater) => void;
  abort: () => void;
};

type FrontRequestState<L = any, R = any, E = any, D = any, U = any> = {
  loading: L;
  data: R;
  error: E;
  downloading: D;
  uploading: U;
  [x: string | number | symbol]: any;
};
type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';

/** 全局storage适配器对象 */
interface GlobalStorage {
  set(method: Method, value: any): void;
  get(method: Method): any;
  remove(method: Method): void;
}

/**
 * method实例内的storage对象
 */
interface MethodStorage {
  set?: (method: Method, value: any, globalStorage: GlobalStorage) => void;
  get?: (method: Method, globalStorage: GlobalStorage) => any;
  remove?: (method: Method, globalStorage: GlobalStorage) => void;
}

/**
 * 请求缓存设置
 * expire: 过期时间
 *  1. 当设置为数字时：如果大于0则首先返回缓存数据，过期时间单位为毫秒，小于等于0不缓存，Infinity为永不过期；
 *  2. 当设置为Date对象时，表示
 * mode: 缓存模式，可选值为memory、placeholder、restore
 */
type CacheExpire = number | Date;
type DetailLocalCacheConfig = {
  expire: CacheExpire;
  mode?: 'memory' | 'placeholder' | 'restore';

  /** 持久化缓存标签，标签改变后原有持久化数据将会失效 */
  tag?: string | number;
};
type LocalCacheConfig = CacheExpire | DetailLocalCacheConfig;
type AlovaMethodConfig<R, T, RC, RH> = {
  /** method对象名称，在updateState、invalidateCache、setCacheData、以及fetch函数中可以通过名称或通配符获取对应method对象 */
  name?: string | number;
  params?: Arg;
  headers?: Arg;

  /** 当前中断时间 */
  timeout?: number;

  /** 响应数据在缓存时间内则不再次请求。get、head请求默认保鲜5分钟（300000毫秒），其他请求默认不缓存 */
  localCache?: LocalCacheConfig;

  /**
   * 打击源方法实例，当源方法实例请求成功时，当前方法实例的缓存将被失效
   * 作为自动失效功能，只需设置打击源即可，而不需要手动调用invalidateCache失效缓存
   * 同时，此功能在错综复杂的失效关系中比invalidateCache方法更简洁
   * 该字段值可设置为method实例、其他method实例的name、name正则匹配，或者它们的数组
   */
  hitSource?: string | RegExp | Method | (string | RegExp | Method)[];

  /** 是否启用下载进度信息，启用后每次请求progress才会有进度值，否则一致为0，默认不开启 */
  enableDownload?: boolean;

  /** 是否启用上传进度信息，启用后每次请求progress才会有进度值，否则一致为0，默认不开启 */
  enableUpload?: boolean;

  /** 响应数据转换，转换后的数据将转换为data状态，没有转换数据则直接用响应数据作为data状态 */
  transformData?: (data: T, headers: RH) => R;

  /** 请求级的存储适配器，设置后将通过此适配器管理存储 */
  storageAdapter: MethodStorage;
} & RC;

type ResponsedHandler<R, T, RC, RE, RH> = (response: RE, methodInstance: Method<any, any, R, T, RC, RE, RH>) => any;
type ResponseErrorHandler<R, T, RC, RE, RH> = (error: any, methodInstance: Method<any, any, R, T, RC, RE, RH>) => void;
type ResponsedHandlerRecord<R, T, RC, RE, RH> = {
  onSuccess?: ResponsedHandler<R, T, RC, RE, RH>;
  onError?: ResponseErrorHandler<R, T, RC, RE, RH>;
};
interface EffectRequestParams<E> {
  handler: (...args: any[]) => void;
  removeStates: () => void;
  saveStates: (frontStates: FrontRequestState) => void;
  frontStates: FrontRequestState;
  watchingStates?: E[];
  immediate: boolean;
}

interface StatesHook<S, E> {
  create: <D>(data: D) => S;
  export: (state: S) => E;

  /** 将状态转换为普通数据 */
  dehydrate: (state: S) => any;
  update: (newVal: Partial<FrontRequestState>, state: FrontRequestState) => void;

  /**
   * 控制执行请求的函数，此函数将在useRequest、useWatcher被调用时执行一次
   * 在useFetcher中的fetch函数中执行一次
   * 当watchedStates为空数组时，执行一次handleRequest函数
   * 当watchedStates为非空数组时，当状态变化时调用，immediate为true时，需立即调用一次
   * 在vue中直接执行即可，而在react中需要在useEffect中执行
   * removeStates函数为清除当前状态的函数，应该在组件卸载时调用
   */
  effectRequest: (effectParams: EffectRequestParams<E>) => void;
}

type GlobalLocalCacheConfig = Partial<Record<MethodType, LocalCacheConfig>>;
/**
 * 泛型类型解释：
 * S: create函数创建的状态组的类型
 * E: export函数返回的状态组的类型
 * RC(RequestConfig): requestAdapter的请求配置类型，自动推断
 * RE(Response): 类型requestAdapter的响应配置类型，自动推断
 * RH(ResponseHeader): requestAdapter的响应头类型，自动推断
 */
interface AlovaOptions<S, E, RC, RE, RH> {
  /** base地址 */
  baseURL: string;

  /** 状态hook函数，用于定义和更新指定MVVM库的状态 */
  statesHook: StatesHook<S, E>;

  /** 请求适配器 */
  requestAdapter: AlovaRequestAdapter<any, any, RC, RE, RH>;

  /** 请求超时时间 */
  timeout?: number;

  /**
   * 全局的请求本地缓存设置
   * expire: 过期时间，如果大于0则首先返回缓存数据，过期时间单位为毫秒，小于等于0不缓存，Infinity为永不过期
   * mode: 缓存模式，可选值为MEMORY、STORAGE_PLACEHOLDER、STORAGE_RESTORE
   * get请求默认缓存5分钟（300000毫秒），其他请求默认不缓存
   */
  localCache?: GlobalLocalCacheConfig;

  /** 持久化缓存接口，用于静默请求、响应数据持久化等 */
  storageAdapter?: GlobalStorage;

  /** 全局的请求前置钩子 */
  beforeRequest?: (method: Method<S, E, any, any, RC, RE, RH>) => void;

  /**
   * 全局的响应钩子，可传一个数组表示正常响应和响应出错的钩子
   * 如果正常响应的钩子抛出错误也将进入响应失败的钩子函数
   */
  responsed?: ResponsedHandler<any, any, RC, RE, RH> | ResponsedHandlerRecord<any, any, RC, RE, RH>;
}

/** 请求方法类型 */
interface Method<S = any, E = any, R = any, T = any, RC = any, RE = any, RH = any> {
  baseURL: string;
  url: string;
  type: MethodType;
  config: AlovaMethodConfig<R, T, RC, RH>;
  requestBody?: RequestBody;
  hitSource?: (string | RegExp)[];
  context: Alova<S, E, RC, RE, RH>;
  response: R;

  /**
   * 用于在全局的request和response钩子函数中传递额外信息所用
   * js项目中可使用任意字段
   */
  extra?: any;
  send(forceRequest?: boolean): Promise<R>;
  setName(name: string | number): void;
}
interface MethodConstructor {
  new <S, E, R, T, RC, RE, RH>(
    type: MethodType,
    context: Alova<S, E, RC, RE, RH>,
    url: string,
    config?: AlovaMethodConfig<R, T, RC, RH>,
    requestBody?: RequestBody
  ): Method<S, E, R, T, RC, RE, RH>;
  readonly prototype: Method;
}
declare const Method: MethodConstructor;

interface Alova<S, E, RC, RE, RH> {
  options: AlovaOptions<S, E, RC, RE, RH>;
  id: string;
  storage: GlobalStorage;
  Get<R, T = unknown>(url: string, config?: AlovaMethodConfig<R, T, RC, RH>): Method<S, E, R, T, RC, RE, RH>;
  Post<R, T = unknown>(
    url: string,
    requestBody?: RequestBody,
    config?: AlovaMethodConfig<R, T, RC, RH>
  ): Method<S, E, R, T, RC, RE, RH>;
  Put<R, T = unknown>(
    url: string,
    requestBody?: RequestBody,
    config?: AlovaMethodConfig<R, T, RC, RH>
  ): Method<S, E, R, T, RC, RE, RH>;
  Delete<R, T = unknown>(
    url: string,
    requestBody?: RequestBody,
    config?: AlovaMethodConfig<R, T, RC, RH>
  ): Method<S, E, R, T, RC, RE, RH>;
  Head<R, T = unknown>(url: string, config?: AlovaMethodConfig<R, T, RC, RH>): Method<S, E, R, T, RC, RE, RH>;
  Options<R, T = unknown>(url: string, config?: AlovaMethodConfig<R, T, RC, RH>): Method<S, E, R, T, RC, RE, RH>;
  Patch<R, T = unknown>(
    url: string,
    requestBody?: RequestBody,
    config?: AlovaMethodConfig<R, T, RC, RH>
  ): Method<S, E, R, T, RC, RE, RH>;
}

/** 根事件对象 */
interface AlovaEvent<S, E, R, T, RC, RE, RH> {
  sendArgs: any[];
  method: Method<S, E, R, T, RC, RE, RH>;
}
/** 成功事件对象 */
interface AlovaSuccessEvent<S, E, R, T, RC, RE, RH> extends AlovaEvent<S, E, R, T, RC, RE, RH> {
  data: R;
}
/** 错误事件对象 */
interface AlovaErrorEvent<S, E, R, T, RC, RE, RH> extends AlovaEvent<S, E, R, T, RC, RE, RH> {
  error: any;
}
/** 完成事件对象 */
interface AlovaCompleteEvent<S, E, R, T, RC, RE, RH> extends AlovaEvent<S, E, R, T, RC, RE, RH> {
  status: 'success' | 'error';
  data?: R;
  error?: any;
}

type SuccessHandler<S, E, R, T, RC, RE, RH> = (event: AlovaSuccessEvent<S, E, R, T, RC, RE, RH>) => void;
type ErrorHandler<S, E, R, T, RC, RE, RH> = (event: AlovaErrorEvent<S, E, R, T, RC, RE, RH>) => void;
type CompleteHandler<S, E, R, T, RC, RE, RH> = (event: AlovaCompleteEvent<S, E, R, T, RC, RE, RH>) => void;

type ExportedUpdate<R> = (
  newFrontStates: Partial<FrontRequestState<boolean, R, Error | undefined, Progress, Progress>>
) => void;
interface AlovaMiddlewareContext<S, E, R, T, RC, RE, RH> {
  /** 当前的method对象 */
  method: Method<S, E, R, T, RC, RE, RH>;

  /** 命中的缓存数据 */
  cachedResponse: R | undefined;

  /** sendArgs 响应处理回调的参数，该参数由use hooks的send传入 */
  sendArgs: any[];

  /** 当前的usehook配置对象 */
  config: any;

  /** 状态更新函数 */
  update: ExportedUpdate<R>;

  /** 前端状态集合 */
  frontStates: FrontRequestState<
    ExportedType<boolean, S>,
    ExportedType<R, S>,
    ExportedType<Error | undefined, S>,
    ExportedType<Progress, S>,
    ExportedType<Progress, S>
  >;

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

/** 中间件next函数 */
interface MiddlewareNextGuardConfig<S, E, R, T, RC, RE, RH> {
  force?: UseHookConfig<S, E, R, T, RC, RE, RH>['force'];
  method?: Method;
}
interface AlovaGuardNext<S, E, R, T, RC, RE, RH> {
  (guardNextConfig?: MiddlewareNextGuardConfig<S, E, R, T, RC, RE, RH>): Promise<R>;
}

/** alova中间件类型 */
interface AlovaMiddleware<S, E, R, T, RC, RE, RH> {
  (context: AlovaMiddlewareContext<S, E, R, T, RC, RE, RH>, next: AlovaGuardNext<S, E, R, T, RC, RE, RH>): Promise<any>;
}

/** hook通用配置 */
interface UseHookConfig<S, E, R, T, RC, RE, RH> {
  /** 是否强制请求 */
  force?: boolean | (() => boolean);

  /** 中间件 */
  middleware?: AlovaMiddleware<S, E, R, T, RC, RE, RH>;
}

/** useRequest和useWatcher都有的类型 */
interface FrontRequestHookConfig<S, E, R, T, RC, RE, RH> extends UseHookConfig<S, E, R, T, RC, RE, RH> {
  /** 开启immediate后，useRequest会立即发起一次请求 */
  immediate?: boolean;

  /** 初始数据 */
  initialData?: any;

  /** 额外的监管状态，可通过updateState更新 */
  managedStates?: Record<string | number | symbol, S>;
}

/** useRequest config type */
type RequestHookConfig<S, E, R, T, RC, RE, RH> = FrontRequestHookConfig<S, E, R, T, RC, RE, RH>;

/** useWatcher config type */
interface WatcherHookConfig<S, E, R, T, RC, RE, RH> extends FrontRequestHookConfig<S, E, R, T, RC, RE, RH> {
  /** 请求防抖时间（毫秒），传入数组时可按watchingStates的顺序单独设置防抖时间 */
  debounce?: number | number[];
}

/** useFetcher config type */
type FetcherHookConfig = UseHookConfig<any, any, any, any, any, any, any>;

/** 调用useFetcher时需要传入的类型，否则会导致状态类型错误 */
type FetcherType<A extends Alova<any, any, any, any, any>> = {
  state: ReturnType<A['options']['statesHook']['create']>;
  export: ReturnType<A['options']['statesHook']['export']>;
};

/**
 * 以支持React和Vue的方式定义类型，后续需要其他类型再在这个基础上变化
 * 使用不同库的特征作为父类进行判断
 */
interface SvelteWritable {
  set(this: void, value: any): void;
}
interface VueRef {
  value: any;
}
type ExportedType<R, S> = S extends VueRef ? Ref<R> : S extends SvelteWritable ? Writable<R> : R;
type UseHookReturnType<S = any, E = any, R = any, T = any, RC = any, RE = any, RH = any> = FrontRequestState<
  ExportedType<boolean, S>,
  ExportedType<R, S>,
  ExportedType<Error | undefined, S>,
  ExportedType<Progress, S>,
  ExportedType<Progress, S>
> & {
  abort: () => void;
  update: ExportedUpdate<R>;
  send: (...args: any[]) => Promise<R>;
  onSuccess: (handler: SuccessHandler<S, E, R, T, RC, RE, RH>) => void;
  onError: (handler: ErrorHandler<S, E, R, T, RC, RE, RH>) => void;
  onComplete: (handler: CompleteHandler<S, E, R, T, RC, RE, RH>) => void;
};
type UseFetchHookReturnType<S> = {
  fetching: UseHookReturnType<any, S>['loading'];
  error: UseHookReturnType<any, S>['error'];
  downloading: UseHookReturnType<any, S>['downloading'];
  uploading: UseHookReturnType<any, S>['uploading'];
  fetch: <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => void;
  abort: UseHookReturnType<any, S>['abort'];
  onSuccess: UseHookReturnType<any, S>['onSuccess'];
  onError: UseHookReturnType<any, S>['onError'];
  onComplete: UseHookReturnType<any, S>['onComplete'];
};

interface MethodFilterHandler {
  (method: Method, index: number, methods: Method[]): boolean;
}
type MethodFilter =
  | string
  | RegExp
  | {
      name?: string | RegExp;
      filter: MethodFilterHandler;
      alova?: Alova<any, any, any, any, any>;
    };
type MethodMatcher<S, E, R, T, RC, RE, RH> = Method<S, E, R, T, RC, RE, RH> | MethodFilter;

type UpdateStateCollection<R> = {
  [key: string | number | symbol]: (data: any) => any;
} & {
  data?: (data: R) => any;
};

type AlovaMethodHandler<S, E, R, T, RC, RE, RH> = (...args: any[]) => Method<S, E, R, T, RC, RE, RH>;

// ************ 导出类型 ***************
export declare function createAlova<S, E, RC, RE, RH>(options: AlovaOptions<S, E, RC, RE, RH>): Alova<S, E, RC, RE, RH>;
export declare function useRequest<S, E, R, T, RC, RE, RH>(
  methodHandler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  config?: RequestHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R, T, RC, RE, RH>;
declare function useWatcher<S, E, R, T, RC, RE, RH>(
  handler: AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  watchingStates: E[],
  config?: WatcherHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R, T, RC, RE, RH>;
declare function useFetcher<SE extends FetcherType<any>>(
  config?: FetcherHookConfig
): UseFetchHookReturnType<SE['state']>;
declare function invalidateCache<S, E, R, T, RC, RE, RH>(
  matcher?: MethodMatcher<S, E, R, T, RC, RE, RH> | Method<S, E, R, T, RC, RE, RH>[]
): void;

interface updateOptions {
  onMatch?: (method: Method) => void;
}
declare function updateState<R = any, S = any, E = any, T = any, RC = any, RE = any, RH = any>(
  matcher: MethodMatcher<S, E, R, T, RC, RE, RH>,
  handleUpdate: UpdateStateCollection<R>['data'] | UpdateStateCollection<R>,
  options?: updateOptions
): boolean;

/** 手动设置缓存响应数据 */
declare function setCacheData<R = any, S = any, E = any, T = any, RC = any, RE = any, RH = any>(
  matcher: MethodMatcher<S, E, R, T, RC, RE, RH> | Method<S, E, R, T, RC, RE, RH>[],
  dataOrUpdater: R | ((oldCache: R) => R | false)
): void;
