import Method from '../Method';
import { pushSilentRequest } from '../storage/silentStorage';
import { instanceOf, key, noop, serializeMethod } from '../utils/helper';
import myAssert from '../utils/myAssert';
import sendRequest from './sendRequest';
import { CompleteHandler, ErrorHandler, FrontRequestState, SuccessHandler, UseHookConfig } from '../../typings';
import { getStateCache } from '../storage/stateCache';
import { falseValue, forEach, getConfig, getContext, nullValue, promiseReject, promiseResolve, setTimeoutFn, trueValue, undefinedValue } from '../utils/variables';

/**
 * 统一处理useRequest/useWatcher/useController等请求钩子函数的请求逻辑
 * @param method 请求方法对象
 * @param originalState 原始状态
 * @param responser 响应处理对象
 * @param responserHandlerArgs 响应处理回调的参数，该参数由use hooks的send传入
 * @param forceRequest 是否强制发起请求
 * @param updateCacheState 是否更新缓存状态，一般在useFetcher时设置为trueValue
 * @returns 请求状态
 */
 export default function useHookToSendRequest<S, E, R, T, RC, RE, RH>(
  methodInstance: Method<S, E, R, T, RC, RE, RH>,
  originalState: FrontRequestState,
  useHookConfig: UseHookConfig<R>,
  successHandlers: SuccessHandler<R>[],
  errorHandlers: ErrorHandler[],
  completeHandlers: CompleteHandler[],
  responserHandlerArgs: any[] = [],
  updateCacheState = falseValue,
) {
  const forceRequest = !!useHookConfig.force;
  const { id, options, storage } = getContext(methodInstance);
  const { update } = options.statesHook;
  const { silent, enableDownload, enableUpload } = getConfig(methodInstance);
  // 如果是静默请求，则请求后直接调用onSuccess，不触发onError，然后也不会更新progress
  const silentMode = silent && !updateCacheState;   // 在fetch数据时不能静默请求
  const methodKey = key(methodInstance);

  const runArgsHandler = (
    handlers: Function[],
    ...args: any[]
  ) => forEach(handlers, handler => handler(...args, ...responserHandlerArgs));
  if (silentMode) {
    myAssert(!instanceOf(methodInstance.requestBody, FormData), 'FormData is not supported when silent is trueValue');
    // 需要异步执行，同步执行会导致无法收集各类回调函数
    setTimeoutFn(() => {
      runArgsHandler(successHandlers, undefinedValue);
      runArgsHandler(completeHandlers);
    });
    
    // silentMode下，如果网络离线的话就不再实际请求了，而是将请求信息存入缓存
    if (!navigator.onLine) {
      pushSilentRequest(id, methodKey, serializeMethod(methodInstance), storage);
      return {
        response: () => promiseResolve(nullValue),
        headers: () => promiseResolve({} as Headers),
        progress: noop,
        abort: noop,
        p: promiseResolve(nullValue),
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
    loading: trueValue,
  }, originalState);

  const responseHandlePromise = response()
    .then(data => {
      if (!updateCacheState) {
        update({ data }, originalState);
      } else {
        // 更新缓存内的状态，一般为useFetcher中进入
        const cachedState = getStateCache(id, methodKey);
        cachedState && update({ data }, cachedState);
      }

      // 非静默请求才在请求后触发对应回调函数，静默请求在请求前已经触发过回调函数了
      if (!silentMode) {
        update({ loading: falseValue }, originalState);
        runArgsHandler(successHandlers, data);
        runArgsHandler(completeHandlers);
      }
      return data;
    })
    .catch((error: Error) => {
      // 静默请求下，失败了的话则将请求信息保存到缓存，并开启循环调用请求
      update({
        error,
        loading: falseValue,
      }, originalState);
      if (silentMode) {
        pushSilentRequest(id, methodKey, serializeMethod(methodInstance), storage);
      } else {
        runArgsHandler(errorHandlers, error);
        runArgsHandler(completeHandlers);
      }
      return promiseReject(error);
    });
  
  if (!silentMode) {
    enableDownload && onDownload(downloading => update({ downloading }, originalState));
    enableUpload && onUpload(uploading => update({ uploading }, originalState));
  }
  return {
    ...ctrl,
    p: responseHandlePromise,
  };
}