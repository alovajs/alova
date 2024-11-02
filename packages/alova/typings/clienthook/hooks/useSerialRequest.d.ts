import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, UseHookExposure } from '../general';
import { RequestHookConfig } from './useRequest';

/**
 * useSerialRequest
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: Serial request for a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialRequest related data and operation functions
 */
export declare function useSerialRequest<AG extends AlovaGenerics, Args extends any[] = any[]>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG, Args>, ...AlovaMethodHandler<any>[]],
  config?: RequestHookConfig<AG, Args>
): UseHookExposure<AG, Args>;

/**
 * useSerialRequest(overload)
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: Serial request for a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialRequest related data and operation functions
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  Args extends any[] = any[]
>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG, Args>, AlovaMethodHandler<AG2>, ...AlovaMethodHandler<any>[]],
  config?: RequestHookConfig<AG, Args>
): UseHookExposure<AG2, Args>;

/**
 * useSerialRequest(overload)
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: Serial request for a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialRequest related data and operation functions
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  Args extends any[] = any[]
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG, Args>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG, Args>
): UseHookExposure<AG3, Args>;

/**
 * useSerialRequest(overload)
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: Serial request for a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialRequest related data and operation functions
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  Args extends any[] = any[]
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG, Args>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG, Args>
): UseHookExposure<AG4, Args>;

/**
 * useSerialRequest(overload)
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: Serial request for a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialRequest related data and operation functions
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics,
  Args extends any[] = any[]
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG, Args>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG, Args>
): UseHookExposure<AG5, Args>;

/**
 * useSerialRequest(overload)
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: Serial request for a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialRequest related data and operation functions
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics,
  AG6 extends AlovaGenerics,
  Args extends any[] = any[]
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG, Args>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    AlovaMethodHandler<AG6>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG, Args>
): UseHookExposure<AG6, Args>;

/**
 * useSerialRequest(overload)
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: Serial request for a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialRequest related data and operation functions
 */
export declare function useSerialRequest<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics,
  AG6 extends AlovaGenerics,
  AG7 extends AlovaGenerics,
  Args extends any[] = any[]
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG, Args>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    AlovaMethodHandler<AG6>,
    AlovaMethodHandler<AG7>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG, Args>
): UseHookExposure<AG7, Args>;
