type RequestAdapter<R, T> = (
  source: string,
  data: RequestBody,
  config: RequestConfig<R, T>,
) => {
  response: () => Promise<Response>,
  headers: () => Promise<Headers | void>,
  progress: (callback: (value: number) => void) => void,
  abort: () => void,
};

type RequestState<R = unknown> = {
  loading: any,
  data: R,
  error: any,
  progress: any,
};
export type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'TRACE';

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
  data?: Data,
}

// 局部的请求缓存时间，如缓存时间大于0则使用url+参数的请求将首先返回缓存数据
// 时间为毫秒，小于等于0不缓存，Infinity为永不过期
// 也可以设置函数，参数为全局responsed转化后的返回数据和headers对象，返回缓存时间
type StaleTime<T> = number | ((data: T, headers: Record<string, any>, method: MethodType) => number);
export type MethodConfig<R, T> = {
  params?: Record<string, any>,
  headers?: RequestInit['headers'],
  silent?: boolean,    // 静默请求，onSuccess将会立即触发，如果请求失败则会保存到缓存中后续继续轮询请求
  timeout?: number,    // 当前中断时间
  staleTime?: StaleTime<T>,   // get、head请求默认缓存5分钟（300000毫秒），其他请求默认不缓存
  enableProgress?: boolean,   // 是否启用进度信息，启用后每次请求progress才会有进度值，否则一致为0，默认不开启
  persist?: boolean,    // 持久化响应数据
  transformData?: (data: T, headers: Record<string, any>) => R,
};

// 获取fetch的第二个参数类型
type RequestInit = NonNullable<Parameters<typeof fetch>[1]>;
type RequestConfig<R, T> = CommonMethodParameters & MethodConfig<R, T> & RequestInit;

type ResponsedHandler = (response: Response) => any;
type ResponseErrorHandler = (error: any) => void;
// 泛型类型解释：
// S: create函数创建的状态组的类型
// E: export函数返回的状态组的类型
export interface AlovaOptions<S extends RequestState, E extends RequestState> {
  // base地址
  baseURL: string,
  
  // 状态hook函数，用于定义和更新指定MVVM库的状态
  statesHook: {
    create: (initialData: any = null) => S,
    export: (state: S) => E,
    update: (newVal: Partial<RequestState>, state: S) => void,

    // 控制执行请求的函数，此函数将在useRequest、useWatcher被调用时执行一次
    // 但在useController中不会被调用
    // 当watchedStates为空数组时，执行一次handleRequest函数
    // 当watchedStates为非空数组时，当状态变化时调用，immediate为true时，需立即调用一次
    // 在vue中直接执行即可，而在react中需要在useEffect中执行
    effectRequest: (handleRequest: () => void, watchedStates: any[], immediate: boolean) => void,
  },

  // 请求适配器
  requestAdapter: RequestAdapter<any, any>,

  // 请求超时时间
  timeout?: number,

  // 请求缓存时间，如缓存时间大于0则使用url+参数的请求将首先返回缓存数据
  // 时间为秒，小于等于0不缓存，Infinity为永不过期
  // get、head请求默认缓存5分钟（300000毫秒），其他请求默认不缓存
  // 也可以设置函数，参数为responsed转化后的返回数据和headers对象，返回缓存时间
  staleTime?: StaleTime<any>,

  // 持久化缓存接口，用于静默请求、响应数据持久化等
  storage?: Storage,

  // 全局的请求前置钩子
  beforeRequest?: (config: RequestConfig<any, any>) => RequestConfig<any, any> | void,

  // 全局的响应钩子，可传一个数组表示正常响应和响应出错的钩子
  // 如果正常响应的钩子抛出错误也将进入响应失败的钩子函数
  responsed?: ResponsedHandler | [ResponsedHandler, ResponseErrorHandler],
}