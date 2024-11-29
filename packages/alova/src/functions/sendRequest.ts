import defaultCacheLogger from '@/defaults/cacheLogger';
import { getRawWithCacheAdapter, getWithCacheAdapter, setWithCacheAdapter } from '@/storage/cacheWrapper';
import cloneMethod from '@/utils/cloneMethod';
import {
  $self,
  MEMORY,
  PromiseCls,
  STORAGE_RESTORE,
  buildCompletedURL,
  deleteAttr,
  falseValue,
  getConfig,
  getContext,
  getLocalCacheConfigParam,
  getMethodInternalKey,
  getOptions,
  isFn,
  isPlainObject,
  isSpecialRequestBody,
  newInstance,
  noop,
  promiseFinally,
  promiseReject,
  promiseThen,
  sloughFunction,
  trueValue,
  undefinedValue
} from '@alova/shared';
import {
  AlovaGenerics,
  AlovaRequestAdapter,
  Method,
  ProgressUpdater,
  RespondedHandler,
  ResponseCompleteHandler,
  ResponseErrorHandler
} from '~/typings';
import { hitCacheBySource } from './manipulateCache';

// The request adapter returns information temporarily, which is used to implement request sharing.
type RequestAdapterReturnType = ReturnType<AlovaRequestAdapter<any, any, any>>;
const adapterReturnMap: Record<string, Record<string, RequestAdapterReturnType>> = {};

/**
 * actual request function
 * @param method request method object
 * @param forceRequest Ignore cache
 * @returns response data
 */
export default function sendRequest<AG extends AlovaGenerics>(methodInstance: Method<AG>, forceRequest: boolean) {
  let fromCache = trueValue;
  let requestAdapterCtrlsPromiseResolveFn: (value?: RequestAdapterReturnType) => void;
  const requestAdapterCtrlsPromise = newInstance(PromiseCls, resolve => {
    requestAdapterCtrlsPromiseResolveFn = resolve;
  }) as Promise<RequestAdapterReturnType | undefined>;
  const response = async () => {
    const { beforeRequest = noop, responded, requestAdapter, cacheLogger } = getOptions(methodInstance);
    const methodKey = getMethodInternalKey(methodInstance);

    const { s: toStorage, t: tag, m: cacheMode, e: expireMilliseconds } = getLocalCacheConfigParam(methodInstance);
    const { id, l1Cache, l2Cache, snapshots } = getContext(methodInstance);
    // Get controlled cache or uncontrolled cache
    const { cacheFor } = getConfig(methodInstance);
    const { hitSource: methodHitSource } = methodInstance;

    // If the current method sets a controlled cache, check whether there is custom data
    let cachedResponse = await (isFn(cacheFor)
      ? cacheFor()
      : // If it is a forced request, skip the step of getting it from the cache
        // Otherwise, determine whether to use cached data
        forceRequest
        ? undefinedValue
        : getWithCacheAdapter(id, methodKey, l1Cache));

    // If it is storage restore mode and there is no data in the cache, the persistent data needs to be restored to the cache, and the cached expiration time must be used.
    if (cacheMode === STORAGE_RESTORE && !cachedResponse) {
      const rawL2CacheData = await getRawWithCacheAdapter(id, methodKey, l2Cache, tag);
      if (rawL2CacheData) {
        const [l2Response, l2ExpireMilliseconds] = rawL2CacheData;
        await setWithCacheAdapter(id, methodKey, l2Response, l2ExpireMilliseconds, l1Cache, methodHitSource);
        cachedResponse = l2Response;
      }
    }

    // Clone the method as a parameter and pass it to beforeRequest to prevent side effects when using the original method instance request multiple times.
    // Place it after `let cachedResponse = await...` to solve the problem of first assigning promise to the method instance in method.send, otherwise the promise will be undefined in clonedMethod.
    const clonedMethod = cloneMethod(methodInstance);

    // Call the hook function before sending the request
    // beforeRequest supports synchronous functions and asynchronous functions
    await beforeRequest(clonedMethod);
    const { baseURL, url: newUrl, type, data } = clonedMethod;
    const { params = {}, headers = {}, transform = $self, shareRequest } = getConfig(clonedMethod);
    const namespacedAdapterReturnMap = (adapterReturnMap[id] = adapterReturnMap[id] || {});
    let requestAdapterCtrls = namespacedAdapterReturnMap[methodKey];
    let responseSuccessHandler: RespondedHandler<AG> = $self;
    let responseErrorHandler: ResponseErrorHandler<AG> | undefined = undefinedValue;
    let responseCompleteHandler: ResponseCompleteHandler<AG> = noop;

    // uniform handler of onSuccess, onError, onComplete
    if (isFn(responded)) {
      responseSuccessHandler = responded;
    } else if (isPlainObject(responded)) {
      const { onSuccess: successHandler, onError: errorHandler, onComplete: completeHandler } = responded;
      responseSuccessHandler = isFn(successHandler) ? successHandler : responseSuccessHandler;
      responseErrorHandler = isFn(errorHandler) ? errorHandler : responseErrorHandler;
      responseCompleteHandler = isFn(completeHandler) ? completeHandler : responseCompleteHandler;
    }
    // If there is no cache, make a request
    if (cachedResponse !== undefinedValue) {
      requestAdapterCtrlsPromiseResolveFn(); // Ctrls will not be passed in when cache is encountered

      // Print cache log
      clonedMethod.fromCache = trueValue;
      sloughFunction(cacheLogger, defaultCacheLogger)(cachedResponse, clonedMethod, cacheMode, tag);
      responseCompleteHandler(clonedMethod);
      return cachedResponse;
    }
    fromCache = falseValue;

    if (!shareRequest || !requestAdapterCtrls) {
      // Request data
      const ctrls = requestAdapter(
        {
          url: buildCompletedURL(baseURL, newUrl, params),
          type,
          data,
          headers
        },
        clonedMethod as any
      );
      requestAdapterCtrls = namespacedAdapterReturnMap[methodKey] = ctrls;
    }
    // Pass request adapter ctrls to promise for use in on download, on upload and abort
    requestAdapterCtrlsPromiseResolveFn(requestAdapterCtrls);

    /**
     * Process response tasks and do not cache data on failure
     * @param responsePromise Respond to promise instances
     * @param responseHeaders Request header
     * @param callInSuccess Whether to call in success callback
     * @returns Processed response
     */
    const handleResponseTask = async (handlerReturns: any, responseHeaders: any, callInSuccess = trueValue) => {
      const responseData = await handlerReturns;
      const transformedData = await transform(responseData, responseHeaders || {});
      snapshots.save(methodInstance);

      // Even if the cache operation fails, the response structure will be returned normally to avoid request errors caused by cache operation problems.
      // The cache operation results can be obtained through `cacheAdapter.emitter.on('success' | 'fail', event => {})`
      try {
        // Automatic cache invalidation
        await hitCacheBySource(clonedMethod);
      } catch {}

      // Do not save cache when requestBody is special data
      // Reason 1: Special data is generally submitted and requires interaction with the server.
      // Reason 2: Special data is not convenient for generating cache keys
      const requestBody = clonedMethod.data;
      const toCache = !requestBody || !isSpecialRequestBody(requestBody);

      // Use the latest expiration time after the response to cache data to avoid the problem of expiration time loss due to too long response time
      if (toCache && callInSuccess) {
        try {
          await PromiseCls.all([
            setWithCacheAdapter(id, methodKey, transformedData, expireMilliseconds(MEMORY), l1Cache, methodHitSource),
            toStorage &&
              setWithCacheAdapter(
                id,
                methodKey,
                transformedData,
                expireMilliseconds(STORAGE_RESTORE),
                l2Cache,
                methodHitSource,
                tag
              )
          ]);
        } catch {}
      }
      return transformedData;
    };

    return promiseFinally(
      promiseThen(
        PromiseCls.all([requestAdapterCtrls.response(), requestAdapterCtrls.headers()]),
        ([rawResponse, rawHeaders]) => {
          // Regardless of whether the request succeeds or fails, the shared request needs to be removed first
          deleteAttr(namespacedAdapterReturnMap, methodKey);
          return handleResponseTask(responseSuccessHandler(rawResponse, clonedMethod), rawHeaders);
        },
        (error: any) => {
          // Regardless of whether the request succeeds or fails, the shared request needs to be removed first
          deleteAttr(namespacedAdapterReturnMap, methodKey);
          return isFn(responseErrorHandler)
            ? // When responding to an error, if no error is thrown, the successful response process will be processed, but the data will not be cached.
              handleResponseTask(responseErrorHandler(error, clonedMethod), undefinedValue, falseValue)
            : promiseReject(error);
        }
      ),
      () => {
        responseCompleteHandler(clonedMethod);
      }
    );
  };

  return {
    // request interrupt function
    abort: () => {
      promiseThen(
        requestAdapterCtrlsPromise,
        requestAdapterCtrls => requestAdapterCtrls && requestAdapterCtrls.abort()
      );
    },
    onDownload: (handler: ProgressUpdater) => {
      promiseThen(
        requestAdapterCtrlsPromise,
        requestAdapterCtrls =>
          requestAdapterCtrls && requestAdapterCtrls.onDownload && requestAdapterCtrls.onDownload(handler)
      );
    },
    onUpload: (handler: ProgressUpdater) => {
      promiseThen(
        requestAdapterCtrlsPromise,
        requestAdapterCtrls =>
          requestAdapterCtrls && requestAdapterCtrls.onUpload && requestAdapterCtrls.onUpload(handler)
      );
    },
    response,
    fromCache: () => fromCache
  };
}
