import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, UseHookExposure } from '../general';
import { FrontRequestHookConfig } from './useRequest';

/** useWatcher config export type */
export interface WatcherHookConfig<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends FrontRequestHookConfig<AG, Args> {
  /** Request anti-shake time (milliseconds). When passing in the array, you can set the anti-shake time individually in the order of watching states. */
  debounce?: number | number[];
  abortLast?: boolean;
}

/**
 * Request after monitoring specific status value changes
 * @example
 * ```js
 *  const { data, loading, error, send, onSuccess } = useWatcher(() => alova.Get('/api/user-list'), [keywords])
 * ```
 * @param methodHandler method instance or get function
 * @param watchingStates Listening status array
 * @param config Configuration items
 * @returns Responsive request data, operation functions and event binding functions
 */
export declare function useWatcher<AG extends AlovaGenerics, Args extends any[] = any[]>(
  methodHandler: Method<AG> | AlovaMethodHandler<AG, Args>,
  watchingStates: AG['StatesExport']['Watched'][],
  config?: WatcherHookConfig<AG, Args>
): UseHookExposure<AG, Args>;
