import Method from '@/Method';
import defaultCacheLogger from '@/predefine/defaultCacheLogger';
import { matchSnapshotMethod, saveMethodSnapshot } from '@/storage/methodSnapShots';
import { getResponseCache, setResponseCache } from '@/storage/responseCache';
import { getPersistentRawData, persistResponse } from '@/storage/responseStorage';
import cloneMethod from '@/utils/cloneMethod';
import {
  AlovaRequestAdapter,
  Arg,
  ProgressUpdater,
  ResponseCompleteHandler,
  ResponsedHandler,
  ResponseErrorHandler
} from '~/typings';
import {
  getConfig,
  getContext,
  getLocalCacheConfigParam,
  getMethodInternalKey,
  getOptions,
  instanceOf,
  isFn,
  isPlainObject,
  isSpecialRequestBody,
  newInstance,
  noop,
  sloughFunction,
  _self
} from '../utils/helper';
import {
  deleteAttr,
  falseValue,
  filterItem,
  len,
  mapItem,
  objectKeys,
  PromiseCls,
  promiseFinally,
  promiseThen,
  STORAGE_RESTORE,
  trueValue,
  undefinedValue
} from '../utils/variables';
import { invalidateCache } from './manipulateCache';

// 请求适配器返回信息暂存，用于实现请求共享
type RequestAdapterReturnType = ReturnType<AlovaRequestAdapter<any, any, any, any, any>>;
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
  return paramsStr
    ? +completeURL.includes('?')
      ? `${completeURL}&${paramsStr}`
      : `${completeURL}?${paramsStr}`
    : completeURL;
};

/**
 * 实际的请求函数
 * @param method 请求方法对象
 * @param forceRequest 忽略缓存
 * @returns 响应数据
 */
export default function sendRequest<S, E, R, T, RC, RE, RH>(
  methodInstance: Method<S, E, R, T, RC, RE, RH>,
  forceRequest: boolean
) {
  let fromCache = trueValue,
    requestAdapterCtrlsPromiseResolveFn: (value?: RequestAdapterReturnType) => void;
  const requestAdapterCtrlsPromise = newInstance(PromiseCls, resolve => {
      requestAdapterCtrlsPromiseResolveFn = resolve;
    }) as Promise<RequestAdapterReturnType | undefined>,
    response = async () => {
      const { beforeRequest = noop, responsed, responded, requestAdapter, cacheLogger } = getOptions(methodInstance),
        // 使用克隆的methodKey，防止用户使用克隆的method实例再次发起请求，导致key重复
        clonedMethod = cloneMethod(methodInstance),
        methodKey = getMethodInternalKey(clonedMethod),
        { e: expireMilliseconds, s: toStorage, t: tag, m: cacheMode } = getLocalCacheConfigParam(methodInstance),
        { id, storage } = getContext(methodInstance),
        // 获取受控缓存或非受控缓存
        { localCache } = getConfig(methodInstance);

      // 如果当前method设置了受控缓存，则看是否有自定义的数据
      let cachedResponse = isFn(localCache)
        ? await localCache()
        : // 如果是强制请求的，则跳过从缓存中获取的步骤
        // 否则判断是否使用缓存数据
        forceRequest
        ? undefinedValue
        : getResponseCache(id, methodKey);

      // 如果是STORAGE_RESTORE模式，且缓存没有数据时，则需要将持久化数据恢复到缓存中，过期时间要使用缓存的
      if (cacheMode === STORAGE_RESTORE && !cachedResponse) {
        const rawPersistentData = getPersistentRawData(id, methodKey, storage, tag);
        if (rawPersistentData) {
          const [persistentResponse, persistentExpireMilliseconds] = rawPersistentData;
          setResponseCache(id, methodKey, persistentResponse, persistentExpireMilliseconds);
          cachedResponse = persistentResponse;
        }
      }

      // 发送请求前调用钩子函数
      // beforeRequest支持同步函数和异步函数
      await beforeRequest(clonedMethod);
      const { baseURL, url: newUrl, type, data } = clonedMethod,
        {
          params = {},
          headers = {},
          transformData = _self,
          name: methodInstanceName = '',
          shareRequest
        } = getConfig(clonedMethod),
        namespacedAdapterReturnMap = (adapterReturnMap[id] = adapterReturnMap[id] || {}),
        // responsed是一个错误的单词，正确的单词是responded
        // 在2.1.0+添加了responded的支持，并和responsed做了兼容处理
        // 计划将在3.0中正式使用responded
        responseUnified = responded || responsed;
      let requestAdapterCtrls = namespacedAdapterReturnMap[methodKey],
        responseSuccessHandler: ResponsedHandler<any, any, RC, RE, RH> = _self,
        responseErrorHandler: ResponseErrorHandler<any, any, RC, RE, RH> | undefined = undefinedValue,
        responseCompleteHandler: ResponseCompleteHandler<any, any, RC, RE, RH> = noop;
      if (isFn(responseUnified)) {
        responseSuccessHandler = responseUnified;
      } else if (isPlainObject(responseUnified)) {
        const { onSuccess: successHandler, onError: errorHandler, onComplete: completeHandler } = responseUnified;
        responseSuccessHandler = isFn(successHandler) ? successHandler : responseSuccessHandler;
        responseErrorHandler = isFn(errorHandler) ? errorHandler : responseErrorHandler;
        responseCompleteHandler = isFn(completeHandler) ? completeHandler : responseCompleteHandler;
      }
      // 如果没有缓存则发起请求
      if (cachedResponse !== undefinedValue) {
        requestAdapterCtrlsPromiseResolveFn(); // 遇到缓存将不传入ctrls

        // 打印缓存日志
        sloughFunction(cacheLogger, defaultCacheLogger)(cachedResponse, clonedMethod, cacheMode, tag);
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
          clonedMethod
        );
        requestAdapterCtrls = namespacedAdapterReturnMap[methodKey] = ctrls;
      }
      // 将requestAdapterCtrls传到promise中供onDownload、onUpload及abort中使用
      requestAdapterCtrlsPromiseResolveFn(requestAdapterCtrls);

      /**
       * 处理响应任务，失败时不缓存数据
       * @param responsePromise 响应promise实例
       * @param headers 请求头
       * @param callInSuccess 是否在成功回调中调用
       * @returns 处理后的response
       */
      const handleResponseTask = async (handlerReturns: any, headers: any, callInSuccess = trueValue) => {
        const data = await handlerReturns,
          transformedData = await transformData(data, headers || {});

        saveMethodSnapshot(id, methodKey, methodInstance);
        // 当requestBody为特殊数据时不保存缓存
        // 原因1：特殊数据一般是提交特殊数据，需要和服务端交互
        // 原因2：特殊数据不便于生成缓存key
        const requestBody = clonedMethod.data,
          toCache = !requestBody || !isSpecialRequestBody(requestBody);
        if (toCache && callInSuccess) {
          setResponseCache(id, methodKey, transformedData, expireMilliseconds);
          toStorage && persistResponse(id, methodKey, transformedData, expireMilliseconds, storage, tag);
        }

        // 查找hitTarget，让它的缓存失效
        const hitMethods = matchSnapshotMethod({
          filter: cachedMethod =>
            (cachedMethod.hitSource || []).some(sourceMatcher =>
              instanceOf(sourceMatcher, RegExp)
                ? sourceMatcher.test(methodInstanceName as string)
                : sourceMatcher === methodInstanceName || sourceMatcher === methodKey
            )
        });
        len(hitMethods) > 0 && invalidateCache(hitMethods);
        return transformedData;
      };

      return promiseFinally(
        promiseThen(
          PromiseCls.all([requestAdapterCtrls.response(), requestAdapterCtrls.headers()]),
          ([rawResponse, headers]) => {
            // 无论请求成功、失败，都需要首先移除共享的请求
            deleteAttr(namespacedAdapterReturnMap, methodKey);
            return handleResponseTask(responseSuccessHandler(rawResponse, clonedMethod), headers);
          },
          (error: any) => {
            // 无论请求成功、失败，都需要首先移除共享的请求
            deleteAttr(namespacedAdapterReturnMap, methodKey);
            if (!isFn(responseErrorHandler)) {
              throw error;
            }
            // 响应错误时，如果未抛出错误也将会处理响应成功的流程，但不缓存数据
            return handleResponseTask(responseErrorHandler(error, clonedMethod), undefinedValue, falseValue);
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
