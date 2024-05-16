import defaultCacheLogger from '@/defaults/cacheLogger';
import { getRawWithCacheAdapter, getWithCacheAdapter, setWithCacheAdapter } from '@/storage/cacheWrapper';
import cloneMethod from '@/utils/cloneMethod';
import {
  $self,
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
  sloughFunction
} from '@alova/shared/function';
import {
  PromiseCls,
  STORAGE_RESTORE,
  deleteAttr,
  falseValue,
  filterItem,
  mapItem,
  objectKeys,
  promiseFinally,
  promiseReject,
  promiseThen,
  trueValue,
  undefinedValue
} from '@alova/shared/vars';
import {
  AlovaGenerics,
  AlovaRequestAdapter,
  Arg,
  Method,
  ProgressUpdater,
  RespondedHandler,
  ResponseCompleteHandler,
  ResponseErrorHandler
} from '~/typings';
import { hitCacheBySource } from './manipulateCache';

// 请求适配器返回信息暂存，用于实现请求共享
type RequestAdapterReturnType = ReturnType<AlovaRequestAdapter<any, any, any>>;
const adapterReturnMap: Record<string, Record<string, RequestAdapterReturnType>> = {};

/**
 * 构建完整的url
 * @param base baseURL
 * @param url 路径
 * @param params url参数
 * @returns 完整的url
 */
const buildCompletedURL = (baseURL: string, url: string, params: Arg) => {
  // baseURL如果以/结尾，则去掉/
  baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  // 如果不是/或http协议开头的，则需要添加/
  url = url.match(/^(\/|https?:\/\/)/) ? url : `/${url}`;

  const completeURL = baseURL + url;

  // 将params对象转换为get字符串
  // 过滤掉值为undefined的
  const paramsStr = mapItem(
    filterItem(objectKeys(params), key => params[key] !== undefinedValue),
    key => `${key}=${params[key]}`
  ).join('&');
  // 将get参数拼接到url后面，注意url可能已存在参数
  return paramsStr ? (+completeURL.includes('?') ? `${completeURL}&${paramsStr}` : `${completeURL}?${paramsStr}`) : completeURL;
};

/**
 * 实际的请求函数
 * @param method 请求方法对象
 * @param forceRequest 忽略缓存
 * @returns 响应数据
 */
export default function sendRequest<AG extends AlovaGenerics>(methodInstance: Method<AG>, forceRequest: boolean) {
  let fromCache = trueValue;
  let requestAdapterCtrlsPromiseResolveFn: (value?: RequestAdapterReturnType) => void;
  const requestAdapterCtrlsPromise = newInstance(PromiseCls, resolve => {
    requestAdapterCtrlsPromiseResolveFn = resolve;
  }) as Promise<RequestAdapterReturnType | undefined>;
  const response = async () => {
    const { beforeRequest = noop, responded, requestAdapter, cacheLogger } = getOptions(methodInstance);
    // 使用克隆的methodKey，防止用户使用克隆的method实例再次发起请求，导致key重复
    const clonedMethod = cloneMethod(methodInstance);
    const methodKey = getMethodInternalKey(clonedMethod);
    const { e: expireMilliseconds, s: toStorage, t: tag, m: cacheMode } = getLocalCacheConfigParam(methodInstance);
    const { id, l1Cache, l2Cache, snapshots } = getContext(methodInstance);
    // 获取受控缓存或非受控缓存
    const { cacheFor } = getConfig(methodInstance);
    const { baseURL, url: newUrl, type, data, hitSource: methodHitSource } = clonedMethod;

    // 如果当前method设置了受控缓存，则看是否有自定义的数据
    let cachedResponse = await (isFn(cacheFor)
      ? cacheFor()
      : // 如果是强制请求的，则跳过从缓存中获取的步骤
        // 否则判断是否使用缓存数据
        forceRequest
        ? undefinedValue
        : getWithCacheAdapter(id, methodKey, l1Cache));

    // 如果是STORAGE_RESTORE模式，且缓存没有数据时，则需要将持久化数据恢复到缓存中，过期时间要使用缓存的
    if (cacheMode === STORAGE_RESTORE && !cachedResponse) {
      const rawL2CacheData = await getRawWithCacheAdapter(id, methodKey, l2Cache, tag);
      if (rawL2CacheData) {
        const [l2Response, l2ExpireMilliseconds] = rawL2CacheData;
        await setWithCacheAdapter(id, methodKey, l2Response, l2ExpireMilliseconds, l1Cache, methodHitSource);
        cachedResponse = l2Response;
      }
    }

    // 发送请求前调用钩子函数
    // beforeRequest支持同步函数和异步函数
    await beforeRequest(clonedMethod);
    const { params = {}, headers = {}, transformData = $self, shareRequest } = getConfig(clonedMethod);
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
    // 如果没有缓存则发起请求
    if (cachedResponse !== undefinedValue) {
      requestAdapterCtrlsPromiseResolveFn(); // 遇到缓存将不传入ctrls

      // 打印缓存日志
      sloughFunction(cacheLogger, defaultCacheLogger)(cachedResponse, clonedMethod as any, cacheMode, tag);
      responseCompleteHandler(clonedMethod);
      return cachedResponse;
    }
    fromCache = falseValue;

    if (!shareRequest || !requestAdapterCtrls) {
      // 请求数据
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
    // 将requestAdapterCtrls传到promise中供onDownload、onUpload及abort中使用
    requestAdapterCtrlsPromiseResolveFn(requestAdapterCtrls);

    /**
     * 处理响应任务，失败时不缓存数据
     * @param responsePromise 响应promise实例
     * @param responseHeaders 请求头
     * @param callInSuccess 是否在成功回调中调用
     * @returns 处理后的response
     */
    const handleResponseTask = async (handlerReturns: any, responseHeaders: any, callInSuccess = trueValue) => {
      const responseData = await handlerReturns;
      const transformedData = await transformData(responseData, responseHeaders || {});
      snapshots.save(methodInstance);

      // 即使缓存操作失败，也正常返回响应结构，避免因缓存操作问题导致请求错误
      // 缓存操作结果，可通过`cacheAdapter.emitter.on('success' | 'fail', event => {})`监听获取
      try {
        // 自动失效缓存
        await hitCacheBySource(clonedMethod);
      } catch (error) {}

      // 当requestBody为特殊数据时不保存缓存
      // 原因1：特殊数据一般是提交特殊数据，需要和服务端交互
      // 原因2：特殊数据不便于生成缓存key
      const requestBody = clonedMethod.data;
      const toCache = !requestBody || !isSpecialRequestBody(requestBody);
      if (toCache && callInSuccess) {
        try {
          await PromiseCls.all([
            setWithCacheAdapter(id, methodKey, transformedData, expireMilliseconds, l1Cache, methodHitSource),
            toStorage && setWithCacheAdapter(id, methodKey, transformedData, expireMilliseconds, l2Cache, methodHitSource, tag)
          ]);
        } catch (error) {}
      }
      return transformedData;
    };

    return promiseFinally(
      promiseThen(
        PromiseCls.all([requestAdapterCtrls.response(), requestAdapterCtrls.headers()]),
        ([rawResponse, rawHeaders]) => {
          // 无论请求成功、失败，都需要首先移除共享的请求
          deleteAttr(namespacedAdapterReturnMap, methodKey);
          return handleResponseTask(responseSuccessHandler(rawResponse, clonedMethod), rawHeaders);
        },
        (error: any) => {
          // 无论请求成功、失败，都需要首先移除共享的请求
          deleteAttr(namespacedAdapterReturnMap, methodKey);
          return isFn(responseErrorHandler)
            ? // 响应错误时，如果未抛出错误也将会处理响应成功的流程，但不缓存数据
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
    // 请求中断函数
    abort: () => {
      promiseThen(requestAdapterCtrlsPromise, requestAdapterCtrls => requestAdapterCtrls && requestAdapterCtrls.abort());
    },
    onDownload: (handler: ProgressUpdater) => {
      promiseThen(
        requestAdapterCtrlsPromise,
        requestAdapterCtrls => requestAdapterCtrls && requestAdapterCtrls.onDownload && requestAdapterCtrls.onDownload(handler)
      );
    },
    onUpload: (handler: ProgressUpdater) => {
      promiseThen(
        requestAdapterCtrlsPromise,
        requestAdapterCtrls => requestAdapterCtrls && requestAdapterCtrls.onUpload && requestAdapterCtrls.onUpload(handler)
      );
    },
    response,
    fromCache: () => fromCache
  };
}
