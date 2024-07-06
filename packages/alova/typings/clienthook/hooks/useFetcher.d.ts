import { Alova, AlovaGenerics, FetchRequestState, Method, Progress, ReferingObject } from 'alova';
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
  state: ReturnType<NonNullable<A['options']['statesHook']>['create']>;
  export: ReturnType<NonNullable<NonNullable<A['options']['statesHook']>['export']>>;
};

/** useFetcher config export type */
export interface FetcherHookConfig<AG extends AlovaGenerics = AlovaGenerics> extends UseHookConfig<AG> {
  /** 中间件 */
  middleware?: AlovaFetcherMiddleware<AG>;
  /** fetch是否同步更新data状态 */
  updateState?: boolean;
}

export interface UseFetchExportedState<State>
  extends FetchRequestState<
    ExportedState<boolean, State>,
    ExportedState<Error | undefined, State>,
    ExportedState<Progress, State>,
    ExportedState<Progress, State>
  > {}
export interface UseFetchHookExposure<State> extends UseFetchExportedState<State> {
  fetch<R>(matcher: Method<AlovaGenerics<R>>, ...args: any[]): Promise<R>;
  update: StateUpdater<UseFetchExportedState<State>>;
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
export declare function useFetcher<SE extends FetcherType<any>>(
  config?: FetcherHookConfig
): UseFetchHookExposure<SE['state']>;
