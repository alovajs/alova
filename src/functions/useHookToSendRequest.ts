import Method from '../methods/Method';
import { pushSilentRequest } from '../storage/silentStorage';
import { key, noop, serializeMethod } from '../utils/helper';
import myAssert from '../utils/myAssert';
import sendRequest from './sendRequest';
import { FrontRequestState } from '../../typings';
import { getStateCache } from '../storage/responseCache';
import Responser, { runHandlers } from '../Responser';
import { getContext, promiseResolve, setTimeoutFn } from '../utils/variables';

/**
 * 统一处理useRequest/useWatcher/useController等请求钩子函数的请求逻辑
 * @param method 请求方法对象
 * @param originalState 原始状态
 * @param successHandlers 成功回调函数数组
 * @param errorHandlers 失败回调函数数组
 * @param completeHandlers 完成回调函数数组
 * @param force 是否强制发起请求
 * @param updateCacheState 是否更新缓存状态，一般在useFetcher时设置为true
 * @returns 请求状态
 */
 export default function useHookToSendRequest<S, E, R, T>(
  methodInstance: Method<S, E, R, T>,
  originalState: FrontRequestState,
  responser: Responser<R>,
  forceRequest = false,
  updateCacheState = false
) {
  const { id, options, storage } = getContext(methodInstance);
  const { baseURL } = options;
  const { update } = options.statesHook;
  const { silent, enableDownload, enableUpload } = methodInstance.config;
  // 如果是静默请求，则请求后直接调用onSuccess，不触发onError，然后也不会更新progress
  const silentMode = silent && !updateCacheState;   // 在fetch数据时不能静默请求
  const methodKey = key(methodInstance);
  responser.timer++;    // 每次请求时+1，并行请求就能知道当前发起的是第几次请求
  const {
    successHandlers,
    errorHandlers,
    completeHandlers,
    timer: requestId,
  } = responser;
  
  if (silentMode) {
    myAssert(!(methodInstance.requestBody instanceof FormData), 'FormData is not supported when silent is true');
    // 需要异步执行，同步执行会导致无法收集各类回调函数
    setTimeoutFn(() => {
      runHandlers(successHandlers, undefined, requestId);
      runHandlers(completeHandlers, requestId);
    }, 0);
    
    // silentMode下，如果网络离线的话就不再实际请求了，而是将请求信息存入缓存
    if (!navigator.onLine) {
      pushSilentRequest(id, methodKey, serializeMethod(methodInstance), storage);
      return {
        response: () => promiseResolve(null),
        headers: () => promiseResolve({} as Headers),
        progress: noop,
        abort: noop,
      };
    }
  }

  // 非静默模式，且未使用缓存才需要更新loading状态
  const ctrl = sendRequest(methodInstance, forceRequest);
  const {
    response,
    onDownload = noop,
    onUpload = noop,
    useCache,
  } = ctrl;
  !silentMode && !useCache && update({
    loading: true,
  }, originalState);

  response()
    .then(data => {
      if (!updateCacheState) {
        update({ data }, originalState);
      } else {
        // 更新缓存内的状态，一般为useFetcher中进入
        const cachedState = getStateCache(id, baseURL, methodKey);
        cachedState && update({ data }, cachedState);
      }

      // 非静默请求才在请求后触发对应回调函数，静默请求在请求前已经触发过回调函数了
      if (!silentMode) {
        update({ loading: false }, originalState);
        runHandlers(successHandlers, data, requestId);
        runHandlers(completeHandlers, requestId);
      }
    })
    .catch((error: Error) => {
      // 静默请求下，失败了的话则将请求信息保存到缓存，并开启循环调用请求
      update({
        error,
        loading: false,
      }, originalState);
      if (silentMode) {
        pushSilentRequest(id, methodKey, serializeMethod(methodInstance), storage);
      } else {
        runHandlers(errorHandlers, error, requestId);
        runHandlers(completeHandlers, requestId);
      }
    });
  
  if (!silentMode) {
    enableDownload && onDownload(downloading => update({ downloading }, originalState));
    enableUpload && onUpload(uploading => update({ uploading }, originalState));
  }
  return ctrl;
}