/* eslint-disable @typescript-eslint/no-unused-vars */
import { FrameworkReadableState, FrameworkState } from '@alova/shared/FrameworkState';
import { EventManager } from '@alova/shared/createEventManager';
import type { IsUnknown } from '@alova/shared/types';
import {
  AlovaGenerics,
  FetchRequestState,
  FrontRequestState,
  MergedStatesMap,
  Method,
  Progress,
  ReferingObject,
  StatesExport
} from 'alova';
import { ReactHookExportType } from '../stateshook/react';
import { SvelteHookExportType } from '../stateshook/svelte';
import { VueHookExportType } from '../stateshook/vue';

export interface StateMap<T> {
  Vue: VueHookExportType<T>;
  React: ReactHookExportType<T>;
  Svelte: SvelteHookExportType<T>;
}
/**
 * alova base event
 */
export interface AlovaEvent<AG extends AlovaGenerics, Args extends any[]> {
  /**
   * params from send function
   */
  args: Args;
  /**
   * current method instance
   */
  method: Method<AG>;
}
/**
 * success event object
 */
export interface AlovaSuccessEvent<AG extends AlovaGenerics, Args extends any[] = any[]> extends AlovaEvent<AG, Args> {
  /** data数据是否来自缓存 */
  fromCache: boolean;
  data: AG['Responded'];
}
/** 错误事件对象 */
export interface AlovaErrorEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaEvent<AG, Args> {
  error: any;
}
/** 完成事件对象 */
export interface AlovaCompleteEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaEvent<AG, Args> {
  /** 响应状态 */
  status: 'success' | 'error';
  /** data数据是否来自缓存，当status为error时，fromCache始终为false */
  fromCache: boolean;
  data?: AG['Responded'];
  error?: any;
}

/**
 * 以支持React和Vue的方式定义类型，后续需要其他类型再在这个基础上变化
 * 使用不同库的特征作为父类进行判断
 */
export type ExportedState<Responded, SE extends StatesExport<any>> = SE['name'] extends keyof StateMap<any>
  ? StateMap<Responded>[SE['name']]['StateExport']
  : Responded;
export type ExportedComputed<Responded, SE extends StatesExport<any>> = SE['name'] extends keyof StateMap<any>
  ? StateMap<Responded>[SE['name']]['ComputedExport']
  : Responded;

export type StateUpdater<ExportedStates extends Record<string, any>, SE extends StatesExport> = (newStates: {
  [K in keyof ExportedStates]?: ExportedStates[K] extends ExportedState<infer R, SE> | ExportedComputed<infer R, SE>
    ? R
    : ExportedStates[K];
}) => void;

export type AlovaMethodHandler<AG extends AlovaGenerics = any, Args extends any[] = any[]> = (
  ...args: Args
) => Method<AG>;
export type SuccessHandler<AG extends AlovaGenerics, Args extends any[]> = (event: AlovaSuccessEvent<AG, Args>) => void;
export type ErrorHandler<AG extends AlovaGenerics, Args extends any[]> = (event: AlovaErrorEvent<AG, Args>) => void;
export type CompleteHandler<AG extends AlovaGenerics, Args extends any[]> = (
  event: AlovaCompleteEvent<AG, Args>
) => void;

/** common hook configuration */
export interface UseHookConfig<AG extends AlovaGenerics, Args extends any[] = any[]> {
  /**
   * force request or not
   * @default false
   */
  force?: boolean | ((event: AlovaEvent<AG, Args>) => boolean);

  /**
   * refering object that sharing some value with this object.
   */
  __referingObj?: ReferingObject;

  /**
   * other attributes
   */
  [attr: string]: any;
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

/** 中间件next函数 */
export interface MiddlewareNextGuardConfig<AG extends AlovaGenerics, Args extends any[]> {
  force?: UseHookConfig<AG, Args>['force'];
  method?: Method<AG>;
}

/**
 * useRequest和useWatcher中间件的context参数
 */
export interface AlovaFrontMiddlewareContext<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends AlovaMiddlewareContext<AG> {
  /** 发送请求函数 */
  send: SendHandler<Args, AG['Responded']>;

  /** args 响应处理回调的参数，该参数由use hooks的send传入 */
  args: Args;

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
 * alova useRequest/useWatcher中间件
 */
export interface AlovaFrontMiddleware<AG extends AlovaGenerics, Args extends any[] = any[]> {
  (context: AlovaFrontMiddlewareContext<AG, Args>, next: AlovaGuardNext<AG, Args>): any;
}

/**
 * useFetcher中间件的context参数
 */
export interface AlovaFetcherMiddlewareContext<AG extends AlovaGenerics, Args extends any[]>
  extends AlovaMiddlewareContext<AG> {
  /** 数据预加载函数 */
  fetch<Transformed>(method: Method<AG>, ...args: Args): Promise<Transformed>;

  /** args 响应处理回调的参数，该参数由useFetcher的fetch传入 */
  args: Args;

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

/**
 * alova useRequest/useWatcher中间件
 */
export interface AlovaFetcherMiddleware<AG extends AlovaGenerics, Args extends any[] = any[]> {
  (context: AlovaFetcherMiddlewareContext<AG, Args>, next: AlovaGuardNext<AG, Args>): any;
}

export type ProxyStateGetter<HookExportedStates extends Record<string, any>> = <K extends keyof HookExportedStates>(
  key: K
) => HookExportedStates[K] extends ExportedState<infer Data, any>
  ? FrameworkState<Data, K & string>
  : HookExportedStates[K] extends ExportedComputed<infer Data, any>
    ? FrameworkReadableState<Data, K & string>
    : never;

export interface AlovaGuardNext<AG extends AlovaGenerics, Args extends any[]> {
  (guardNextConfig?: MiddlewareNextGuardConfig<AG, Args>): Promise<AG['Responded']>;
}

export type SendHandler<Args extends any[], R> = (...args: [...Args, ...any[]]) => Promise<R>;
export interface UseHookExportedState<AG extends AlovaGenerics>
  extends FrontRequestState<
    ExportedState<boolean, AG['StatesExport']>,
    ExportedState<AG['Responded'], AG['StatesExport']>,
    ExportedState<Error | undefined, AG['StatesExport']>,
    ExportedState<Progress, AG['StatesExport']>,
    ExportedState<Progress, AG['StatesExport']>
  > {}
export interface UseHookExposure<
  AG extends AlovaGenerics = AlovaGenerics,
  Args extends any[] = any[],
  SelfType = unknown
> extends UseHookExportedState<AG> {
  abort: () => void;
  update: StateUpdater<UseHookExportedState<AG>, AG['StatesExport']>;
  send: SendHandler<Args, AG['Responded']>;
  onSuccess(handler: SuccessHandler<AG, Args>): IsUnknown<SelfType, this, SelfType>;
  onError(handler: ErrorHandler<AG, Args>): IsUnknown<SelfType, this, SelfType>;
  onComplete(handler: CompleteHandler<AG, Args>): IsUnknown<SelfType, this, SelfType>;
  __proxyState: ProxyStateGetter<UseHookExportedState<AG>>;
  __referingObj: ReferingObject;
}

export const enum EnumHookType {
  USE_REQUEST = 1,
  USE_WATCHER = 2,
  USE_FETCHER = 3
}
export interface Hook<Args extends any[] = any[]> {
  /** 最后一次请求的method实例 */
  m?: Method;

  /** saveStatesFns */
  sf: ((frontStates: MergedStatesMap) => void)[];

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
    success: AlovaSuccessEvent<any, Args>;
    error: AlovaErrorEvent<any, Args>;
    complete: AlovaCompleteEvent<any, Args>;
  }>;

  /** hookType, useRequest=1, useWatcher=2, useFetcher=3 */
  ht: EnumHookType;

  /** hook config */
  c: UseHookConfig<any, Args>;

  /** refering object */
  ro: ReferingObject;

  /** managed states */
  ms: MergedStatesMap;
}
