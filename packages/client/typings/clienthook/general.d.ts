/* eslint-disable @typescript-eslint/no-unused-vars */
import { FrameworkReadableState, FrameworkState } from '@alova/shared/FrameworkState';
import { EventManager } from '@alova/shared/createEventManager';
import {
  AlovaGenerics,
  FetchRequestState,
  FrontRequestState,
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

export type StateUpdater<ExportedStates extends Record<string, any>> = (newStates: {
  [K in keyof ExportedStates]?: ExportedStates[K] extends ExportedState<infer R, any> | ExportedComputed<infer R, any>
    ? R
    : never;
}) => void;

export type AlovaMethodHandler<AG extends AlovaGenerics = any> = (...args: any[]) => Method<AG>;
export type SuccessHandler<AG extends AlovaGenerics> = (event: AlovaSuccessEvent<AG>) => void;
export type ErrorHandler<AG extends AlovaGenerics> = (event: AlovaErrorEvent<AG>) => void;
export type CompleteHandler<AG extends AlovaGenerics> = (event: AlovaCompleteEvent<AG>) => void;

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
export interface MiddlewareNextGuardConfig<AG extends AlovaGenerics> {
  force?: UseHookConfig<AG>['force'];
  method?: Method<AG>;
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
 * alova useRequest/useWatcher中间件
 */
export interface AlovaFrontMiddleware<AG extends AlovaGenerics> {
  (context: AlovaFrontMiddlewareContext<AG>, next: AlovaGuardNext<AG>): any;
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

/**
 * alova useRequest/useWatcher中间件
 */
export interface AlovaFetcherMiddleware<AG extends AlovaGenerics> {
  (context: AlovaFetcherMiddlewareContext<AG>, next: AlovaGuardNext<AG>): any;
}

export type ProxyStateGetter<HookExportedStates extends Record<string, any>> = <K extends keyof HookExportedStates>(
  key: K
) => HookExportedStates[K] extends ExportedState<infer Data, any>
  ? FrameworkState<Data, K & string>
  : HookExportedStates[K] extends ExportedComputed<infer Data, any>
    ? FrameworkReadableState<Data, K & string>
    : never;

export interface AlovaGuardNext<AG extends AlovaGenerics> {
  (guardNextConfig?: MiddlewareNextGuardConfig<AG>): Promise<AG['Responded']>;
}

export type SendHandler<R> = (...args: any[]) => Promise<R>;
export interface UseHookExportedState<AG extends AlovaGenerics>
  extends FrontRequestState<
    ExportedState<boolean, AG['StatesExport']>,
    ExportedState<AG['Responded'], AG['StatesExport']>,
    ExportedState<Error | undefined, AG['StatesExport']>,
    ExportedState<Progress, AG['StatesExport']>,
    ExportedState<Progress, AG['StatesExport']>
  > {}
export interface UseHookExposure<AG extends AlovaGenerics = AlovaGenerics> extends UseHookExportedState<AG> {
  abort: () => void;
  update: StateUpdater<UseHookExportedState<AG>>;
  send: SendHandler<AG['Responded']>;
  onSuccess(handler: SuccessHandler<AG>): this;
  onError(handler: ErrorHandler<AG>): this;
  onComplete(handler: CompleteHandler<AG>): this;
  __proxyState: ProxyStateGetter<UseHookExportedState<AG>>;
  __referingObj: ReferingObject;
}

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
