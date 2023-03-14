import { AlovaRequestAdapter, ResponsedHandler, ResponsedHandlerRecord, ResponseErrorHandler } from '../../typings';
import Method from '../Method';
import { matchSnapshotMethod, saveMethodSnapshot } from '../storage/methodSnapShots';
import { getResponseCache, setResponseCache } from '../storage/responseCache';
import { persistResponse } from '../storage/responseStorage';
import cloneMethod from '../utils/cloneMethod';
import {
  asyncOrSync,
  getLocalCacheConfigParam,
  instanceOf,
  isFn,
  isPlainObject,
  isSpecialRequestBody,
  key,
  newInstance,
  noop,
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
  promiseResolve,
  trueValue,
  undefinedValue
} from '../utils/variables';
import { invalidateCache } from './manipulateCache';

// 请求适配器返回信息暂存，用于实现请求共享
type RequestAdapterReturnType = ReturnType<AlovaRequestAdapter<any, any, any, any, any>>;
const adapterReturnMap: Record<string, Record<string, RequestAdapterReturnType>> = {};

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
  const { beforeRequest = noop, responsed = self, requestAdapter } = getOptions(methodInstance);

  // 使用克隆之前的method key，以免在beforeRequest中method被改动而导致method key改变
  // method key在beforeRequest中被改变将会致使使用method 实例操作缓存时匹配失败
  const methodKey = key(methodInstance);
  const clonedMethod = cloneMethod(methodInstance);

  // 发送请求前调用钩子函数
  beforeRequest(clonedMethod);
  const { baseURL, url: newUrl, type, data } = clonedMethod;
  const { id, storage } = getContext(clonedMethod);

  // 如果是强制请求的，则跳过从缓存中获取的步骤
  if (!forceRequest) {
    const response = getResponseCache(id, methodKey);
    if (response) {
      return {
        response: () => promiseResolve(response as R),
        headers: () => promiseResolve({} as RH),
        abort: noop
      };
    }
  }

  const {
    params = {},
    headers = {},
    localCache: newLocalCache,
    transformData = self,
    name: methodInstanceName = '',
    shareRequest
  } = getConfig(clonedMethod);
  const { e: expireTimestamp, s: toStorage, t: tag } = getLocalCacheConfigParam(undefinedValue, newLocalCache);

  const namespacedAdapterReturnMap = (adapterReturnMap[id] = adapterReturnMap[id] || {});
  let hitAdapterCtrls = namespacedAdapterReturnMap[methodKey];
  if (!shareRequest || !hitAdapterCtrls) {
    // 将params对象转换为get字符串
    // 过滤掉值为undefined的
    const paramsStr = objectKeys(params)
      .filter(key => params[key] !== undefinedValue)
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // 将get参数拼接到url后面，注意url可能已存在参数
    let urlWithParams = paramsStr
      ? newUrl.includes('?')
        ? `${newUrl}&${paramsStr}`
        : `${newUrl}?${paramsStr}`
      : newUrl;
    // 如果不是/开头的，则需要添加/
    urlWithParams = urlWithParams.startsWith('/') ? urlWithParams : `/${urlWithParams}`;
    // baseURL如果以/结尾，则去掉/
    const baseURLWithSlash = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;

    // 请求数据
    const ctrls = requestAdapter(
      {
        url: baseURLWithSlash + urlWithParams,
        type,
        data,
        headers
      },
      clonedMethod
    );
    hitAdapterCtrls = namespacedAdapterReturnMap[methodKey] = ctrls;
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
  return {
    ...hitAdapterCtrls,
    response: () =>
      PromiseCls.all([hitAdapterCtrls.response(), hitAdapterCtrls.headers()]).then(
        ([rawResponse, headers]) =>
          asyncOrSync(
            newInstance(PromiseCls, resolve => {
              resolve(responsedHandler(rawResponse, clonedMethod));
            }),
            data => {
              deleteAttr(namespacedAdapterReturnMap, methodKey);
              data = transformData(data, headers);

              saveMethodSnapshot(id, methodKey, methodInstance);
              // 当requestBody为特殊数据时不保存缓存
              // 原因1：特殊数据一般是提交特殊数据，需要和服务端交互
              // 原因2：特殊数据不便于生成缓存key
              const requestBody = clonedMethod.data;
              const toCache = !requestBody || !isSpecialRequestBody(requestBody);
              if (toCache) {
                setResponseCache(id, methodKey, data, expireTimestamp);
                toStorage && persistResponse(id, methodKey, data, expireTimestamp, storage, tag);
              }

              // 查找hitTarget，让它的缓存失效
              const hitMethods = matchSnapshotMethod(
                {
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
                },
                trueValue
              );
              len(hitMethods) > 0 && invalidateCache(hitMethods);
              return data;
            },
            reason => {
              deleteAttr(namespacedAdapterReturnMap, methodKey);
              throw reason;
            }
          ),
        (error: any) => {
          // 请求失败时也需要移除共享的请求
          deleteAttr(namespacedAdapterReturnMap, methodKey);
          if (!isFn(responseErrorHandler)) {
            throw error;
          }
          // 可能返回Promise.reject
          return responseErrorHandler(error, clonedMethod);
        }
      )
  };
}
