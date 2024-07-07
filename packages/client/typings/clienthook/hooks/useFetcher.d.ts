import {
  Alova,
  AlovaGenerics,
  FetchRequestState,
  Method,
  Progress,
  ReferingObject,
  StatesExport,
  StatesHook
} from 'alova';
import {
  AlovaFetcherMiddleware,
  ExportedState,
  ProxyStateGetter,
  StateUpdater,
  UseHookConfig,
  UseHookExportedState,
  UseHookExposure
} from '../general';

/**
 * 调用useFetcher时需要传入的类型，否则会导致状态类型错误
 */
export type FetcherType<A extends Alova<any>> = {
  StatesExport: NonNullable<A['options']['statesHook']> extends StatesHook<infer SE> ? SE : any;
};

/** useFetcher config export type */
export interface FetcherHookConfig<AG extends AlovaGenerics = AlovaGenerics> extends UseHookConfig<AG> {
  /** 中间件 */
  middleware?: AlovaFetcherMiddleware<AG>;
  /** fetch是否同步更新data状态 */
  updateState?: boolean;
}

export interface UseFetchExportedState<SE extends StatesExport>
  extends FetchRequestState<
    ExportedState<boolean, SE>,
    ExportedState<Error | undefined, SE>,
    ExportedState<Progress, SE>,
    ExportedState<Progress, SE>
  > {}
export interface UseFetchHookExposure<SE extends StatesExport> extends UseFetchExportedState<SE> {
  fetch<R>(matcher: Method<AlovaGenerics<R>>, ...args: any[]): Promise<R>;
  update: StateUpdater<UseFetchExportedState<SE['State']>, SE>;
  abort: UseHookExposure['abort'];
  onSuccess: UseHookExposure['onSuccess'];
  onError: UseHookExposure['onError'];
  onComplete: UseHookExposure['onComplete'];
  __proxyState: ProxyStateGetter<UseHookExportedState<any>>;
  __referingObj: ReferingObject;
}

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
