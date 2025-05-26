import { AlovaCompleteEvent, AlovaErrorEvent, AlovaEventBase, AlovaSuccessEvent } from '@/event';
import { EnumHookType } from '@/util/helper';
import {
  falseValue,
  forEach,
  getContext,
  getHandlerMethod,
  getMethodInternalKey,
  newInstance,
  noop,
  omit,
  promiseResolve,
  promiseThen,
  sloughConfig,
  trueValue,
  undefinedValue
} from '@alova/shared';
import { AlovaGenerics, Method, Progress, queryCache } from 'alova';
import {
  AlovaFetcherMiddleware,
  AlovaFrontMiddleware,
  AlovaGuardNext,
  AlovaMethodHandler,
  FetcherHookConfig,
  FrontRequestHookConfig,
  Hook,
  WatcherHookConfig
} from '~/typings/clienthook';
import defaultMiddleware from '../defaults/middleware';
import { KEY_COMPLETE, KEY_ERROR, KEY_SUCCESS } from './alovaEvent';
import { assertMethod, coreHookAssert } from './assert';
import { getStateCache, removeStateCache, setStateCache } from './stateCache';

/**
 * Unified processing of request logic for useRequest/useWatcher/useFetcher and other request hook functions
 * @param hookInstance hook instance
 * @param methodHandler Request method object or get function
 * @param sendCallingArgs send function parameters
 * @returns Request status
 */
export default function useHookToSendRequest<AG extends AlovaGenerics, Args extends any[] = any[]>(
  hookInstance: Hook<Args>,
  methodHandler: Method<AG> | AlovaMethodHandler<AG, Args>,
  sendCallingArgs: [...Args, ...any[]] = [] as any
) {
  const currentHookAssert = coreHookAssert(hookInstance.ht);
  let methodInstance = getHandlerMethod(methodHandler, currentHookAssert, sendCallingArgs);
  const { fs: frontStates, ht: hookType, c: useHookConfig } = hookInstance;
  const { loading: loadingState, data: dataState, error: errorState } = frontStates;
  const isFetcher = hookType === EnumHookType.USE_FETCHER;
  const { force: forceRequest = falseValue, middleware = defaultMiddleware } = useHookConfig as
    | FrontRequestHookConfig<AG, Args>
    | FetcherHookConfig<AG>;
  const alovaInstance = getContext(methodInstance);
  const { id } = alovaInstance;
  // If it is a silent request, on success will be called directly after the request, on error will not be triggered, and progress will not be updated.
  const methodKey = getMethodInternalKey(methodInstance);
  const { abortLast = trueValue } = useHookConfig as WatcherHookConfig<AG>;
  const isFirstRequest = !hookInstance.m;
  hookInstance.m = methodInstance;

  return (async () => {
    // Initialize status data, which does not need to be loaded when pulling data, because pulling data does not require returning data.
    let removeStates = noop;
    let isNextCalled = falseValue;
    let responseHandlePromise = promiseResolve<any>(undefinedValue);
    let offDownloadEvent = noop;
    let offUploadEvent = noop;
    const cachedResponse = await queryCache(methodInstance as Method);
    let fromCache = () => !!cachedResponse;
    // Whether it is a controlled loading state. When it is true, loading will no longer be set to false in response processing.
    let controlledLoading = falseValue;
    if (!isFetcher) {
      // Store the initial state in cache for subsequent updates
      setStateCache(id, methodKey, hookInstance);

      // Setting the state removal function will be passed to the effect request in the hook, and it will be set to be called when the component is unloaded.
      removeStates = () => removeStateCache(id, methodKey, hookInstance);
    }

    // The middleware function next callback function allows you to modify mandatory request parameters and even replace the method instance that is about to send the request.
    const guardNext: AlovaGuardNext<AG, Args> = guardNextConfig => {
      isNextCalled = trueValue;
      const { force: guardNextForceRequest = forceRequest, method: guardNextReplacingMethod = methodInstance } =
        guardNextConfig || {};
      const forceRequestFinally = sloughConfig(guardNextForceRequest, [
        newInstance(AlovaEventBase<AG, Args>, methodInstance, sendCallingArgs)
      ]);
      const progressUpdater =
        (stage: 'downloading' | 'uploading') =>
        ({ loaded, total }: Progress) => {
          frontStates[stage].v = {
            loaded,
            total
          };
        };

      methodInstance = guardNextReplacingMethod;
      // The latest controller needs to be saved every time a request is sent
      hookInstance.rf[methodKey] = removeStates;

      // Loading will not be changed when the loading state is controlled
      // The cache is missed, or loading needs to be set to true when forcing a request.
      if (!controlledLoading) {
        loadingState.v = !!forceRequestFinally || !cachedResponse;
      }

      // Determine whether to trigger a progress update based on the tracking status of downloading and uploading
      const { downloading: enableDownload, uploading: enableUpload } = hookInstance.ro.trackedKeys;
      offDownloadEvent = enableDownload ? methodInstance.onDownload(progressUpdater('downloading')) : offDownloadEvent;
      offUploadEvent = enableUpload ? methodInstance.onUpload(progressUpdater('uploading')) : offUploadEvent;
      responseHandlePromise = methodInstance.send(forceRequestFinally);
      fromCache = () => methodInstance.fromCache || falseValue;
      return responseHandlePromise;
    };

    // Call middleware function
    const commonContext = {
      method: methodInstance,
      cachedResponse,
      config: useHookConfig,
      abort: () => methodInstance.abort()
    };
    // Whether it is necessary to update the response data and call the response callback
    const toUpdateResponse = () =>
      hookType !== EnumHookType.USE_WATCHER || !abortLast || hookInstance.m === methodInstance;

    const controlLoading = (control = trueValue) => {
      // only reset loading state in first request
      if (control && isFirstRequest) {
        loadingState.v = falseValue;
      }
      controlledLoading = control;
    };
    // Call middleware function
    const middlewareCompletePromise = isFetcher
      ? (middleware as AlovaFetcherMiddleware<AG, Args>)(
          {
            ...commonContext,
            args: sendCallingArgs,
            fetch: (methodInstance, ...args) => {
              assertMethod(currentHookAssert, methodInstance);
              return useHookToSendRequest(hookInstance, methodInstance as Method<AG>, args);
            },
            proxyStates: omit(frontStates, 'data'),
            controlLoading
          },
          guardNext
        )
      : (middleware as AlovaFrontMiddleware<AG, Args>)(
          {
            ...commonContext,
            args: sendCallingArgs,
            send: (...args) => useHookToSendRequest(hookInstance, methodHandler, args as any),
            proxyStates: frontStates,
            controlLoading
          },
          guardNext
        );

    let finallyResponse: any = undefinedValue;
    const baseEvent = (AlovaEventBase<AG, Args>).spawn(methodInstance, sendCallingArgs);
    try {
      // Unified processing of responses
      const middlewareReturnedData = await middlewareCompletePromise;
      const afterSuccess = (data: any) => {
        // Update cached response data
        if (!isFetcher) {
          toUpdateResponse() && (dataState.v = data);
        } else if (hookInstance.c.updateState !== falseValue) {
          // Update the status in the cache, usually entered in use fetcher
          forEach(getStateCache(id, methodKey), hookInstance => {
            hookInstance.fs.data.v = data;
          });
        }

        // If the response data needs to be updated, the corresponding callback function is triggered after the request.
        if (toUpdateResponse()) {
          errorState.v = undefinedValue;
          // Loading status will no longer change to false when controlled
          !controlledLoading && (loadingState.v = falseValue);
          hookInstance.em.emit(KEY_SUCCESS, newInstance(AlovaSuccessEvent<AG, Args>, baseEvent, data, fromCache()));
          hookInstance.em.emit(
            KEY_COMPLETE,
            newInstance(AlovaCompleteEvent<AG, Args>, baseEvent, KEY_SUCCESS, data, fromCache(), undefinedValue)
          );
        }
        return data;
      };

      finallyResponse =
        // When no data is returned or undefined is returned in the middleware, get the real response data
        // Otherwise, use the returned data and no longer wait for the response promise. At this time, you also need to call the response callback.
        middlewareReturnedData !== undefinedValue
          ? afterSuccess(middlewareReturnedData)
          : isNextCalled
            ? // There are two possibilities when middlewareCompletePromise is resolve
              // 1. The request is normal
              // 2. The request is incorrect, but the error is captured by the middleware function. At this time, the success callback will also be called, that is, afterSuccess(undefinedValue)
              await promiseThen(responseHandlePromise, afterSuccess, () => afterSuccess(undefinedValue))
            : // If is next called is not called, no data is returned
              undefinedValue;

      // When the next function is not called, update loading to false.
      !isNextCalled && !controlledLoading && (loadingState.v = falseValue);
    } catch (error: any) {
      if (toUpdateResponse()) {
        // Controls the output of error messages
        errorState.v = error;
        // Loading status will no longer change to false when controlled
        !controlledLoading && (loadingState.v = falseValue);
        hookInstance.em.emit(KEY_ERROR, newInstance(AlovaErrorEvent<AG, Args>, baseEvent, error));
        hookInstance.em.emit(
          KEY_COMPLETE,
          newInstance(AlovaCompleteEvent<AG, Args>, baseEvent, KEY_ERROR, undefinedValue, fromCache(), error)
        );
      }

      throw error;
    }
    // Unbind download and upload events after responding
    offDownloadEvent();
    offUploadEvent();
    return finallyResponse;
  })();
}
