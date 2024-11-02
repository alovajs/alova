import type { EventManager, FrameworkReadableState, FrameworkState, IsUnknown } from '@alova/shared';
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
import { SolidHookExportType } from '../stateshook/solid';
import { SvelteHookExportType } from '../stateshook/svelte';
import { VueHookExportType } from '../stateshook/vue';
import { VueDemiHookExportType } from '../stateshook/vue-demi';

export interface StateMap<T> {
  Vue: VueHookExportType<T>;
  Solid: SolidHookExportType<T>;
  React: ReactHookExportType<T>;
  Svelte: SvelteHookExportType<T>;
  VueDemi: VueDemiHookExportType<T>;
}
/**
 * alova base event
 */
export interface AlovaEvent<AG extends AlovaGenerics, Args extends any[]> {
  /**
   * params from send function
   */
  args: [...Args, ...any[]];
  /**
   * current method instance
   */
  method: Method<AG>;
}
/**
 * success event object
 */
export interface AlovaSuccessEvent<AG extends AlovaGenerics, Args extends any[] = any[]> extends AlovaEvent<AG, Args> {
  /** Whether data from cache */
  fromCache: boolean;
  data: AG['Responded'];
}
/** error event object */
export interface AlovaErrorEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaEvent<AG, Args> {
  error: any;
}
/** completion event object */
export interface AlovaCompleteEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaEvent<AG, Args> {
  /** response status */
  status: 'success' | 'error';
  /** Whether the data from the cache, when the status is error, from cache is always false */
  fromCache: boolean;
  data?: AG['Responded'];
  error?: any;
}

/**
 * Define the type in a way that supports React and Vue. Other types will be needed later and then change on this basis.
 * Use the characteristics of different libraries as parent classes for judgment
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
   * force request
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
  /** current method instance */
  method: Method<AG>;

  /**
   * cache data, only has value when hit cache
   */
  cachedResponse: AG['Responded'] | undefined;

  /** the config of current use hook */
  config: any;

  /** abort request */
  abort: UseHookExposure['abort'];
}

/** next function of middleware */
export interface MiddlewareNextGuardConfig<AG extends AlovaGenerics, Args extends any[]> {
  force?: UseHookConfig<AG, Args>['force'];
  method?: Method<AG>;
}

/**
 * context parameters of useRequest and useWatcher middleware
 */
export interface AlovaFrontMiddlewareContext<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends AlovaMiddlewareContext<AG> {
  /** handler to send request */
  send: SendHandler<Args, AG['Responded']>;

  /** args response processing callback parameters, which are passed in by send of use hooks */
  args: [...Args, ...any[]];

  /** state proxies set */
  proxyStates: FrontRequestState<
    FrameworkState<boolean, 'loading'>,
    FrameworkState<AG['Responded'], 'data'>,
    FrameworkState<Error | undefined, 'error'>,
    FrameworkState<Progress, 'downloading'>,
    FrameworkState<Progress, 'uploading'>
  >;

  /**
   * custom control the state `loading` and doesn't toggle `loading` internally any more.
   * call it with param `false` to cancel controlling.
   * @JOU-amjs
   * @param control whether to control loading, default is `true`
   */
  controlLoading: (control?: boolean) => void;

  /**
   * pass custom data
   */
  [attr: string]: any;
}

/**
 * alova useRequest/useWatcher middleware
 */
export interface AlovaFrontMiddleware<AG extends AlovaGenerics, Args extends any[] = any[]> {
  (context: AlovaFrontMiddlewareContext<AG, Args>, next: AlovaGuardNext<AG, Args>): any;
}

/**
 * the context param of middleware in useFetcher
 */
export interface AlovaFetcherMiddlewareContext<AG extends AlovaGenerics, Args extends any[]>
  extends AlovaMiddlewareContext<AG> {
  /** fetch data */
  fetch<Transformed>(method: Method<AG>, ...args: [...Args, ...any[]]): Promise<Transformed>;

  /** args response processing callback parameters, which are passed in by useFetcher’s fetch */
  args: [...Args, ...any[]];

  /** state proxies set */
  proxyStates: FetchRequestState<
    FrameworkState<boolean, 'loading'>,
    FrameworkState<Error | undefined, 'error'>,
    FrameworkState<Progress, 'downloading'>,
    FrameworkState<Progress, 'uploading'>
  >;

  /**
   * custom control the state `loading` and doesn't toggle `loading` internally any more.
   * call it with param `false` to cancel controlling.
   * @JOU-amjs
   * @param control whether to control loading, default is `true`
   */
  controlLoading: (control?: boolean) => void;

  /**
   * pass custom data
   */
  [attr: string]: any;
}

/**
 * alova useFetcher middleware
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

type EnumHookType = 1 | 2 | 3;
export interface Hook<Args extends any[] = any[]> {
  /** The method instance of the last request */
  m?: Method;

  /** Save states fns */
  sf: ((frontStates: MergedStatesMap) => void)[];

  /** Remove states fns */
  rf: (() => void)[];

  /** Front states */
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
