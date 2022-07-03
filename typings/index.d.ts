export type RequestBody = Record<string, any> | FormData | string;
export type Progress = {
  total: number,
  loaded: number,
};
type RequestAdapter<R, T> = (
  source: string,
  config: RequestConfig<R, T>,
  data?: RequestBody,
) => {
  response: () => Promise<Response>,
  headers: () => Promise<Headers | void>,
  onDownload?: (handler: (progress: Progress) => void) => void,
  onUpload?: (handler: (progress: Progress) => void) => void,
  abort: () => void,
};

type FrontRequestState<L = any, R = any, E = any, D = any, U = any> = {
  loading: L,
  data: R,
  error: E,
  downloading: D,
  uploading: U,
};
export type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH';

export type SerializedMethod = {
  type: MethodType,
  url: string,
  config?: {
    params?: Record<string, any>,
    headers?: Record<string, any>,
    timeout?: number,
  },
  requestBody?: RequestBody
};
export interface Storage {
  setItem: (key: string, value: string) => void,
  getItem(key: string): string | null,
  removeItem(key: string): void,
}

type CommonMethodParameters = {
  readonly url: string,
  readonly method: MethodType,
  data?: RequestBody,
}

type CacheMode = 0 | 1 | 2;

// 请求缓存设置
// expire: 过期时间，如果大于0则首先返回缓存数据，过期时间单位为毫秒，小于等于0不缓存，Infinity为永不过期
// mode: 缓存模式，可选值为MEMORY、STORAGE_PLACEHOLDER、STORAGE_RESTORE
// 也可以设置函数，参数为全局responsed转化后的返回数据和headers对象，返回缓存设置
type CacheConfigParam = number | {
  expire: number,
  mode?: CacheMode,
}
type CacheConfigSetting<T> = CacheConfigParam | ((data: T, headers: Headers, method: MethodType) => CacheConfigParam);
export type MethodConfig<R, T> = {
  params?: Record<string, any>,
  headers?: Record<string, any>,
  silent?: boolean,    // 静默请求，onSuccess将会立即触发，如果请求失败则会保存到缓存中后续继续轮询请求
  timeout?: number,    // 当前中断时间
  cache?: CacheConfigSetting<T>,   // 响应数据在缓存时间内则不再次请求。get、head请求默认保鲜5分钟（300000毫秒），其他请求默认不保鲜
  enableDownload?: boolean,   // 是否启用下载进度信息，启用后每次请求progress才会有进度值，否则一致为0，默认不开启
  enableUpload?: boolean,   // 是否启用上传进度信息，启用后每次请求progress才会有进度值，否则一致为0，默认不开启
  transformData?: (data: T, headers: Headers) => R,
};

// 获取fetch的第二个参数类型
type RequestInit = NonNullable<Parameters<typeof fetch>[1]>;
type RequestConfig<R, T> = CommonMethodParameters & Omit<MethodConfig<R, T>, 'headers'|'params'> & Omit<RequestInit, 'headers'> & {
  headers: Record<string, any>,
  params: Record<string, any>,
};
type ResponsedHandler = (response: Response) => any;
type ResponseErrorHandler = (error: any) => void;
// 泛型类型解释：
// S: create函数创建的状态组的类型
// E: export函数返回的状态组的类型
export interface AlovaOptions<S, E> {
  // base地址
  baseURL: string,
  
  // 状态hook函数，用于定义和更新指定MVVM库的状态
  statesHook: {
    create: <D>(state: D) => S,
    export: (state: S) => E,
    update: (newVal: Partial<FrontRequestState>, state: FrontRequestState) => void,

    // 控制执行请求的函数，此函数将在useRequest、useWatcher被调用时执行一次
    // 在useFetcher中的fetch函数中执行一次
    // 当watchedStates为空数组时，执行一次handleRequest函数
    // 当watchedStates为非空数组时，当状态变化时调用，immediate为true时，需立即调用一次
    // 在vue中直接执行即可，而在react中需要在useEffect中执行
    // removeStates函数为清除当前状态的函数，应该在组件卸载时调用
    effectRequest: (handleRequest: () => void, removeStates: () => void, watchedStates?: any[], immediate?: boolean) => void,
  },

  // 请求适配器
  requestAdapter: RequestAdapter<any, any>,

  // 请求超时时间
  timeout?: number,
  
  // 全局的请求缓存设置
  // expire: 过期时间，如果大于0则首先返回缓存数据，过期时间单位为毫秒，小于等于0不缓存，Infinity为永不过期
  // mode: 缓存模式，可选值为MEMORY、STORAGE_PLACEHOLDER、STORAGE_RESTORE
  // 也可以设置函数，参数为全局responsed转化后的返回数据和headers对象，返回缓存设置
  // get、head请求默认缓存5分钟（300000毫秒），其他请求默认不缓存
  cache?: CacheConfigSetting<any>,

  // 持久化缓存接口，用于静默请求、响应数据持久化等
  storageAdapter?: Storage,

  // 全局的请求前置钩子
  beforeRequest?: (config: RequestConfig<any, any>) => RequestConfig<any, any> | void,

  // 全局的响应钩子，可传一个数组表示正常响应和响应出错的钩子
  // 如果正常响应的钩子抛出错误也将进入响应失败的钩子函数
  responsed?: ResponsedHandler | [ResponsedHandler, ResponseErrorHandler],
}

/** 三种缓存模式 */
// 只在内存中缓存
export declare const MEMORY: number;
// 缓存会持久化，但当内存中没有缓存时，持久化缓存只会作为响应数据的占位符，且还会发送请求更新缓存
export declare const STORAGE_PLACEHOLDER: number;
// 缓存会持久化，且每次刷新会读取持久化缓存到内存中，这意味着内存一直会有缓存
export declare const STORAGE_RESTORE: number;


// methods
interface Method<S, E, R, T> {
  type: MethodType;
  url: string;
  config: MethodConfig<R, T>;
  requestBody?: RequestBody;
  context: Alova<S, E>;
  response: R;
}
interface Get<S, E, R, T> extends Method<S, E, R, T> {}
interface Post<S, E, R, T> extends Method<S, E, R, T> {}
interface Put<S, E, R, T> extends Method<S, E, R, T> {}
interface Delete<S, E, R, T> extends Method<S, E, R, T> {}
interface Head<S, E, R, T> extends Method<S, E, R, T> {}
interface Options<S, E, R, T> extends Method<S, E, R, T> {}
interface Patch<S, E, R, T> extends Method<S, E, R, T> {}


declare class Alova<S, E> {
  public options: AlovaOptions<S, E>;
  public id: string;
  public storage: Storage;
  Get<R, T = any>(url: string, config?: MethodConfig<R, T>): Get<S, E, R, T>;
  Post<R, T = any>(url: string, requestBody?: RequestBody, config?: MethodConfig<R, T>): Get<S, E, R, T>;
  Put<R, T = any>(url: string, requestBody?: RequestBody, config?: MethodConfig<R, T>): Get<S, E, R, T>;
  Delete<R, T = any>(url: string, requestBody?: RequestBody, config?: MethodConfig<R, T>): Get<S, E, R, T>;
  Head<R, T = any>(url: string, config?: MethodConfig<R, T>): Get<S, E, R, T>;
  Options<R, T = any>(url: string, config?: MethodConfig<R, T>): Get<S, E, R, T>;
  Patch<R, T = any>(url: string, requestBody?: RequestBody, config?: MethodConfig<R, T>): Get<S, E, R, T>;
}

// hook通用配置
interface UseHookConfig {
  force?: boolean,   // 强制请求
  initialData?: any,     // 初始数据
}
// useRequest配置类型
interface RequestHookConfig extends UseHookConfig {
  immediate?: boolean,   // 开启immediate后，useRequest会立即发起一次请求
}
// useWatcher配置类型
interface WatcherHookConfig extends UseHookConfig {
  immediate?: boolean,  // 开启immediate后，useWatcher初始化时会自动发起一次请求
  debounce?: number, // 延迟多少毫秒后再发起请求
}

// Vue状态类型
interface Ref<T = any> {
  value: T;
}
// react状态类型
type Dispatch<A> = (value: A) => void;
type SetStateAction<S> = S | ((prevState: S) => S);
type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
type SuccessHandler<R> = (data: R, requestId: number) => void;
type ErrorHandler = (error: Error, requestId: number) => void;
type CompleteHandler = (requestId: number) => void;
interface Responser<R> {
  successHandlers: SuccessHandler<R>[];
  errorHandlers: ErrorHandler[];
  completeHandlers: CompleteHandler[];
  success(handler: SuccessHandler<R>): Responser<R>;
  error(handler: ErrorHandler): Responser<R>;
  complete(handler: CompleteHandler): Responser<R>;
}
type ExportedType<R, S> = S extends Ref ? Ref<R> : R;    // 以支持React和Vue的方式定义类型
type UseHookReturnType<R, S> = FrontRequestState<
  ExportedType<boolean, S>,
  ExportedType<R, S>,
  ExportedType<Error|null, S>,
  ExportedType<Progress, S>,
  ExportedType<Progress, S>
> & {
  responser: Responser<R>;
  abort: () => void;
  send: () => void;
}
type UseFetchHookReturnType<S, E> = {
  fetching: UseHookReturnType<any, S>['loading'];
  error: UseHookReturnType<any, S>['error'],
  downloading: UseHookReturnType<any, S>['downloading'],
  uploading: UseHookReturnType<any, S>['uploading'],
  responser: UseHookReturnType<any, S>['responser'],
  fetch: <R, T>(methodInstance: Method<S, E, R, T>) => void;
}

// 导出类型
export declare function createAlova<S, E>(options: AlovaOptions<S, E>): Alova<S, E>;
export declare  function useRequest<S, E, R, T>(methodInstance: Method<S, E, R, T>, config?: RequestHookConfig): UseHookReturnType<R, S>;
export declare function useWatcher<S, E, R, T>(handler: () => Method<S, E, R, T>, watchingStates: E[], config?: WatcherHookConfig): UseHookReturnType<R, S>;
export declare function useFetcher<S, E>(alova: Alova<S, E>): UseFetchHookReturnType<S, E>;
export declare function staleData<S, E, R, T>(methodInstance: Method<S, E, R, T>): void;
// 以支持React和Vue的方式定义类型
type OriginalType<R, S> = S extends Ref ? Ref<R> : ReactState<R>;
export declare function updateState<S, E, R, T>(methodInstance: Method<S, E, R, T>, handleUpdate: (data: OriginalType<R, S>) => void): void;
// 手动设置缓存响应数据
export declare function setFreshData<S, E, R, T>(methodInstance: Method<S, E, R, T>, data: R): void;

// 混合多个响应器，并在这些响应器都成功时调用成功回调，如果其中一个错误则调用失败回调
// 类似Promise.all
export declare function all<T extends unknown[] | []>(responsers: T): Responser<{ -readonly [P in keyof T]: T[P] extends Responser<infer R> ? R : never }>;

// 预定义的配置
export declare function GlobalFetch(requestInit?: RequestInit): <R, T>(source: string, config: RequestConfig<R, T>, data?: any) => {
  response: () => Promise<Response>;
  headers: () => Promise<void | Headers>;
  onDownload: (handler: (progress: Progress) => void) => void;
  abort: () => void;
};