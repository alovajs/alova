import { debounce, EnumHookType, mapObject, statesHookHelper } from '@/util/helper';
import {
  buildNamespacedCacheKey,
  createEventManager,
  createSyncOnceRunner,
  falseValue,
  forEach,
  getContext,
  getHandlerMethod,
  getMethodInternalKey,
  getTime,
  instanceOf,
  isArray,
  isFn,
  isNumber,
  objectValues,
  PromiseCls,
  promiseThen,
  setTimeoutFn,
  sloughConfig,
  trueValue,
  undefinedValue,
  usePromise
} from '@alova/shared';
import type { AlovaGlobalCacheAdapter, Method, Progress } from 'alova';
import { AlovaGenerics, globalConfigMap, promiseStatesHook } from 'alova';
import {
  AlovaCompleteEvent,
  AlovaErrorEvent,
  AlovaMethodHandler,
  AlovaSuccessEvent,
  CompleteHandler,
  ErrorHandler,
  FrontRequestHookConfig,
  SuccessHandler,
  UseHookConfig,
  WatcherHookConfig
} from '~/typings/clienthook';
import { KEY_COMPLETE, KEY_ERROR, KEY_SUCCESS } from './alovaEvent';
import { coreHookAssert } from './assert';
import createHook from './createHook';
import useHookToSendRequest from './useHookToSendRequest';

const refCurrent = <T>(ref: { current: T }) => ref.current;
/**
 * Create request status and uniformly process consistent logic in useRequest, useWatcher, and useFetcher
 * This function will call the creation function of statesHook to create the corresponding request state.
 * When the value is empty, it means useFetcher enters, and data status and cache status are not needed at this time.
 * @param methodInstance request method object
 * @param useHookConfig hook request configuration object
 * @param initialData Initial data data
 * @param immediate Whether to initiate a request immediately
 * @param watchingStates The monitored status, if not passed in, call handleRequest directly.
 * @param debounceDelay Delay time for request initiation
 * @returns Current request status, operation function and event binding function
 */
export default function createRequestState<
  AG extends AlovaGenerics,
  Args extends any[],
  Config extends UseHookConfig<AG, Args>
>(
  hookType: EnumHookType,
  methodHandler: Method<AG> | AlovaMethodHandler<AG, Args>,
  useHookConfig: Config,
  initialData?: FrontRequestHookConfig<AG, Args>['initialData'],
  immediate = falseValue,
  watchingStates?: AG['StatesExport']['Watched'][],
  debounceDelay: WatcherHookConfig<AG>['debounce'] = 0
) {
  // shallow clone config object to avoid passing the same useHookConfig object which may cause vue2 state update error
  useHookConfig = { ...useHookConfig };
  let initialLoading = !!immediate;
  let cachedResponse: any = undefinedValue;

  // When sending a request immediately, you need to determine the initial loading value by whether to force the request and whether there is a cache. This has the following two benefits:
  // 1. Sending the request immediately under react can save one rendering time
  // 2. In the HTML rendered by SSR, the initial view is in the loading state to avoid the loading view flashing when displayed on the client.
  if (immediate) {
    // An error may be reported when calling the get handler method, and try/catch is required.
    try {
      const methodInstance = getHandlerMethod(methodHandler, coreHookAssert(hookType));
      const alovaInstance = getContext(methodInstance);
      const l1CacheResult = (alovaInstance.l1Cache as AlovaGlobalCacheAdapter).get<[any, number]>(
        buildNamespacedCacheKey(alovaInstance.id, getMethodInternalKey(methodInstance))
      );

      // The cache is only checked synchronously, so it does not take effect on asynchronous l1Cache adapters.
      // It is recommended not to set up the asynchronous l1Cache adapter on the client side
      if (l1CacheResult && !instanceOf(l1CacheResult, PromiseCls)) {
        const [data, expireTimestamp] = l1CacheResult;
        // If there is no expiration time, it means that the data will never expire. Otherwise, you need to determine whether it has expired.
        if (!expireTimestamp || expireTimestamp > getTime()) {
          cachedResponse = data;
        }
      }
      const forceRequestFinally = sloughConfig((useHookConfig as UseHookConfig<AG, Args>).force ?? falseValue);
      initialLoading = !!forceRequestFinally || !cachedResponse;
    } catch {}
  }

  const {
    create,
    effectRequest,
    ref,
    objectify,
    exposeProvider,
    transformState2Proxy,
    __referingObj: referingObject
  } = statesHookHelper<AG>(promiseStatesHook(), useHookConfig.__referingObj);
  const progress: Progress = {
    total: 0,
    loaded: 0
  };
  // Put the externally incoming supervised states into the front states collection together
  const { managedStates = {} } = useHookConfig as FrontRequestHookConfig<AG, Args>;
  const managedStatesProxy = mapObject(managedStates, (state, key) => transformState2Proxy(state, key));
  const data = create(cachedResponse ?? ((isFn(initialData) ? initialData() : initialData) as AG['Responded']), 'data');
  const loading = create(initialLoading, 'loading');
  const error = create(undefinedValue as Error | undefined, 'error');
  const downloading = create({ ...progress }, 'downloading');
  const uploading = create({ ...progress }, 'uploading');

  const frontStates = objectify([data, loading, error, downloading, uploading]);
  const eventManager = createEventManager<{
    success: AlovaSuccessEvent<AG, Args>;
    error: AlovaErrorEvent<AG, Args>;
    complete: AlovaCompleteEvent<AG, Args>;
  }>();

  const hookInstance = refCurrent(ref(createHook(hookType, useHookConfig, eventManager, referingObject)));

  /**
   * ## react
   * Every time the function is executed, the following items need to be reset
   */
  hookInstance.fs = frontStates;
  hookInstance.em = eventManager;
  hookInstance.c = useHookConfig;
  hookInstance.ms = { ...frontStates, ...managedStatesProxy };

  const hasWatchingStates = watchingStates !== undefinedValue;
  // Initialize request event
  // Unified send request function
  const handleRequest = (
    handler: Method<AG> | AlovaMethodHandler<AG, Args> = methodHandler,
    sendCallingArgs?: [...Args, ...any[]]
  ) => useHookToSendRequest(hookInstance, handler, sendCallingArgs) as Promise<AG['Responded']>;

  // if user call hook like `await useRequest(...)`
  // that will stop the immediate request, because it will be call a request in function `then`
  const hookRequestPromiseCallback = ref(
    undefinedValue as
      | {
          resolve: (value?: any) => void;
          reject: (reason?: any) => void;
        }
      | undefined
  );
  const isInitialRequest = ref(falseValue);

  // only call once when multiple values changed at the same time
  const onceRunner = refCurrent(ref(createSyncOnceRunner()));

  // Call `handleRequest` in a way that catches the exception
  // Catching exceptions prevents exceptions from being thrown out
  const wrapEffectRequest = (ro = referingObject, handler?: Method<AG> | AlovaMethodHandler<AG>) => {
    onceRunner(() => {
      // Do not send requests when rendering on the server side
      // but if call hook with `await`, the `hookRequestPromiseCallback` will be set as `resolve` and `reject` function
      if (!globalConfigMap.ssr || refCurrent(hookRequestPromiseCallback)) {
        // `referingObject.initialRequest` is used in nuxthook
        referingObject.initialRequest = isInitialRequest.current = trueValue;
        promiseThen(
          handleRequest(handler),
          () => {
            refCurrent(hookRequestPromiseCallback)?.resolve();
          },
          error => {
            // the error tracking indicates that the error need to throw.
            // when user access the `error` state or bind the error event, the error instance won't be thrown out.
            if (!ro.bindError && !ro.trackedKeys.error && !refCurrent(hookRequestPromiseCallback)) {
              throw error;
            }
            refCurrent(hookRequestPromiseCallback)?.reject(error);
          }
        );
      }
    });
  };

  /**
   * fix: https://github.com/alovajs/alova/issues/421
   * Use ref wraps to prevent react from creating new debounce function in every render
   * Explicit passing is required because the context will change
   */
  const debouncingSendHandler = ref(
    debounce(
      (_, ro, handler) => wrapEffectRequest(ro, handler),
      (changedIndex?: number) =>
        isNumber(changedIndex) ? (isArray(debounceDelay) ? debounceDelay[changedIndex] : debounceDelay) : 0
    )
  );

  effectRequest({
    handler:
      // When `watchingStates` is an array, it indicates the watching states (including an empty array). When it is undefined, it indicates the non-watching state.
      hasWatchingStates
        ? (changedIndex: number) => debouncingSendHandler.current(changedIndex, referingObject, methodHandler)
        : () => wrapEffectRequest(referingObject),
    removeStates: () => {
      forEach(objectValues(hookInstance.rf), fn => fn());
    },
    frontStates: { ...frontStates, ...managedStatesProxy },
    watchingStates,
    immediate: immediate ?? trueValue
  });

  const hookProvider = exposeProvider({
    ...objectify([data, loading, error, downloading, uploading]),
    abort: () => hookInstance.m && hookInstance.m.abort(),
    /**
     * Manually initiate a request by executing this method
     * @param sendCallingArgs Parameters passed in when calling the send function
     * @param methodInstance method object
     * @param isFetcher Whether to call isFetcher
     * @returns Request promise
     */
    send: (sendCallingArgs?: [...Args, ...any[]], methodInstance?: Method<AG>) =>
      handleRequest(methodInstance, sendCallingArgs),
    onSuccess(handler: SuccessHandler<AG, Args>) {
      eventManager.on(KEY_SUCCESS, handler);
    },
    onError(handler: ErrorHandler<AG, Args>) {
      // will not throw error when bindError is true.
      // it will reset in `exposeProvider` so that ignore the error binding in custom use hooks.
      referingObject.bindError = trueValue;
      eventManager.on(KEY_ERROR, handler);
    },
    onComplete(handler: CompleteHandler<AG, Args>) {
      eventManager.on(KEY_COMPLETE, handler);
    },

    /**
     * send and wait for responding with `await`
     * this is always used in `nuxt3` and `<suspense>` in vue3
     * @example
     * ```js
     * const { loading, data, error } = await useRequest(...);
     * ```
     */
    then(onfulfilled: (result: any) => void, onrejected: (reason: any) => void) {
      const { promise, resolve, reject } = usePromise<void>();
      hookRequestPromiseCallback.current = {
        resolve,
        reject
      };

      // if the request handler is not called, the promise will resolve asynchronously.
      setTimeoutFn(() => {
        !isInitialRequest.current && resolve();
      }, 10);
      promiseThen(
        promise,
        () => {
          onfulfilled(hookProvider);
        },
        onrejected
      );
    }
  });
  return hookProvider;
}
