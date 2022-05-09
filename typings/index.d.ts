export type RequestAdapter<D> = (source, data, config) => Promise<D>;

type RequestState = {
  loading: any,
  data: any,
  error: any,
  progress: any,
};
// states hook
export type StatesHookCreator<R = any> = () => R;
export type StatesHookUpdater = (newVal: RequestState, state: RequestState) => void;
// silent config
export interface SilentConfig {
  push(key: string, config: unknown): void;
  pop(): unknown;
}
// 数据持久化配置
type PersistResponse = {
  set: (key: string, response: unknown) => void,
  get: (key: string) => unknown,
};

export interface AlovaOptions<C extends StatesHookCreator, U extends StatesHookUpdater> {

  // base地址
  baseURL: string,

  // 状态hook函数，用于定义和更新指定MVVM库的状态
  statesHook: {
    create: C,
    update: U,
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