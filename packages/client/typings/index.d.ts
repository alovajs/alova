import {
  AlovaMethodHandler,
  AlovaRequestAdapter,
  CompleteHandler,
  ErrorHandler,
  FrontRequestState,
  Method,
  Progress,
  RequestHookConfig,
  StatesHook,
  SuccessHandler,
  updateState,
  UseHookReturnType,
  WatcherHookConfig
} from 'alova';
import GlobalFetch from 'alova/GlobalFetch';
import { ComputedRef, Ref, WatchSource } from 'vue';
import {
  AccessAction,
  ActionDelegationMiddleware,
  AlovaRequestAdapterUnified,
  AutoRequestHookConfig,
  BeforeSilentSubmitHandler,
  CaptchaHookConfig,
  CaptchaReturnType,
  ClientTokenAuthenticationOptions,
  FormHookConfig,
  FormHookHandler,
  FormReturnType,
  IsUnknown,
  NotifyHandler,
  OffEventCallback,
  PaginationHookConfig,
  RetriableHookConfig,
  RetriableReturnType,
  ServerTokenAuthenticationOptions,
  SilentFactoryBootOptions,
  SilentMethod,
  SilentQueueMap,
  SilentSubmitBootHandler,
  SilentSubmitErrorHandler,
  SilentSubmitFailHandler,
  SilentSubmitSuccessHandler,
  SQHookReturnType,
  SQRequestHookConfig,
  SSEHookConfig,
  SSEReturnType,
  TokenAuthenticationResult,
  UnbindHandler
} from './general';

type UsePaginationReturnType<S, E, R, T, RC, RE, RH, LD extends unknown[]> = Omit<
  UseHookReturnType<S, E, R, T, RC, RE, RH>,
  'data' | 'update'
> & {
  page: Ref<number>;
  pageSize: Ref<number>;
  data: Ref<
    IsUnknown<
      LD[number],
      R extends {
        data: any;
      }
        ? R['data']
        : LD,
      LD
    >
  >;
  pageCount: ComputedRef<number | undefined>;
  total: ComputedRef<number | undefined>;
  isLastPage: ComputedRef<boolean>;
  fetching: Ref<boolean>;
  onFetchSuccess: (handler: SuccessHandler<S, E, R, T, RC, RE, RH>) => void;
  onFetchError: (handler: ErrorHandler<S, E, R, T, RC, RE, RH>) => void;
  onFetchComplete: (handler: CompleteHandler<S, E, R, T, RC, RE, RH>) => void;
  update: (newFrontStates: Partial<FrontRequestState<boolean, LD, Error | undefined, Progress, Progress>>) => void;

  /**
   * 刷新指定页码数据，此函数将忽略缓存强制发送请求
   * 如果未传入页码则会刷新当前页
   * 如果传入一个列表项，将会刷新此列表项所在页，只对append模式有效
   * @param pageOrItemPage 刷新的页码或列表项
   */
  refresh: (pageOrItemPage?: number | LD[number]) => void;

  /**
   * 插入一条数据
   * 如果未传入index，将默认插入到最前面
   * 如果传入一个列表项，将插入到这个列表项的后面，如果列表项未在列表数据中将会抛出错误
   * @param item 插入项
   * @param position 插入位置（索引）或列表项
   */
  insert: (item: LD extends any[] ? LD[number] : any, position?: number | LD[number]) => void;

  /**
   * 移除一条数据
   * 如果传入的是列表项，将移除此列表项，如果列表项未在列表数据中将会抛出错误
   * @param position 移除的索引或列表项
   */
  remove: (position: number | LD[number]) => void;

  /**
   * 替换一条数据
   * 如果position传入的是列表项，将替换此列表项，如果列表项未在列表数据中将会抛出错误
   * @param item 替换项
   * @param position 替换位置（索引）或列表项
   */
  replace: (item: LD extends any[] ? LD[number] : any, position: number | LD[number]) => void;

  /**
   * 从第一页开始重新加载列表，并清空缓存
   */
  reload: () => void;
};

/**
 * 基于alova.js的vue分页hook
 * 分页相关状态自动管理、前后一页预加载、自动维护数据的新增/编辑/移除
 *
 * @param handler method创建函数
 * @param config pagination hook配置
 * @returns {UsePaginationReturnType}
 */
declare function usePagination<S extends Ref, E extends Ref, R, T, RC, RE, RH, LD extends unknown[], WS extends (WatchSource | object)[]>(
  handler: (page: number, pageSize: number) => Method<S, E, R, T, RC, RE, RH>,
  config?: PaginationHookConfig<S, E, R, T, RC, RE, RH, LD, WS>
): UsePaginationReturnType<S, E, R, T, RC, RE, RH, LD>;

/**
 * 带silentQueue的request hook
 * silentQueue是实现静默提交的核心部件，其中将用于存储silentMethod实例，它们将按顺序串行发送提交
 */
declare function useSQRequest<S, E, R, T, RC, RE, RH>(
  handler: AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  config?: SQRequestHookConfig<S, E, R, T, RC, RE, RH>
): SQHookReturnType<S, E, R, T, RC, RE, RH>;
declare function bootSilentFactory(options: SilentFactoryBootOptions): void;
declare function onSilentSubmitBoot(handler: SilentSubmitBootHandler): OffEventCallback;
declare function onSilentSubmitSuccess(handler: SilentSubmitSuccessHandler): OffEventCallback;
declare function onSilentSubmitError(handler: SilentSubmitErrorHandler): OffEventCallback;
declare function onSilentSubmitFail(handler: SilentSubmitFailHandler): OffEventCallback;
declare function onBeforeSilentSubmit(handler: BeforeSilentSubmitHandler): OffEventCallback;
declare function dehydrateVData<T>(target: T): T;
declare function stringifyVData(target: any, returnOriginalIfNotVData?: boolean): any;
declare function isVData(target: any): boolean;
declare function equals(prevValue: any, nextValue: any): boolean;
declare function filterSilentMethods(
  methodNameMatcher?: string | number | RegExp,
  queueName?: string,
  filterActive?: boolean
): SilentMethod[];
declare function getSilentMethod(
  methodNameMatcher?: string | number | RegExp,
  queueName?: string,
  filterActive?: boolean
): SilentMethod | undefined;
declare const updateStateEffect: typeof updateState;
declare const silentQueueMap: SilentQueueMap;

/**
 * 验证码发送场景的请求hook
 * @param handler method实例或获取函数
 * @param 配置参数
 * @return useCaptcha相关数据和操作函数
 */
declare function useCaptcha<S, E, R, T, RC, RE, RH>(
  handler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  config?: CaptchaHookConfig<S, E, R, T, RC, RE, RH>
): CaptchaReturnType<S, E, R, T, RC, RE, RH>;

/**
 * useForm
 * 表单的提交hook，具有草稿功能，以及多页表单的数据同步功能
 *
 * 适用场景：
 * 1. 单表单/多表单提交、草稿数据持久化、数据更新和重置
 * 2. 条件搜索输入项，可持久化搜索条件，可立即发送表单数据
 *
 * @param handler method获取函数，只需要获取同步数据时可传id
 * @param config 配置参数
 * @return useForm相关数据和操作函数
 */
declare function useForm<F extends Record<string | symbol, any> = any, S = any, E = any, R = any, T = any, RC = any, RE = any, RH = any>(
  handler: FormHookHandler<S, E, R, T, RC, RE, RH, F> | NonNullable<FormHookConfig<S, E, R, T, RC, RE, RH, F>['id']>,
  config?: FormHookConfig<S, E, R, T, RC, RE, RH, F>
): FormReturnType<S, E, R, T, RC, RE, RH, F>;

/**
 * useSSE
 * 使用 Server-sent events 发送请求
 *
 *
 * @param handler method获取函数
 * @param config 配置参数
 * @return useSSE相关数据和操作函数
 */
declare function useSSE<Data = any, S = any, E = any, R = any, T = any, RC = any, RE = any, RH = any>(
  handler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  config?: SSEHookConfig
): SSEReturnType<S, Data>;

/**
 * useRetriableRequest
 * 具有重试功能的请求hook
 * 适用场景：
 * 1. 请求失败重试、或自定义规则重试
 * 2. 手动停止/启动重试
 *
 * @param handler method实例或获取函数
 * @param config 配置参数
 * @return useRetriableRequest相关数据和操作函数
 */
declare function useRetriableRequest<S, E, R, T, RC, RE, RH>(
  handler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  config?: RetriableHookConfig<S, E, R, T, RC, RE, RH>
): RetriableReturnType<S, E, R, T, RC, RE, RH>;

/**
 * useSerialRequest
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
declare function useSerialRequest<S, E, R, T, RC, RE, RH, R2>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>
  ],
  config?: RequestHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R2, T, RC, RE, RH>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
declare function useSerialRequest<S, E, R, T, RC, RE, RH, R2, R3>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>,
    (value: R2, ...args: any[]) => Method<S, E, R3, T, RC, RE, RH>
  ],
  config?: RequestHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R3, T, RC, RE, RH>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
declare function useSerialRequest<S, E, R, T, RC, RE, RH, R2, R3, R4>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>,
    (value: R2, ...args: any[]) => Method<S, E, R3, T, RC, RE, RH>,
    (value: R3, ...args: any[]) => Method<S, E, R4, T, RC, RE, RH>
  ],
  config?: RequestHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R4, T, RC, RE, RH>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
declare function useSerialRequest<S, E, R, T, RC, RE, RH, R2, R3, R4, R5>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>,
    (value: R2, ...args: any[]) => Method<S, E, R3, T, RC, RE, RH>,
    (value: R3, ...args: any[]) => Method<S, E, R4, T, RC, RE, RH>,
    (value: R4, ...args: any[]) => Method<S, E, R5, T, RC, RE, RH>
  ],
  config?: RequestHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R5, T, RC, RE, RH>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
declare function useSerialRequest<S, E, R, T, RC, RE, RH, R2, R3, R4, R5, R6>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>,
    (value: R2, ...args: any[]) => Method<S, E, R3, T, RC, RE, RH>,
    (value: R3, ...args: any[]) => Method<S, E, R4, T, RC, RE, RH>,
    (value: R4, ...args: any[]) => Method<S, E, R5, T, RC, RE, RH>,
    (value: R5, ...args: any[]) => Method<S, E, R6, T, RC, RE, RH>
  ],
  config?: RequestHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R6, T, RC, RE, RH>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
declare function useSerialRequest<S, E, R, T, RC, RE, RH, R2, R3, R4, R5, R6, R7>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>,
    (value: R2, ...args: any[]) => Method<S, E, R3, T, RC, RE, RH>,
    (value: R3, ...args: any[]) => Method<S, E, R4, T, RC, RE, RH>,
    (value: R4, ...args: any[]) => Method<S, E, R5, T, RC, RE, RH>,
    (value: R5, ...args: any[]) => Method<S, E, R6, T, RC, RE, RH>,
    (value: R6, ...args: any[]) => Method<S, E, R7, T, RC, RE, RH>
  ],
  config?: RequestHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R7, T, RC, RE, RH>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
declare function useSerialRequest<S, E, R, T, RC, RE, RH, R2, R3, R4, R5, R6, R7, R8>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>,
    (value: R2, ...args: any[]) => Method<S, E, R3, T, RC, RE, RH>,
    (value: R3, ...args: any[]) => Method<S, E, R4, T, RC, RE, RH>,
    (value: R4, ...args: any[]) => Method<S, E, R5, T, RC, RE, RH>,
    (value: R5, ...args: any[]) => Method<S, E, R6, T, RC, RE, RH>,
    (value: R6, ...args: any[]) => Method<S, E, R7, T, RC, RE, RH>,
    (value: R7, ...args: any[]) => Method<S, E, R8, T, RC, RE, RH>
  ],
  config?: RequestHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R8, T, RC, RE, RH>;

/**
 * useSerialWatcher
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
declare function useSerialWatcher<S, E, R, T, RC, RE, RH, R2>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>
  ],
  watchingStates: (WatchSource<any> | object)[],
  config?: WatcherHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R2, T, RC, RE, RH>;

/**
 * useSerialWatcher(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
declare function useSerialWatcher<S, E, R, T, RC, RE, RH, R2, R3>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>,
    (value: R2, ...args: any[]) => Method<S, E, R3, T, RC, RE, RH>
  ],
  watchingStates: (WatchSource<any> | object)[],
  config?: WatcherHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R3, T, RC, RE, RH>;

/**
 * useSerialWatcher(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
declare function useSerialWatcher<S, E, R, T, RC, RE, RH, R2, R3, R4>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>,
    (value: R2, ...args: any[]) => Method<S, E, R3, T, RC, RE, RH>,
    (value: R3, ...args: any[]) => Method<S, E, R4, T, RC, RE, RH>
  ],
  watchingStates: (WatchSource<any> | object)[],
  config?: WatcherHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R4, T, RC, RE, RH>;

/**
 * useSerialWatcher(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
declare function useSerialWatcher<S, E, R, T, RC, RE, RH, R2, R3, R4, R5>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>,
    (value: R2, ...args: any[]) => Method<S, E, R3, T, RC, RE, RH>,
    (value: R3, ...args: any[]) => Method<S, E, R4, T, RC, RE, RH>,
    (value: R4, ...args: any[]) => Method<S, E, R5, T, RC, RE, RH>
  ],
  watchingStates: (WatchSource<any> | object)[],
  config?: WatcherHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R5, T, RC, RE, RH>;

/**
 * useSerialWatcher(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
declare function useSerialWatcher<S, E, R, T, RC, RE, RH, R2, R3, R4, R5, R6>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>,
    (value: R2, ...args: any[]) => Method<S, E, R3, T, RC, RE, RH>,
    (value: R3, ...args: any[]) => Method<S, E, R4, T, RC, RE, RH>,
    (value: R4, ...args: any[]) => Method<S, E, R5, T, RC, RE, RH>,
    (value: R5, ...args: any[]) => Method<S, E, R6, T, RC, RE, RH>
  ],
  watchingStates: (WatchSource<any> | object)[],
  config?: WatcherHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R6, T, RC, RE, RH>;

/**
 * useSerialWatcher(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
declare function useSerialWatcher<S, E, R, T, RC, RE, RH, R2, R3, R4, R5, R6, R7>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>,
    (value: R2, ...args: any[]) => Method<S, E, R3, T, RC, RE, RH>,
    (value: R3, ...args: any[]) => Method<S, E, R4, T, RC, RE, RH>,
    (value: R4, ...args: any[]) => Method<S, E, R5, T, RC, RE, RH>,
    (value: R5, ...args: any[]) => Method<S, E, R6, T, RC, RE, RH>,
    (value: R6, ...args: any[]) => Method<S, E, R7, T, RC, RE, RH>
  ],
  watchingStates: (WatchSource<any> | object)[],
  config?: WatcherHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R7, T, RC, RE, RH>;

/**
 * useSerialWatcher(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
declare function useSerialWatcher<S, E, R, T, RC, RE, RH, R2, R3, R4, R5, R6, R7, R8>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    (value: R, ...args: any[]) => Method<S, E, R2, T, RC, RE, RH>,
    (value: R2, ...args: any[]) => Method<S, E, R3, T, RC, RE, RH>,
    (value: R3, ...args: any[]) => Method<S, E, R4, T, RC, RE, RH>,
    (value: R4, ...args: any[]) => Method<S, E, R5, T, RC, RE, RH>,
    (value: R5, ...args: any[]) => Method<S, E, R6, T, RC, RE, RH>,
    (value: R6, ...args: any[]) => Method<S, E, R7, T, RC, RE, RH>,
    (value: R7, ...args: any[]) => Method<S, E, R8, T, RC, RE, RH>
  ],
  watchingStates: (WatchSource<any> | object)[],
  config?: WatcherHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R8, T, RC, RE, RH>;

/**
 * 操作函数委托中间件
 * 使用此中间件后可通过accessAction调用委托的函数
 * 可以委托多个相同id
 * 以此来消除组件的层级限制
 * @param id 委托者id
 * @returns alova中间件函数
 */
declare const actionDelegationMiddleware: ActionDelegationMiddleware;

/**
 * 访问操作函数，如果匹配多个则会以此调用onMatch
 * @param id 委托者id，或正则表达式
 * @param onMatch 匹配的订阅者
 */
declare const accessAction: AccessAction;

/**
 * 创建客户端的token认证拦截器
 * @example
 * ```js
 * const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication(\/* ... *\/);
 * const alova = createAlova({
 *   // ...
 *   beforeRequest: onAuthRequired(method => {
 *     // ...
 *   }),
 *   responded: onResponseRefreshToken({
 *     onSuccess(response, method) {
 *       // ...
 *     },
 *     onError(error, method) {
 *       // ...
 *     },
 *   })
 * });
 * ```
 * @param options 配置参数
 * @returns token认证拦截器函数
 */
export function createClientTokenAuthentication<
  SH extends StatesHook<any, any>,
  RA extends
    | AlovaRequestAdapter<any, any, any, any, any>
    | ((...args: any[]) => AlovaRequestAdapter<any, any, any, any, any>) = typeof GlobalFetch
>(options: ClientTokenAuthenticationOptions<AlovaRequestAdapterUnified<RA>>): TokenAuthenticationResult<SH, AlovaRequestAdapterUnified<RA>>;

/**
 * 创建服务端的token认证拦截器
 * @example
 * ```js
 * const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication(\/* ... *\/);
 * const alova = createAlova({
 *   // ...
 *   beforeRequest: onAuthRequired(method => {
 *     // ...
 *   }),
 *   responded: onResponseRefreshToken({
 *     onSuccess(response, method) {
 *       // ...
 *     },
 *     onError(error, method) {
 *       // ...
 *     },
 *   })
 * });
 * ```
 * @param options 配置参数
 * @returns token认证拦截器函数
 */
export function createServerTokenAuthentication<
  SH extends StatesHook<any, any>,
  RA extends
    | AlovaRequestAdapter<any, any, any, any, any>
    | ((...args: any[]) => AlovaRequestAdapter<any, any, any, any, any>) = typeof GlobalFetch
>(options: ServerTokenAuthenticationOptions<AlovaRequestAdapterUnified<RA>>): TokenAuthenticationResult<SH, AlovaRequestAdapterUnified<RA>>;

/**
 * 在一定条件下可以自动重新拉取数据，从而刷新页面，使用场景有：
 * 1. 浏览器 tab 切换时拉取最新数据
 * 2. 浏览器聚焦时拉取最新数据
 * 3. 网络重连时拉取最新数据
 * 4. 轮询请求
 * 可同时配置以上的一个或多个触发条件，也可以配置节流时间来防止短时间内触发多次请求，例如 1 秒内只允许触发一次。
 * @param handler method实例或获取函数
 * @param config 配置参数
 * @return useAutoRequest相关数据和操作函数
 */
declare function useAutoRequest<S, E, R, T, RC, RE, RH>(
  handler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  config?: AutoRequestHookConfig<S, E, R, T, RC, RE, RH>
): UseHookReturnType<S, E, R, T, RC, RE, RH>;
declare namespace useAutoRequest {
  function onNetwork(notify: NotifyHandler, config: AutoRequestHookConfig<any, any, any, any, any, any, any>): UnbindHandler;
  function onPolling(notify: NotifyHandler, config: AutoRequestHookConfig<any, any, any, any, any, any, any>): UnbindHandler;
  function onVisibility(notify: NotifyHandler, config: AutoRequestHookConfig<any, any, any, any, any, any, any>): UnbindHandler;
  function onFocus(notify: NotifyHandler, config: AutoRequestHookConfig<any, any, any, any, any, any, any>): UnbindHandler;
}
