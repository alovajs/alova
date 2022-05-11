export type RequestAdapter<RC extends Object, R> = (source: string, data: Record<string, any> | FormData, config: RC) => Promise<R>;

type RequestState<R = unknown> = {
  loading: any,
  data: R,
  error: any,
  progress: any,
};
// silent config
export interface SilentConfig {
  push(key: string, config: unknown): void,
  pop(): unknown,
}
// 数据持久化配置
type PersistResponse = {
  set: (key: string, response: unknown) => void,
  get: (key: string) => unknown,
};

export interface AlovaOptions<S extends RequestState, E extends RequestState> {
  // base地址
  baseURL: string,

  // 状态hook函数，用于定义和更新指定MVVM库的状态
  statesHook: {
    create: () => S,
    export: (state: S) => E,
    update: (newVal: Partial<RequestState>, state: S) => void,
    watch: (args: any[], handler: () => void) => void,
  },

  // 请求超时时间
  timeout?: number,

  // 请求缓存时间，如缓存时间大于0则使用url+参数的请求将首先返回缓存数据
  // 时间为毫秒，小于等于0不缓存，Infinity为永不过期
  staleTime?: number,

  // 静默请求配置
  // 以下的key都是自动拼接了对应前缀的key
  silentConfig?: SilentConfig,

  // 响应数据持久化配置，如果设置了且某些请求也设置了持久化参数，则会将请求结果持久化
  // 具体持久化方案需自定义，如使用localStorage
  persistResponse?: PersistResponse,

  // 请求适配器，用于定义真实请求发出的载体，默认使用fetch
  // 如果需要修改请求载体，可以实现该函数
  requestAdapter?: RequestAdapter,
}

export type MethodConfig<R> = {
  params?: Record<string, any>,
  headers?: Record<string, any>,
  silent?: boolean,
  timeout?: number,    // 当前中断时间
  cache?: boolean,     // 设置不缓存，这样每次都能获取最新数据
  // persist?: boolean,    // 是否持久化响应数据？？？是否参考react-query的initData，
  transformResponse?: <T>(data: R, headers: Record<string, any>) => T
};