import { RequestState } from '../../typings';
import Method from '../methods/Method';
import { pushSilentRequest } from '../storage/silentStorage';
import { CompleteHandler, ErrorHandler, SuccessHandler } from './createRequestState';
import { key, noop, promiseResolve, serializeMethod } from '../utils/helper';
import myAssert from '../utils/myAssert';
import sendRequest from './sendRequest';

/**
 * 统一处理useRequest/useWatcher/useController等请求钩子函数的请求逻辑
 * @param method 请求方法对象
 * @param originalState 原始状态
 * @param successHandlers 成功回调函数数组
 * @param errorHandlers 失败回调函数数组
 * @returns 请求状态
 */
 export default function useHookRequest<S extends RequestState, E extends RequestState, R, T>(
  method: Method<S, E, R, T>,
  originalState: S,
  successHandlers: SuccessHandler[],
  errorHandlers: ErrorHandler[],
  completeHandlers: CompleteHandler[],
  forceRequest = false
) {
  const { context } = method;
  const { options, storage } = context;
  const { update } = options.statesHook;
  // 如果是静默请求，则请求后直接调用onSuccess，不触发onError，然后也不会更新progress
  const { silent } = method.config;
  let methodKey = '';
  const runHandlers = (handlers: Function[], ...args: any[]) => handlers.forEach(handler => handler(...args));
  if (silent) {
    myAssert(!(method.requestBody instanceof FormData), 'FormData is not supported when silent is true');
    methodKey = key(method);
    runHandlers([
      ...successHandlers,
      ...completeHandlers
    ]);
    
    // silent模式下，如果网络离线的话就不再实际请求了
    if (!navigator.onLine) {
      pushSilentRequest(context.id, methodKey, serializeMethod(method), storage);
      return {
        response: () => promiseResolve(null),
        headers: () => promiseResolve({} as Headers),
        progress: () => {},
        abort: noop,
      };
    }
  }

  update({
    loading: true,
  }, originalState);
  const ctrl = sendRequest(method, forceRequest);
  const {
    response,
    progress,
  } = ctrl;

  response()
    .then(data => {
      update({
        data,
        loading: false,
      }, originalState);
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
        pushSilentRequest(context.id, methodKey, serializeMethod(method), storage)
      } else {
        runHandlers(errorHandlers, error);
        runHandlers(completeHandlers);
      }
    });
  
  if (method.config.enableProgress && !silent) {
    progress(value => update({ progress: value }, originalState));
  }
  return ctrl;
}