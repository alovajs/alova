import { AlovaGenerics, Method } from 'alova';
import { AlovaFrontMiddleware, AlovaMethodHandler, UseHookConfig, UseHookExposure } from '../general';

/** Both use request and use watcher have types */
type InitialDataType = number | string | boolean | object;
export interface FrontRequestHookConfig<AG extends AlovaGenerics, Args extends any[]> extends UseHookConfig<AG, Args> {
  /** Whether to initiate a request immediately */
  immediate?: boolean;

  /** set initial data for request state */
  initialData?: InitialDataType | (() => InitialDataType);

  /** Additional regulatory status, which can be updated via update state */
  managedStates?: Record<string | symbol, AG['StatesExport']['State']>;

  /** Middleware */
  middleware?: AlovaFrontMiddleware<AG, Args>;
}

/** useRequest config export type */
export type RequestHookConfig<AG extends AlovaGenerics, Args extends any[]> = FrontRequestHookConfig<AG, Args>;

/**
 * Automatically manage response status hooks
 * @example
 * ```js
 * const { loading, data, error, send, onSuccess } = useRequest(alova.Get('/api/user'))
 * ```
 * @param methodHandler method instance or get function
 * @param config Configuration items
 * @returns Responsive request data, operation functions and event binding functions
 */
export declare function useRequest<AG extends AlovaGenerics, Args extends any[]>(
  methodHandler: Method<AG> | AlovaMethodHandler<AG, Args>,
  config?: RequestHookConfig<AG, Args>
): UseHookExposure<AG, Args>;
