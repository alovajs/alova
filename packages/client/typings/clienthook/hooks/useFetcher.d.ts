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
 * specify the alova type
 * so that it can return the right states
 */
export type FetcherType<A extends Alova<any>> = {
  StatesExport: NonNullable<A['options']['statesHook']> extends StatesHook<infer SE> ? SE : any;
};

/** useFetcher config export type */
export interface FetcherHookConfig<AG extends AlovaGenerics = AlovaGenerics> extends UseHookConfig<AG> {
  /**
   * middleware
   */
  middleware?: AlovaFetcherMiddleware<AG>;
  /**
   * whether to update the corresponding states of fetching method instance
   */
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
 * prefetch data
 * @example
 * ```js
 * const { loading, error, fetch } = useFetcher();
 * const handleFetch = () => {
 *   fetch(alova.Get('/api/profile'));
 * };
 * ```
 * @param config config
 * @returns reactive request data、operate function and event binding function
 */
export declare function useFetcher<F extends FetcherType<any>>(
  config?: FetcherHookConfig
): UseFetchHookExposure<F['StatesExport']>;
