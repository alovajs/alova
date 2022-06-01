import { RequestConfig, ResponsedHandler, ResponseErrorHandler } from '../../typings';
import Method from '../methods/Method';
import { getResponseCache, setResponseCache } from '../storage/responseCache';
import { persistResponse } from '../storage/responseStorage';
import { getContext, getOptions, key, noop, promiseReject, promiseResolve, self } from '../utils/helper';


/**
 * 实际的请求函数
 * @param method 请求方法对象
 * @param forceRequest 忽略缓存
 * @returns 响应数据
 */
 export default function sendRequest<S, E, R, T>(methodInstance: Method<S, E, R, T>, forceRequest: boolean) {
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
    staleTime = 0,
    persistTime = 0,
  } = getOptions(methodInstance);
  const { id, storage } = getContext(methodInstance);
  const methodKey = key(methodInstance);

  // 如果是强制请求的，则跳过从缓存中获取的步骤
  if (!forceRequest) {
    const response = getResponseCache(id, baseURL, methodKey);
    if (response) {
      return {
        response: () => promiseResolve(response),
        headers: () => promiseResolve({} as Headers),
        abort: noop,
        useCache: true,
      };
    }
  }
  
  // 发送请求前调用钩子函数
  let requestConfig: RequestConfig<R, T> = {
    url,
    method: type,
    data: requestBody,
    ...config,
  };
  requestConfig = beforeRequest(requestConfig) || requestConfig;
  const {
    staleTime: staleTimeFinal = staleTime,
    persistTime: persistTimeFinal = persistTime,
  } = requestConfig;

  // 将params对象转换为get字符串
  const {
    url: newUrl,
    params,
    data,
    transformData = self,
  } = requestConfig;
  let paramsStr = params ? Object.keys(params).map(key => `${key}=${params[key]}`).join('&') : '';

  // 将get参数拼接到url后面，注意url可能已存在参数
  let urlWithParams = paramsStr ? 
    (newUrl.indexOf('?') > -1 ? `${newUrl}&${paramsStr}` : `${newUrl}?${paramsStr}`)
    : newUrl;
  // 如果不是/开头的，则需要添加/
  urlWithParams = urlWithParams.indexOf('/') !== 0 ? `/${urlWithParams}` : urlWithParams;
  // baseURL如果以/结尾，则去掉/
  const baseURLWithSlash = baseURL.indexOf('/') === baseURL.length - 1 ? baseURL.slice(0, -1) : baseURL;
  
  // 请求数据
  const ctrls = requestAdapter(baseURLWithSlash + urlWithParams, data, requestConfig);

  const isFn = (fn: any) => typeof fn === 'function';
  let responsedHandler: ResponsedHandler = noop;
  let responseErrorHandler: ResponseErrorHandler = noop;
  if (isFn(responsed)) {
    responsedHandler = responsed as ResponsedHandler;
  } else if (Array.isArray(responsed)) {
    responsedHandler = isFn(responsed[0]) ? responsed[0] : responsedHandler;
    responseErrorHandler = isFn(responsed[1]) ? responsed[1] : responseErrorHandler;
  }

  const errorCatcher = (error: any) => {
    responseErrorHandler(error);
    return promiseReject(error);
  }
  return {
    ...ctrls,
    useCache: false,
    response: () => Promise.all([
      ctrls.response(),
      ctrls.headers(),
    ]).then(([rawResponse, headers = {} as Headers]) => {
      try {
        let responsedHandlePayload = responsedHandler(rawResponse as any);
        const getStaleTime = (data: any) => typeof staleTimeFinal === 'function' ? staleTimeFinal(data, headers, type) : staleTimeFinal;
        const getPersistTime = (data: any) => typeof persistTimeFinal === 'function' ? persistTimeFinal(data, headers, type) : persistTimeFinal;
        if (responsedHandlePayload instanceof Promise) {
          return responsedHandlePayload.then(data => {
            const staleMilliseconds = getStaleTime(data);
            data = transformData(data, headers);
            setResponseCache(id, baseURL, methodKey, data, staleMilliseconds);
            // 当persist开启时将响应数据存入缓存，以便后续调用（已在saveResponse中判断）
            const persistMilliseconds = getPersistTime(data);
            persistResponse(id, methodKey, data, persistMilliseconds, storage);
            return data;
          });
        } else {
          const staleMilliseconds = getStaleTime(responsedHandlePayload);
          responsedHandlePayload = transformData(responsedHandlePayload, headers);
          setResponseCache(id, baseURL, methodKey, responsedHandlePayload, staleMilliseconds);
          const persistMilliseconds = getPersistTime(data);
          persistResponse(id, methodKey, responsedHandlePayload, persistMilliseconds, storage);
          return responsedHandlePayload;
        }
      } catch (error: any) {
        return errorCatcher(error);
      }
    }, (error: any) => errorCatcher(error)),
  }
}