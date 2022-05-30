import Method from '../methods/Method';
import { pushSilentRequest } from '../storage/silentStorage';
import { CompleteHandler, ErrorHandler, SuccessHandler } from './createRequestState';
import { getContext, key, noop, promiseResolve, serializeMethod } from '../utils/helper';
import myAssert from '../utils/myAssert';
import sendRequest from './sendRequest';
import { RequestState } from '../../typings';
import { getStateCache } from '../storage/responseCache';

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
  originalState: RequestState,
  successHandlers: SuccessHandler[],
  errorHandlers: ErrorHandler[],
  completeHandlers: CompleteHandler[],
  forceRequest = false,
  updateCacheState = false
) {
  const { id, options, storage } = getContext(methodInstance);
  const { baseURL } = options;
  const { update } = options.statesHook;
  // 如果是静默请求，则请求后直接调用onSuccess，不触发onError，然后也不会更新progress
  const silent = methodInstance.config.silent && !updateCacheState;   // 在fetch数据时不能静默请求
  const methodKey = key(methodInstance);
  const runHandlers = (handlers: Function[], ...args: any[]) => handlers.forEach(handler => handler(...args));
  if (silent) {
    myAssert(!(methodInstance.requestBody instanceof FormData), 'FormData is not supported when silent is true');
    // 需要异步执行，同步执行会导致无法收集各类回调函数
    setTimeout(() => runHandlers([
      ...successHandlers,
      ...completeHandlers
    ]), 0);
    
    // silent模式下，如果网络离线的话就不再实际请求了，而是将请求信息存入缓存
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

  update({
    loading: true,
  }, originalState);
  const ctrl = sendRequest(methodInstance, forceRequest);
  const {
    response,
    progress,
  } = ctrl;

  response()
    .then(data => {
      if (!updateCacheState) {
        update({ data }, originalState);
      } else {
        // 更新缓存内的状态，一般为useFetcher中进入
        const cachedState = getStateCache(id, baseURL, methodKey);
        cachedState && update({ data }, cachedState);
      }
      update({ loading: false }, originalState);

      // 非静默请求才在请求后触发对应回调函数，静默请求在请求前已经触发过回调函数了
      if (!silent) {
        runHandlers(successHandlers);
        runHandlers(completeHandlers);
      }
    })
    .catch((error: Error) => {
      // 静默请求下，失败了的话则将请求信息保存到缓存，并开启循环调用请求
      update({
        error,
        loading: false,
      }, originalState);
      if (silent) {
        pushSilentRequest(id, methodKey, serializeMethod(methodInstance), storage)
      } else {
        runHandlers(errorHandlers, error);
        runHandlers(completeHandlers);
      }
    });
  
  if (methodInstance.config.enableProgress && !silent) {
    progress(value => update({ progress: value }, originalState));
  }
  return ctrl;
}