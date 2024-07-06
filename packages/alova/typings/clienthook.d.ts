import { FrameworkReadableState, FrameworkState } from '@alova/shared/FrameworkState';
import { EventManager } from '@alova/shared/createEventManager';
import { IsAny } from '@alova/shared/types';
import {
  Alova,
  AlovaGenerics,
  AlovaRequestAdapter,
  FetchRequestState,
  FrontRequestState,
  Method,
  Progress,
  ReferingObject,
  StatesExport
} from 'alova';
import { Readable, Writable } from 'svelte/store';
import { ComputedRef, Ref } from 'vue';
import {
  AccessAction,
  ActionDelegationMiddleware,
  AutoRequestHookConfig,
  BeforeSilentSubmitHandler,
  CaptchaExposure,
  CaptchaHookConfig,
  ClientTokenAuthenticationOptions,
  FormExposure,
  FormHookConfig,
  FormHookHandler,
  IsUnknown,
  NotifyHandler,
  OffEventCallback,
  PaginationHookConfig,
  RetriableExposure,
  RetriableHookConfig,
  SQHookExposure,
  SQRequestHookConfig,
  SSEExposure,
  SSEHookConfig,
  ServerTokenAuthenticationOptions,
  SilentFactoryBootOptions,
  SilentMethod,
  SilentQueueMap,
  SilentSubmitBootHandler,
  SilentSubmitErrorHandler,
  SilentSubmitFailHandler,
  SilentSubmitSuccessHandler,
  TokenAuthenticationResult,
  UnbindHandler
} from './general';

export type AlovaMethodHandler<AG extends AlovaGenerics = any> = (...args: any[]) => Method<AG>;

/**
 * alova base event
 */
export interface AlovaEvent<AG extends AlovaGenerics> {
  /**
   * params from send function
   */
  sendArgs: any[];
  /**
   * current method instance
   */
  method: Method<AG>;
}
/**
 * success event object
 */
export interface AlovaSuccessEvent<AG extends AlovaGenerics> extends AlovaEvent<AG> {
  /** data数据是否来自缓存 */
  fromCache: boolean;
  data: AG['Responded'];
}
/** 错误事件对象 */
export interface AlovaErrorEvent<AG extends AlovaGenerics> extends AlovaEvent<AG> {
  error: any;
}
/** 完成事件对象 */
export interface AlovaCompleteEvent<AG extends AlovaGenerics> extends AlovaEvent<AG> {
  /** 响应状态 */
  status: 'success' | 'error';
  /** data数据是否来自缓存，当status为error时，fromCache始终为false */
  fromCache: boolean;
  data?: AG['Responded'];
  error?: any;
}

export type SuccessHandler<AG extends AlovaGenerics> = (event: AlovaSuccessEvent<AG>) => void;
export type ErrorHandler<AG extends AlovaGenerics> = (event: AlovaErrorEvent<AG>) => void;
export type CompleteHandler<AG extends AlovaGenerics> = (event: AlovaCompleteEvent<AG>) => void;

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
  fs: FrontRequestState<
    FrameworkState<boolean, 'loading'>,
    FrameworkState<any, 'data'>,
    FrameworkState<Error | undefined, 'error'>,
    FrameworkState<Progress, 'downloading'>,
    FrameworkState<Progress, 'uploading'>
  >;

  /** event manager */
  em: EventManager<{
    success: AlovaSuccessEvent<any>;
    error: AlovaErrorEvent<any>;
    complete: AlovaCompleteEvent<any>;
  }>;

  /** hookType, useRequest=1, useWatcher=2, useFetcher=3 */
  ht: EnumHookType;

  /** hook config */
  c: UseHookConfig<any>;

  /** refering object */
  ro: ReferingObject;
}

/**
 * 以支持React和Vue的方式定义类型，后续需要其他类型再在这个基础上变化
 * 使用不同库的特征作为父类进行判断
 */
export type ExportedState<Responded, State> =
  IsAny<Ref, unknown, Ref> extends State
    ? Ref<Responded>
    : IsAny<Writable<any>, unknown, Writable<any>> extends State
      ? Writable<Responded>
      : Responded;
export type ExportedComputed<Responded, Computed> =
  IsAny<ComputedRef, unknown, ComputedRef> extends Computed
    ? ComputedRef<Responded>
    : IsAny<Readable<any>, unknown, Readable<any>> extends Computed
      ? Readable<Responded>
      : Responded;

export type StateUpdater<ExportedStates extends Record<string, any>, SE extends StatesExport> = (newStates: {
  [K in keyof ExportedStates]?: ExportedStates[K] extends ExportedState<infer R, SE> | ExportedComputed<infer R, SE>
    ? R
    : never;
}) => void;

export type ProxyStateGetter<HookExportedStates extends Record<string, any>> = <K extends keyof HookExportedStates>(
  key: K
) => HookExportedStates[K] extends ExportedState<infer Data, any>
  ? FrameworkState<Data, K & string>
  : HookExportedStates[K] extends ExportedComputed<infer Data, any>
    ? FrameworkReadableState<Data, K & string>
    : never;

export type SendHandler<R> = (...args: any[]) => Promise<R>;
export interface UseHookExportedState<AG extends AlovaGenerics>
  extends FrontRequestState<
    ExportedState<boolean, AG['State']>,
    ExportedState<AG['Responded'], AG['State']>,
    ExportedState<Error | undefined, AG['State']>,
    ExportedState<Progress, AG['State']>,
    ExportedState<Progress, AG['State']>
  > {}
export interface UseHookExposure<AG extends AlovaGenerics = AlovaGenerics> extends UseHookExportedState<AG> {
  abort: () => void;
  update: StateUpdater<UseHookExportedState<AG>, AG['StatesExport']>;
  send: SendHandler<AG['Responded']>;
  onSuccess(handler: SuccessHandler<AG>): this;
  onError(handler: ErrorHandler<AG>): this;
  onComplete(handler: CompleteHandler<AG>): this;
  __proxyState: ProxyStateGetter<UseHookExportedState<AG>>;
  __referingObj: ReferingObject;
}
export interface UseFetchExportedState<State>
  extends FetchRequestState<
    ExportedState<boolean, State>,
    ExportedState<Error | undefined, State>,
    ExportedState<Progress, State>,
    ExportedState<Progress, State>
  > {}
export interface UseFetchHookExposure<SE extends StatesExport> extends UseFetchExportedState<SE['State']> {
  fetch<R>(matcher: Method<AlovaGenerics<R>>, ...args: any[]): Promise<R>;
  update: StateUpdater<UseFetchExportedState<SE['State']>, SE>;
  abort: UseHookExposure['abort'];
  onSuccess: UseHookExposure['onSuccess'];
  onError: UseHookExposure['onError'];
  onComplete: UseHookExposure['onComplete'];
  __proxyState: ProxyStateGetter<UseHookExportedState<any>>;
  __referingObj: ReferingObject;
}

export interface AlovaMiddlewareContext<AG extends AlovaGenerics> {
  /** 当前的method对象 */
  method: Method<AG>;

  /** 命中的缓存数据 */
  cachedResponse: AG['Responded'] | undefined;

  /** 当前的usehook配置对象 */
  config: any;

  /** 中断函数 */
  abort: UseHookExposure['abort'];
}

/**
 * useRequest和useWatcher中间件的context参数
 */
export interface AlovaFrontMiddlewareContext<AG extends AlovaGenerics> extends AlovaMiddlewareContext<AG> {
  /** 发送请求函数 */
  send: SendHandler<AG['Responded']>;

  /** args 响应处理回调的参数，该参数由use hooks的send传入 */
  args: any[];

  /** 前端状态集合 */
  proxyStates: FrontRequestState<
    FrameworkState<boolean, 'loading'>,
    FrameworkState<AG['Responded'], 'data'>,
    FrameworkState<Error | undefined, 'error'>,
    FrameworkState<Progress, 'downloading'>,
    FrameworkState<Progress, 'uploading'>
  >;

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
export interface AlovaFetcherMiddlewareContext<AG extends AlovaGenerics> extends AlovaMiddlewareContext<AG> {
  /** 数据预加载函数 */
  fetch<Transformed>(method: Method<AG>, ...args: any[]): Promise<Transformed>;

  /** args 响应处理回调的参数，该参数由useFetcher的fetch传入 */
  args: any[];

  /** fetch状态的代理集合 */
  proxyStates: FetchRequestState<
    FrameworkState<boolean, 'loading'>,
    FrameworkState<Error | undefined, 'error'>,
    FrameworkState<Progress, 'downloading'>,
    FrameworkState<Progress, 'uploading'>
  >;

  /**
   * 调用后将自定义控制fetching的状态，内部不再触发fetching状态的变更
   * 传入control为false时将取消控制
   *
   * @param control 是否控制fetching，默认为true
   */
  controlFetching: (control?: boolean) => void;
}

/** 中间件next函数 */
export interface MiddlewareNextGuardConfig<AG extends AlovaGenerics> {
  force?: UseHookConfig<AG>['force'];
  method?: Method<AG>;
}
export interface AlovaGuardNext<AG extends AlovaGenerics> {
  (guardNextConfig?: MiddlewareNextGuardConfig<AG>): Promise<AG['Responded']>;
}

/**
 * alova useRequest/useWatcher中间件
 */
export interface AlovaFrontMiddleware<AG extends AlovaGenerics> {
  (context: AlovaFrontMiddlewareContext<AG>, next: AlovaGuardNext<AG>): any;
}
/**
 * alova useRequest/useWatcher中间件
 */
export interface AlovaFetcherMiddleware<AG extends AlovaGenerics> {
  (context: AlovaFetcherMiddlewareContext<AG>, next: AlovaGuardNext<AG>): any;
}

/** common hook configuration */
export interface UseHookConfig<AG extends AlovaGenerics> {
  /**
   * force request or not
   * @default false
   */
  force?: boolean | ((event: AlovaEvent<AG>) => boolean);

  /**
   * refering object that sharing some value with this object.
   */
  __referingObj?: ReferingObject;

  /**
   * other attributes
   */
  [attr: string]: any;
}

/** useRequest和useWatcher都有的类型 */
type InitialDataType = number | string | boolean | object;
export interface FrontRequestHookConfig<AG extends AlovaGenerics> extends UseHookConfig<AG> {
  /** 是否立即发起一次请求 */
  immediate?: boolean;

  /** set initial data for request state */
  initialData?: InitialDataType | (() => InitialDataType);

  /** 额外的监管状态，可通过updateState更新 */
  managedStates?: Record<string | symbol, AG['State']>;

  /** 中间件 */
  middleware?: AlovaFrontMiddleware<AG>;
}

/** useRequest config export type */
export type RequestHookConfig<AG extends AlovaGenerics> = FrontRequestHookConfig<AG>;

/** useWatcher config export type */
export interface WatcherHookConfig<AG extends AlovaGenerics> extends FrontRequestHookConfig<AG> {
  /** 请求防抖时间（毫秒），传入数组时可按watchingStates的顺序单独设置防抖时间 */
  debounce?: number | number[];
  abortLast?: boolean;
}

/** useFetcher config export type */
export interface FetcherHookConfig<AG extends AlovaGenerics = AlovaGenerics> extends UseHookConfig<AG> {
  /** 中间件 */
  middleware?: AlovaFetcherMiddleware<AG>;
  /** fetch是否同步更新data状态 */
  updateState?: boolean;
}

/** 调用useFetcher时需要传入的类型，否则会导致状态类型错误 */
export type FetcherType<A extends Alova<any>> = {
  StatesExport: NonNullable<A['options']['statesHook']> extends StatesHook<infer SE> ? SE : any;
};

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
export declare function useRequest<AG extends AlovaGenerics>(
  methodHandler: Method<AG> | AlovaMethodHandler<AG>,
  config?: RequestHookConfig<AG>
): UseHookExposure<AG>;

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
export declare function useWatcher<AG extends AlovaGenerics>(
  methodHandler: Method<AG> | AlovaMethodHandler<AG>,
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG>;

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
export declare function useFetcher<F extends FetcherType<any>>(
  config?: FetcherHookConfig
): UseFetchHookExposure<F['StatesExport']>;

export type UpdateStateCollection<Responded> = {
  [key: string | number | symbol]: (data: any) => any;
} & {
  data?: (data: Responded) => any;
};
/**
 * cross components to update states by specifing method instance.
 * @example
 * ```js
 * updateState(methodInstance, newData);
 * updateState(methodInstance, oldData => {
 *   oldData.name = 'new name';
 *   return oldData;
 * });
 * ```
 * @param matcher method instance
 * @param handleUpdate new data or update function that returns new data
 * @returns is updated
 */
export declare function updateState<Responded>(
  matcher: Method<AlovaGenerics<Responded>>,
  handleUpdate: UpdateStateCollection<Responded>['data'] | UpdateStateCollection<Responded>
): Promise<boolean>;

export interface UsePaginationExposure<AG extends AlovaGenerics, ListData extends unknown[]>
  extends UseHookExposure<AG> {
  page: ExportedState<number, AG['State']>;
  pageSize: ExportedState<number, AG['State']>;
  data: ExportedState<
    IsUnknown<
      ListData[number],
      AG['Responded'] extends {
        data: any;
      }
        ? AG['Responded']['data']
        : ListData,
      ListData
    >,
    AG['State']
  >;
  pageCount: ExportedComputed<number | undefined, AG['Computed']>;
  total: ExportedComputed<number | undefined, AG['Computed']>;
  isLastPage: ExportedComputed<boolean, AG['Computed']>;
  fetching: ExportedState<boolean, AG['State']>;
  onFetchSuccess(handler: SuccessHandler<AG>): UsePaginationExposure<AG, ListData>;
  onFetchError(handler: ErrorHandler<AG>): UsePaginationExposure<AG, ListData>;
  onFetchComplete(handler: CompleteHandler<AG>): UsePaginationExposure<AG, ListData>;
  update: StateUpdater<UsePaginationExposure<AG, ListData>, AG['StatesExport']>;

  /**
   * 刷新指定页码数据，此函数将忽略缓存强制发送请求
   * 如果未传入页码则会刷新当前页
   * 如果传入一个列表项，将会刷新此列表项所在页，只对append模式有效
   * @param pageOrItemPage 刷新的页码或列表项
   */
  refresh(pageOrItemPage?: number | ListData[number]): void;

  /**
   * 插入一条数据
   * 如果未传入index，将默认插入到最前面
   * 如果传入一个列表项，将插入到这个列表项的后面，如果列表项未在列表数据中将会抛出错误
   * @param item 插入项
   * @param position 插入位置（索引）或列表项
   */
  insert(item: ListData extends any[] ? ListData[number] : any, position?: number | ListData[number]): Promise<void>;

  /**
   * 移除一条数据
   * 如果传入的是列表项，将移除此列表项，如果列表项未在列表数据中将会抛出错误
   * @param position 移除的索引或列表项
   */
  remove(...positions: (number | ListData[number])[]): Promise<void>;

  /**
   * 替换一条数据
   * 如果position传入的是列表项，将替换此列表项，如果列表项未在列表数据中将会抛出错误
   * @param item 替换项
   * @param position 替换位置（索引）或列表项
   */
  replace(item: ListData extends any[] ? ListData[number] : any, position: number | ListData[number]): void;

  /**
   * 从第一页开始重新加载列表，并清空缓存
   */
  reload(): void;
}

// /**
//  * alova分页hook
//  * 分页相关状态自动管理、前后一页预加载、自动维护数据的新增/编辑/移除
//  *
//  * @param handler method创建函数
//  * @param config pagination hook配置
//  * @returns {UsePaginationExposure}
//  */
export declare function usePagination<AG extends AlovaGenerics, ListData extends unknown[]>(
  handler: (page: number, pageSize: number) => Method<AG>,
  config?: PaginationHookConfig<AG, ListData>
): UsePaginationExposure<AG, ListData>;

/**
 * 带silentQueue的request hook
 * silentQueue是实现静默提交的核心部件，其中将用于存储silentMethod实例，它们将按顺序串行发送提交
 */
export declare function useSQRequest<AG extends AlovaGenerics>(
  handler: AlovaMethodHandler<AG>,
  config?: SQRequestHookConfig<AG>
): SQHookExposure<AG>;
export declare function bootSilentFactory(options: SilentFactoryBootOptions): void;
export declare function onSilentSubmitBoot(handler: SilentSubmitBootHandler): OffEventCallback;
export declare function onSilentSubmitSuccess(handler: SilentSubmitSuccessHandler): OffEventCallback;
export declare function onSilentSubmitError(handler: SilentSubmitErrorHandler): OffEventCallback;
export declare function onSilentSubmitFail(handler: SilentSubmitFailHandler): OffEventCallback;
export declare function onBeforeSilentSubmit(handler: BeforeSilentSubmitHandler): OffEventCallback;
export declare function dehydrateVData<T>(target: T): T;
export declare function stringifyVData(target: any, returnOriginalIfNotVData?: boolean): any;
export declare function isVData(target: any): boolean;
export declare function equals(prevValue: any, nextValue: any): boolean;
export declare function filterSilentMethods(
  methodNameMatcher?: string | number | RegExp,
  queueName?: string,
  filterActive?: boolean
): Promise<SilentMethod[]>;
export declare function getSilentMethod(
  methodNameMatcher?: string | number | RegExp,
  queueName?: string,
  filterActive?: boolean
): Promise<SilentMethod | undefined>;
export declare const updateStateEffect: typeof updateState;
export declare const silentQueueMap: SilentQueueMap;

/**
 * 验证码发送场景的请求hook
 * @param handler method实例或获取函数
 * @param 配置参数
 * @return useCaptcha相关数据和操作函数
 */
export declare function useCaptcha<AG extends AlovaGenerics>(
  handler: Method<AG> | AlovaMethodHandler<AG>,
  config?: CaptchaHookConfig<AG>
): CaptchaExposure<AG>;

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
export declare function useForm<AG extends AlovaGenerics, FormData extends Record<string | symbol, any>>(
  handler: FormHookHandler<AG, FormData | undefined>,
  config?: FormHookConfig<AG, FormData>
): FormExposure<AG, FormData>;

/**
 * useSSE
 * 使用 Server-sent events 发送请求
 *
 *
 * @param handler method获取函数
 * @param config 配置参数
 * @return useSSE相关数据和操作函数
 */
export declare function useSSE<Data = any, AG extends AlovaGenerics = AlovaGenerics>(
  handler: Method<AG> | AlovaMethodHandler<AG>,
  config?: SSEHookConfig
): SSEExposure<AG, Data>;

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
export declare function useRetriableRequest<AG extends AlovaGenerics>(
  handler: Method<AG> | AlovaMethodHandler<AG>,
  config?: RetriableHookConfig<AG>
): RetriableExposure<AG>;

/**
 * useSerialRequest
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<AG extends AlovaGenerics>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG>, ...AlovaMethodHandler<any>[]],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<AG extends AlovaGenerics, AG2 extends AlovaGenerics>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG>, AlovaMethodHandler<AG2>, ...AlovaMethodHandler<any>[]],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG2>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG3>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG4>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG5>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics,
  AG6 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    AlovaMethodHandler<AG6>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG6>;

/**
 * useSerialRequest(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics,
  AG6 extends AlovaGenerics,
  AG7 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    AlovaMethodHandler<AG6>,
    AlovaMethodHandler<AG7>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG7>;

/**
 * useSerialWatcher
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
export declare function useSerialWatcher<AG extends AlovaGenerics>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG>, ...AlovaMethodHandler<any>[]],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG>;

/**
 * useSerialWatcher(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
export declare function useSerialWatcher<AG extends AlovaGenerics, AG2 extends AlovaGenerics>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG>, AlovaMethodHandler<AG2>, ...AlovaMethodHandler<any>[]],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG2>;

/**
 * useSerialWatcher(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
export declare function useSerialWatcher<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    ...AlovaMethodHandler<any>[]
  ],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG3>;

/**
 * useSerialWatcher(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
export declare function useSerialWatcher<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    ...AlovaMethodHandler<any>[]
  ],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG4>;

/**
 * useSerialWatcher(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
export declare function useSerialWatcher<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    ...AlovaMethodHandler<any>[]
  ],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG5>;

/**
 * useSerialWatcher(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
export declare function useSerialWatcher<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics,
  AG6 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    AlovaMethodHandler<AG6>,
    ...AlovaMethodHandler<any>[]
  ],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG6>;

/**
 * useSerialWatcher(重载)
 * 串行请求hook，handlers中将接收上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialWatcher相关数据和操作函数
 */
export declare function useSerialWatcher<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics,
  AG6 extends AlovaGenerics,
  AG7 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    AlovaMethodHandler<AG6>,
    AlovaMethodHandler<AG7>,
    ...AlovaMethodHandler<any>[]
  ],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG7>;

/**
 * 操作函数委托中间件
 * 使用此中间件后可通过accessAction调用委托的函数
 * 可以委托多个相同id
 * 以此来消除组件的层级限制
 * @param id 委托者id
 * @returns alova中间件函数
 */
export declare const actionDelegationMiddleware: ActionDelegationMiddleware;

/**
 * 访问操作函数，如果匹配多个则会以此调用onMatch
 * @param id 委托者id，或正则表达式
 * @param onMatch 匹配的订阅者
 */
export declare const accessAction: AccessAction;

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
export declare function createClientTokenAuthentication<AG extends AlovaGenerics = AlovaGenerics>(
  options: ClientTokenAuthenticationOptions<
    AlovaRequestAdapter<AG['RequestConfig'], AG['Response'], AG['ResponseHeader']>
  >
): TokenAuthenticationResult<AG>;

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
export declare function createServerTokenAuthentication<AG extends AlovaGenerics = AlovaGenerics>(
  options: ServerTokenAuthenticationOptions<AlovaRequestAdapter<any, any, any>>
): TokenAuthenticationResult<AG>;

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
export declare function useAutoRequest<AG extends AlovaGenerics>(
  handler: Method<AG> | AlovaMethodHandler<AG>,
  config?: AutoRequestHookConfig<AG>
): UseHookExposure<AG>;
export declare namespace useAutoRequest {
  function onNetwork<AG extends AlovaGenerics = AlovaGenerics>(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<AG>
  ): UnbindHandler;
  function onPolling<AG extends AlovaGenerics = AlovaGenerics>(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<AG>
  ): UnbindHandler;
  function onVisibility<AG extends AlovaGenerics = AlovaGenerics>(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<AG>
  ): UnbindHandler;
  function onFocus<AG extends AlovaGenerics = AlovaGenerics>(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<AG>
  ): UnbindHandler;
}
