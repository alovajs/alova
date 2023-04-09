import {
  AlovaRequestAdapter,
  Arg,
  ProgressUpdater,
  ResponsedHandler,
  ResponsedHandlerRecord,
  ResponseErrorHandler
} from '../../typings';
import Method from '../Method';
import { matchSnapshotMethod, saveMethodSnapshot } from '../storage/methodSnapShots';
import { getResponseCache, setResponseCache } from '../storage/responseCache';
import { persistResponse } from '../storage/responseStorage';
import cloneMethod from '../utils/cloneMethod';
import {
  getLocalCacheConfigParam,
  instanceOf,
  isFn,
  isPlainObject,
  isSpecialRequestBody,
  key,
  noop,
  promisify,
  self
} from '../utils/helper';
import {
  deleteAttr,
  falseValue,
  getConfig,
  getContext,
  getOptions,
  len,
  objectKeys,
  PromiseCls,
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
  // 将params对象转换为get字符串
  // 过滤掉值为undefined的
  const paramsStr = objectKeys(params)
    .filter(key => params[key] !== undefinedValue)
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // 将get参数拼接到url后面，注意url可能已存在参数
  let urlWithParams = paramsStr ? (url.includes('?') ? `${url}&${paramsStr}` : `${url}?${paramsStr}`) : url;
  // 如果不是/开头的，则需要添加/
  urlWithParams = urlWithParams.startsWith('/') ? urlWithParams : `/${urlWithParams}`;
  // baseURL如果以/结尾，则去掉/
  return (baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL) + urlWithParams;
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
  let requestAdapterCtrls: RequestAdapterReturnType | undefined = undefinedValue;
  let fromCache = trueValue;
  const response = () => {
    const { beforeRequest = noop, responsed = self, requestAdapter } = getOptions(methodInstance);

    // 使用克隆之前的method key，以免在beforeRequest中method被改动而导致method key改变
    // method key在beforeRequest中被改变将会致使使用method 实例操作缓存时匹配失败
    const methodKey = key(methodInstance);
    const clonedMethod = cloneMethod(methodInstance);

    // 发送请求前调用钩子函数
    // beforeRequest支持同步函数和异步函数
    return promisify(beforeRequest(clonedMethod)).then(() => {
      const { baseURL, url: newUrl, type, data } = clonedMethod;
      const { id, storage } = getContext(clonedMethod);
      const {
        params = {},
        headers = {},
        localCache,
        transformData = self,
        name: methodInstanceName = '',
        shareRequest
      } = getConfig(clonedMethod);

      // 如果当前method设置了受控缓存，则看是否有自定义的数据
      if (isFn(localCache)) {
        return localCache();
      }
      // 如果是强制请求的，则跳过从缓存中获取的步骤
      // 否则判断是否使用缓存数据
      if (!forceRequest) {
        const cachedResp = getResponseCache(id, methodKey);
        if (cachedResp) {
          return cachedResp;
        }
      }

      fromCache = falseValue;
      const { e: expireTimestamp, s: toStorage, t: tag } = getLocalCacheConfigParam(clonedMethod);
      const namespacedAdapterReturnMap = (adapterReturnMap[id] = adapterReturnMap[id] || {});
      requestAdapterCtrls = namespacedAdapterReturnMap[methodKey];
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

      let responsedHandler: ResponsedHandler<any, any, RC, RE, RH> = self;
      let responseErrorHandler: ResponseErrorHandler<any, any, RC, RE, RH> | undefined = undefinedValue;
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
      return (
        PromiseCls.all([requestAdapterCtrls!.response(), requestAdapterCtrls!.headers()])
          .then(
            ([rawResponse, headers]) =>
              promisify(responsedHandler(rawResponse, clonedMethod))
                .then(data => transformData(data, headers))
                .then(transformedData => {
                  saveMethodSnapshot(id, methodKey, methodInstance);
                  // 当requestBody为特殊数据时不保存缓存
                  // 原因1：特殊数据一般是提交特殊数据，需要和服务端交互
                  // 原因2：特殊数据不便于生成缓存key
                  const requestBody = clonedMethod.data;
                  const toCache = !requestBody || !isSpecialRequestBody(requestBody);
                  if (toCache) {
                    setResponseCache(id, methodKey, transformedData, expireTimestamp);
                    toStorage && persistResponse(id, methodKey, transformedData, expireTimestamp, storage, tag);
                  }

                  // 查找hitTarget，让它的缓存失效
                  const hitMethods = matchSnapshotMethod({
                    filter: cachedMethod => {
                      let isHit = falseValue;
                      const hitSource = cachedMethod.hitSource;
                      if (hitSource) {
                        for (const i in hitSource) {
                          const sourceMatcher = hitSource[i];
                          if (
                            instanceOf(sourceMatcher, RegExp)
                              ? sourceMatcher.test(methodInstanceName as string)
                              : sourceMatcher === methodInstanceName || sourceMatcher === methodKey
                          ) {
                            isHit = trueValue;
                            break;
                          }
                        }
                      }
                      return isHit;
                    }
                  });
                  len(hitMethods) > 0 && invalidateCache(hitMethods);
                  return transformedData;
                }),
            (error: any) => {
              if (!isFn(responseErrorHandler)) {
                throw error;
              }
              // 可能返回Promise.reject
              return responseErrorHandler(error, clonedMethod);
            }
          )
          // 请求成功、失败，以及在成功后处理报错，都需要移除共享的请求
          .finally(() => deleteAttr(namespacedAdapterReturnMap, methodKey))
      );
    });
  };

  return {
    abort: () => requestAdapterCtrls && requestAdapterCtrls.abort(),
    onDownload: (handler: ProgressUpdater) =>
      requestAdapterCtrls && requestAdapterCtrls.onDownload && requestAdapterCtrls.onDownload(handler),
    onUpload: (handler: ProgressUpdater) =>
      requestAdapterCtrls && requestAdapterCtrls.onUpload && requestAdapterCtrls.onUpload(handler),
    response,
    fromCache: () => fromCache
  };
}
