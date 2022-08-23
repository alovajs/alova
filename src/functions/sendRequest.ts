import { AlovaRequestAdapterConfig, ResponsedHandler, ResponsedHandlerRecord, ResponseErrorHandler } from '../../typings';
import Method from '../Method';
import { getResponseCache, setResponseCache } from '../storage/responseCache';
import { persistResponse } from '../storage/responseStorage';
import { len, falseValue, getContext, getOptions, objectKeys, PromiseCls, promiseReject, promiseResolve, promiseThen, trueValue, undefinedValue } from '../utils/variables';
import { getLocalCacheConfigParam, isFn, isPlainObject, key, noop, self } from '../utils/helper';
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
  const baseURLWithSlash = baseURL.lastIndexOf('/') === len(baseURL) - 1 ? baseURL.slice(0, -1) : baseURL;
  
  // 请求数据
  const ctrls = requestAdapter({
    ...requestConfig,
    url: baseURLWithSlash + urlWithParams,
  });

  let responsedHandler: ResponsedHandler<any, any, RC, RE, RH> = noop;
  let responseErrorHandler: ResponseErrorHandler<any, any, RC, RH> = noop;
  if (isFn(responsed)) {
    responsedHandler = responsed;
  } else if (isPlainObject(responsed)) {
    const {
      onSuccess: successHandler,
      onError: errorHandler,
    } = responsed as ResponsedHandlerRecord<any, any, RC, RE, RH>;
    responsedHandler = isFn(successHandler) ? successHandler : responsedHandler;
    responseErrorHandler = isFn(errorHandler) ? errorHandler : responseErrorHandler;
  }

  const errorCatcher = (error: any) => {
    responseErrorHandler(error, requestConfig);
    return promiseReject(error);
  }

  const aa = PromiseCls.all([
    ctrls.response(),
    ctrls.headers(),
  ]);
  return {
    ...ctrls,
    useCache: falseValue,
    response: () => promiseThen(aa, ([rawResponse, headers]) => {
      addMethodSnapshot(methodInstance);    // 只有请求成功的Method实例才会被保存到快照里
      try {
        const responsedHandleData = promiseResolve(responsedHandler(rawResponse, requestConfig));
        return promiseThen(responsedHandleData, data => {
          data = transformData(data, headers);
          setResponseCache(id, methodKey, data, expireMilliseconds);
          toStorage && persistResponse(id, methodKey, data, expireMilliseconds, storage, tag);
          return data;
        });
      } catch (error: any) {
        return errorCatcher(error);
      }
    }, (error: any) => errorCatcher(error)),
  }
}