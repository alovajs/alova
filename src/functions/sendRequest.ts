import Method from '@/Method';
import { matchSnapshotMethod, saveMethodSnapshot } from '@/storage/methodSnapShots';
import { getResponseCache, setResponseCache } from '@/storage/responseCache';
import { persistResponse } from '@/storage/responseStorage';
import cloneMethod from '@/utils/cloneMethod';
import { AlovaRequestAdapter, Arg, ProgressUpdater, ResponsedHandler, ResponseErrorHandler } from '~/typings';
import {
  getLocalCacheConfigParam,
  instanceOf,
  isFn,
  isPlainObject,
  isSpecialRequestBody,
  key,
  newInstance,
  noop,
  promisify,
  _self
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
  promiseThen,
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
  const paramsStr = objectKeys(params)
    .filter(key => params[key] !== undefinedValue)
    .map(key => `${key}=${params[key]}`)
    .join('&');
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
    response = () => {
      const { beforeRequest = noop, responsed, responded, requestAdapter } = getOptions(methodInstance),
        // 使用克隆之前的method key，以免在beforeRequest中method被改动而导致method key改变
        // method key在beforeRequest中被改变将会致使使用method 实例操作缓存时匹配失败
        methodKey = key(methodInstance),
        clonedMethod = cloneMethod(methodInstance);

      // 发送请求前调用钩子函数
      // beforeRequest支持同步函数和异步函数
      return promisify(beforeRequest)(clonedMethod)
        .then(() => {
          // 获取受控缓存或非受控缓存
          const { localCache } = getConfig(clonedMethod);
          // 如果当前method设置了受控缓存，则看是否有自定义的数据
          if (isFn(localCache)) {
            return localCache();
          }
          // 如果是强制请求的，则跳过从缓存中获取的步骤
          // 否则判断是否使用缓存数据
          if (!forceRequest) {
            const cachedResp = getResponseCache(getContext(clonedMethod).id, methodKey);
            if (cachedResp) {
              return cachedResp;
            }
          }
        })
        .then(cachedResponse => {
          // 如果没有缓存则发起请求
          if (cachedResponse !== undefinedValue) {
            requestAdapterCtrlsPromiseResolveFn(); // 遇到缓存将不传入ctrls
            return cachedResponse;
          }
          fromCache = falseValue;
          const { baseURL, url: newUrl, type, data } = clonedMethod,
            { id, storage } = getContext(clonedMethod),
            {
              params = {},
              headers = {},
              transformData = _self,
              name: methodInstanceName = '',
              shareRequest
            } = getConfig(clonedMethod),
            { e: expireTimestamp, s: toStorage, t: tag } = getLocalCacheConfigParam(clonedMethod),
            namespacedAdapterReturnMap = (adapterReturnMap[id] = adapterReturnMap[id] || {}),
            // responsed是一个错误的单词，正确的单词是responded
            // 在2.1.0+添加了responded的支持，并和responsed做了兼容处理
            // 计划将在3.0中正式使用responded
            responseUnified = responded || responsed;
          let requestAdapterCtrls = namespacedAdapterReturnMap[methodKey],
            responseHandler: ResponsedHandler<any, any, RC, RE, RH> = _self,
            responseErrorHandler: ResponseErrorHandler<any, any, RC, RE, RH> | undefined = undefinedValue;

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

          if (isFn(responseUnified)) {
            responseHandler = responseUnified;
          } else if (isPlainObject(responseUnified)) {
            const { onSuccess: successHandler, onError: errorHandler } = responseUnified;
            responseHandler = isFn(successHandler) ? successHandler : responseHandler;
            responseErrorHandler = isFn(errorHandler) ? errorHandler : responseErrorHandler;
          }
          return (
            PromiseCls.all([requestAdapterCtrls.response(), requestAdapterCtrls.headers()])
              .then(
                ([rawResponse, headers]) =>
                  promisify(responseHandler)(rawResponse, clonedMethod)
                    .then(data => transformData(data, headers))
                    .then(transformedData => {
                      saveMethodSnapshot(id, methodKey, methodInstance);
                      // 当requestBody为特殊数据时不保存缓存
                      // 原因1：特殊数据一般是提交特殊数据，需要和服务端交互
                      // 原因2：特殊数据不便于生成缓存key
                      const requestBody = clonedMethod.data,
                        toCache = !requestBody || !isSpecialRequestBody(requestBody);
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
