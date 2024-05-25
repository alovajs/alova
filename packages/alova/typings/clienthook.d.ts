import { EventManager } from '@alova/shared/createEventManager';
import { IsAny } from '@alova/shared/types';
import { Alova, AlovaGenerics, FetchRequestState, FrontRequestState, Method, Progress, ReferingObject } from 'alova';
import { Readable, Writable } from 'svelte/store';
import { ComputedRef, Ref } from 'vue';

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
  fs: FrontRequestState;

  /**
   * update states.
   */
  upd: (newStates: Record<string, any>, targetStates?: Record<string, any>) => void;

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

export type SendHandler<R> = (...args: any[]) => Promise<R>;
export type UseHookExposure<AG extends AlovaGenerics = AlovaGenerics> = FrontRequestState<
  ExportedState<boolean, AG['State']>,
  ExportedState<AG['Responded'], AG['State']>,
  ExportedState<Error | undefined, AG['State']>,
  ExportedState<Progress, AG['State']>,
  ExportedState<Progress, AG['State']>
> & {
  abort: () => void;
  update: FrontExportedUpdate<AG['Responded']>;
  send: SendHandler<AG['Responded']>;
  onSuccess: (handler: SuccessHandler<AG>) => void;
  onError: (handler: ErrorHandler<AG>) => void;
  onComplete: (handler: CompleteHandler<AG>) => void;
  __referingObj: ReferingObject;
};
export type UseFetchHookExposure<State> = FetchRequestState<
  ExportedState<boolean, State>,
  ExportedState<Error | undefined, State>,
  ExportedState<Progress, State>,
  ExportedState<Progress, State>
> & {
  fetch<R>(matcher: Method, ...args: any[]): Promise<R>;
  update: FetcherExportedUpdate;
  abort: UseHookExposure['abort'];
  onSuccess: UseHookExposure['onSuccess'];
  onError: UseHookExposure['onError'];
  onComplete: UseHookExposure['onComplete'];
};

export type FrontExportedUpdate<R> = (
  newFrontStates: Partial<FrontRequestState<boolean, R, Error | undefined, Progress, Progress>>
) => void;
export type FetcherExportedUpdate = (
  newFetcherStates: Partial<FetchRequestState<boolean, Error | undefined, Progress, Progress>>
) => void;
export interface AlovaMiddlewareContext<AG extends AlovaGenerics> {
  /** 当前的method对象 */
  method: Method<AG>;

  /** 命中的缓存数据 */
  cachedResponse: AG['Responded'] | undefined;

  /** 当前的usehook配置对象 */
  config: any;

  /** 中断函数 */
  abort: UseHookExposure['abort'];

  /** 成功回调装饰 */
  decorateSuccess: (
    decorator: (handler: SuccessHandler<AG>, event: AlovaSuccessEvent<AG>, index: number, length: number) => void
  ) => void;

  /** 失败回调装饰 */
  decorateError: (
    decorator: (handler: ErrorHandler<AG>, event: AlovaErrorEvent<AG>, index: number, length: number) => void
  ) => void;

  /** 完成回调装饰 */
  decorateComplete: (
    decorator: (handler: CompleteHandler<AG>, event: AlovaCompleteEvent<AG>, index: number, length: number) => void
  ) => void;
}

/**
 * useRequest和useWatcher中间件的context参数
 */
export interface AlovaFrontMiddlewareContext<AG extends AlovaGenerics> extends AlovaMiddlewareContext<AG> {
  /** 发送请求函数 */
  send: SendHandler<AG['Responded']>;

  /** sendArgs 响应处理回调的参数，该参数由use hooks的send传入 */
  sendArgs: any[];

  /** 前端状态集合 */
  frontStates: FrontRequestState<
    ExportedState<boolean, AG['State']>,
    ExportedState<AG['Responded'], AG['State']>,
    ExportedState<Error | undefined, AG['State']>,
    ExportedState<Progress, AG['State']>,
    ExportedState<Progress, AG['State']>
  >;

  /** 状态更新函数 */
  update: FrontExportedUpdate<AG['Responded']>;

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

  /** fetchArgs 响应处理回调的参数，该参数由useFetcher的fetch传入 */
  fetchArgs: any[];

  /** fetch状态集合 */
  fetchStates: FetchRequestState<
    ExportedState<boolean, AG['State']>,
    ExportedState<Error | undefined, AG['State']>,
    ExportedState<Progress, AG['State']>,
    ExportedState<Progress, AG['State']>
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
  state: ReturnType<NonNullable<A['options']['statesHook']>['create']>;
  export: ReturnType<NonNullable<NonNullable<A['options']['statesHook']>['export']>>;
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
  watchingStates: AG['Watched'],
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
export declare function useFetcher<SE extends FetcherType<any>>(
  config?: FetcherHookConfig
): UseFetchHookExposure<SE['state']>;

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
  matcher: Method<AlovaGenerics<any, any, any, any, Responded>>,
  handleUpdate: UpdateStateCollection<Responded>['data'] | UpdateStateCollection<Responded>
): Promise<boolean>;
// TODO: 以上类型是从alova迁移过来
// ===================================================
// ===================================================
// ===================================================
