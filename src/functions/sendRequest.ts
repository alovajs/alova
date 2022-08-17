import { AlovaRequestAdapterConfig, ResponsedHandler, ResponsedHandlerRecord, ResponseErrorHandler } from '../../typings';
import Method from '../Method';
import { getResponseCache, setResponseCache } from '../storage/responseCache';
import { persistResponse } from '../storage/responseStorage';
import { falseValue, getContext, getOptions, objectKeys, PromiseCls, promiseReject, promiseResolve, promiseThen, trueValue, undefinedValue } from '../utils/variables';
import { getLocalCacheConfigParam, instanceOf, isFn, isPlainObject, key, noop, self } from '../utils/helper';
import { addMethodSnapshot } from '../storage/methodSnapshots';


/**
 * 实际的请求函数
 * @param method 请求方法对象
 * @param forceRequest 忽略缓存
 * @returns 响应数据
 */
 export default function sendRequest<S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>, forceRequest: boolean) {
  const {
    type,
    url,
    config,
    requestBody,
  } = methodInstance;
  const {
    baseURL,
    beforeRequest = noop,
    responsed = self,
    requestAdapter,
    localCache = 0,
  } = getOptions(methodInstance);
  const { id, storage } = getContext(methodInstance);
  const methodKey = key(methodInstance);

  // 如果是强制请求的，则跳过从缓存中获取的步骤
  if (!forceRequest) {
    const response = getResponseCache(id, methodKey);
    if (response) {
      return {
        response: () => promiseResolve(response as R),
        headers: () => promiseResolve({} as RH),
        abort: noop,
        useCache: trueValue,
      };
    }
  }
  
  // 发送请求前调用钩子函数
  let requestConfig: AlovaRequestAdapterConfig<R, T, RC, RH> = {
    url,
    ...config,
    method: type,
    data: requestBody,
    headers: config.headers || {},
    params: config.params || {},
  };
  requestConfig = beforeRequest(requestConfig) || requestConfig;
  // 将params对象转换为get字符串
  const {
    url: newUrl,
    params = {},
    localCache: newLocalCache,
    transformData = self,
  } = requestConfig;
  const {
    e: expireMilliseconds,
    s: toStorage,
    t: tag,
  } = getLocalCacheConfigParam(undefinedValue, newLocalCache ?? localCache);

  let paramsStr = objectKeys(params).map(key => `${key}=${params[key]}`).join('&');

  // 将get参数拼接到url后面，注意url可能已存在参数
  let urlWithParams = paramsStr ? 
    (newUrl.indexOf('?') > -1 ? `${newUrl}&${paramsStr}` : `${newUrl}?${paramsStr}`)
    : newUrl;
  // 如果不是/开头的，则需要添加/
  urlWithParams = urlWithParams.indexOf('/') !== 0 ? `/${urlWithParams}` : urlWithParams;
  // baseURL如果以/结尾，则去掉/
  const baseURLWithSlash = baseURL.lastIndexOf('/') === baseURL.length - 1 ? baseURL.slice(0, -1) : baseURL;
  
  // 请求数据
  const ctrls = requestAdapter({
    ...requestConfig,
    url: baseURLWithSlash + urlWithParams,
  });

  let responsedHandler: ResponsedHandler<RE> = noop;
  let responseErrorHandler: ResponseErrorHandler = noop;
  if (isFn(responsed)) {
    responsedHandler = responsed;
  } else if (isPlainObject(responsed)) {
    const {
      onSuccess: successHandler,
      onError: errorHandler,
    } = responsed as ResponsedHandlerRecord<RE>;
    responsedHandler = isFn(successHandler) ? successHandler : responsedHandler;
    responseErrorHandler = isFn(errorHandler) ? errorHandler : responseErrorHandler;
  }

  const errorCatcher = (error: any) => {
    responseErrorHandler(error);
    return promiseReject(error);
  }
  return {
    ...ctrls,
    useCache: falseValue,
    response: () => promiseThen(PromiseCls.all([
      ctrls.response(),
      ctrls.headers(),
    ]), ([rawResponse, headers]) => {
      addMethodSnapshot(methodInstance);    // 只有请求成功的Method实例才会被保存到快照里
      try {
        let responsedHandlePayload = responsedHandler(rawResponse);
        if (instanceOf(responsedHandlePayload, PromiseCls)) {
          return promiseThen(responsedHandlePayload, data => {
            data = transformData(data, headers);
            setResponseCache(id, methodKey, data, expireMilliseconds);
            toStorage && persistResponse(id, methodKey, data, expireMilliseconds, storage, tag);
            return data;
          });
        } else {
          if (headers) {
            responsedHandlePayload = transformData(responsedHandlePayload, headers);
            setResponseCache(id, methodKey, responsedHandlePayload, expireMilliseconds);
            toStorage && persistResponse(id, methodKey, responsedHandlePayload, expireMilliseconds, storage, tag);
          }
          return responsedHandlePayload;
        }
      } catch (error: any) {
        return errorCatcher(error);
      }
    }, (error: any) => errorCatcher(error)),
  }
}