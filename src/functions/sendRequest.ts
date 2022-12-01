import {
  AlovaRequestAdapterConfig,
  ResponsedHandler,
  ResponsedHandlerRecord,
  ResponseErrorHandler
} from '../../typings';
import Method from '../Method';
import { getResponseCache, setResponseCache } from '../storage/responseCache';
import { persistResponse } from '../storage/responseStorage';
import {
  asyncOrSync,
  getLocalCacheConfigParam,
  isFn,
  isPlainObject,
  key,
  noop,
  self,
  sloughConfig
} from '../utils/helper';
import {
  falseValue,
  getContext,
  getOptions,
  objectKeys,
  PromiseCls,
  promiseResolve,
  promiseThen,
  trueValue,
  undefinedValue
} from '../utils/variables';

/**
 * 实际的请求函数
 * @param method 请求方法对象
 * @param forceRequest 忽略缓存
 * @returns 响应数据
 */
export default function sendRequest<S, E, R, T, RC, RE, RH>(
  methodInstance: Method<S, E, R, T, RC, RE, RH>,
  forceRequest: boolean | (() => boolean)
) {
  const { baseURL, url, type, config, requestBody } = methodInstance;
  const { beforeRequest = noop, responsed = self, requestAdapter } = getOptions(methodInstance);
  const { id, storage } = getContext(methodInstance);
  const methodKey = key(methodInstance);

  forceRequest = sloughConfig(forceRequest);
  // 如果是强制请求的，则跳过从缓存中获取的步骤
  if (!forceRequest) {
    const response = getResponseCache(id, methodKey);
    if (response) {
      return {
        response: () => promiseResolve(response as R),
        headers: () => promiseResolve({} as RH),
        abort: noop,
        useCache: trueValue
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
    params: config.params || {}
  };
  requestConfig = beforeRequest(requestConfig) || requestConfig;
  // 将params对象转换为get字符串
  const { url: newUrl, params = {}, localCache: newLocalCache, transformData = self } = requestConfig;
  const { e: expireTimestamp, s: toStorage, t: tag } = getLocalCacheConfigParam(undefinedValue, newLocalCache);

  // 过滤掉值为undefined的
  const paramsStr = objectKeys(params)
    .filter(key => params[key] !== undefinedValue)
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // 将get参数拼接到url后面，注意url可能已存在参数
  let urlWithParams = paramsStr ? (newUrl.includes('?') ? `${newUrl}&${paramsStr}` : `${newUrl}?${paramsStr}`) : newUrl;
  // 如果不是/开头的，则需要添加/
  urlWithParams = urlWithParams.startsWith('/') ? urlWithParams : `/${urlWithParams}`;
  // baseURL如果以/结尾，则去掉/
  const baseURLWithSlash = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;

  // 请求数据
  const ctrls = requestAdapter({
    ...requestConfig,
    url: baseURLWithSlash + urlWithParams
  });

  let responsedHandler: ResponsedHandler<any, any, RC, RE, RH> = self;
  let responseErrorHandler: ResponseErrorHandler<any, any, RC, RH> | undefined = undefinedValue;
  if (isFn(responsed)) {
    responsedHandler = responsed;
  } else if (isPlainObject(responsed)) {
    const { onSuccess: successHandler, onError: errorHandler } = responsed as ResponsedHandlerRecord<
      any,
      any,
      RC,
      RE,
      RH
    >;
    responsedHandler = isFn(successHandler) ? successHandler : responsedHandler;
    responseErrorHandler = isFn(errorHandler) ? errorHandler : responseErrorHandler;
  }

  return {
    ...ctrls,
    useCache: falseValue,
    response: () =>
      promiseThen(
        PromiseCls.all([ctrls.response(), ctrls.headers()]),
        ([rawResponse, headers]) => {
          return asyncOrSync(responsedHandler(rawResponse, requestConfig), data => {
            data = transformData(data, headers);
            setResponseCache(id, methodKey, data, methodInstance, expireTimestamp);
            toStorage && persistResponse(id, methodKey, data, expireTimestamp, storage, tag);
            return data;
          });
        },
        (error: any) => {
          if (!isFn(responseErrorHandler)) {
            throw error;
          }
          // 可能返回Promise.reject
          return responseErrorHandler(error, requestConfig);
        }
      )
  };
}
