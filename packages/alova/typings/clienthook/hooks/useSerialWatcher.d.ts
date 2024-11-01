import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, UseHookExposure } from '../general';
import { WatcherHookConfig } from './useWatcher';

/**
 * useSerialWatcher
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: After monitoring status changes, serially request a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialWatcher related data and operation functions
 */
export declare function useSerialWatcher<AG extends AlovaGenerics, Args extends any[] = any[]>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG, Args>, ...AlovaMethodHandler<any>[]],
  watchingStates: AG['StatesExport']['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG, Args>;

/**
 * useSerialWatcher(overload)
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: After monitoring status changes, serially request a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialWatcher related data and operation functions
 */
export declare function useSerialWatcher<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  Args extends any[] = any[]
>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG, Args>, AlovaMethodHandler<AG2>, ...AlovaMethodHandler<any>[]],
  watchingStates: AG['StatesExport']['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG2, Args>;

/**
 * useSerialWatcher(overload)
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: After monitoring status changes, serially request a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialWatcher related data and operation functions
 */
export declare function useSerialWatcher<
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
  watchingStates: AG['StatesExport']['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG3, Args>;

/**
 * useSerialWatcher(overload)
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: After monitoring status changes, serially request a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialWatcher related data and operation functions
 */
export declare function useSerialWatcher<
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
  watchingStates: AG['StatesExport']['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG4, Args>;

/**
 * useSerialWatcher(overload)
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: After monitoring status changes, serially request a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialWatcher related data and operation functions
 */
export declare function useSerialWatcher<
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
  watchingStates: AG['StatesExport']['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG5, Args>;

/**
 * useSerialWatcher(overload)
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: After monitoring status changes, serially request a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialWatcher related data and operation functions
 */
export declare function useSerialWatcher<
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
  watchingStates: AG['StatesExport']['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG6, Args>;

/**
 * useSerialWatcher(overload)
 * Serial request hook, the handlers will receive the result of the previous request
 * Applicable scenario: After monitoring status changes, serially request a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialWatcher related data and operation functions
 */
export declare function useSerialWatcher<
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
  watchingStates: AG['StatesExport']['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG7, Args>;
