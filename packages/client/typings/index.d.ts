import type { FrameworkReadableState, FrameworkState } from '@alova/shared/FrameworkState';
import type { EventManager } from '@alova/shared/createEventManager';
import type { AlovaCompleteEvent, AlovaErrorEvent, AlovaSuccessEvent } from '@alova/shared/event';
import type { IsAny } from '@alova/shared/types';
import type {
  Alova,
  AlovaGenerics,
  FetchRequestState,
  FrontRequestState,
  Method,
  Progress,
  ReferingObject
} from 'alova';
import type { Readable, Writable } from 'svelte/store';
import type { ComputedRef, Ref } from 'vue';

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

export type StateUpdater<ExportedStates extends Record<string, any>> = (newStates: {
  [K in keyof ExportedStates]?: ExportedStates[K] extends ExportedState<infer R, any> | ExportedComputed<infer R, any>
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
  update: StateUpdater<UseHookExportedState<AG>>;
  send: SendHandler<AG['Responded']>;
  onSuccess: (handler: SuccessHandler<AG>) => void;
  onError: (handler: ErrorHandler<AG>) => void;
  onComplete: (handler: CompleteHandler<AG>) => void;
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
export interface UseFetchHookExposure<State> extends UseFetchExportedState<State> {
  fetch<R>(matcher: Method<AlovaGenerics<any, any, any, any, R>>, ...args: any[]): Promise<R>;
  update: StateUpdater<UseFetchExportedState<State>>;
  abort: UseHookExposure['abort'];
  onSuccess: UseHookExposure['onSuccess'];
  onError: UseHookExposure['onError'];
  onComplete: UseHookExposure['onComplete'];
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

export type UpdateStateCollection<Responded> = {
  [key: string | number | symbol]: (data: any) => any;
} & {
  data?: (data: Responded) => any;
};

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

/** useWatcher config export type */
export interface WatcherHookConfig<AG extends AlovaGenerics> extends FrontRequestHookConfig<AG> {
  /** 请求防抖时间（毫秒），传入数组时可按watchingStates的顺序单独设置防抖时间 */
  debounce?: number | number[];
  abortLast?: boolean;
}
