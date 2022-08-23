import Method from '../Method';
import { pushSilentRequest } from '../storage/silentStorage';
import { getLocalCacheConfigParam, instanceOf, key, noop, serializeMethod } from '../utils/helper';
import myAssert from '../utils/myAssert';
import sendRequest from './sendRequest';
import { CompleteHandler, ErrorHandler, FrontRequestState, SuccessHandler, UseHookConfig } from '../../typings';
import { getStateCache, removeStateCache, setStateCache } from '../storage/stateCache';
import { falseValue, forEach, getConfig, getContext, nullValue, promiseCatch, promiseReject, promiseResolve, promiseThen, pushItem, setTimeoutFn, STORAGE_RESTORE, trueValue, undefinedValue } from '../utils/variables';
import { silentRequestPromises } from './updateState';
import { getPersistentResponse } from '../storage/responseStorage';
import { getResponseCache, setResponseCache } from '../storage/responseCache';
import { SaveStateFn } from './createRequestState';

/**
 * 统一处理useRequest/useWatcher/useController等请求钩子函数的请求逻辑
 * @param method 请求方法对象
 * @param originalState 原始状态
 * @param responser 响应处理对象
 * @param responserHandlerArgs 响应处理回调的参数，该参数由use hooks的send传入
 * @param forceRequest 是否强制发起请求
 * @param updateCacheState 是否更新缓存状态，一般在useFetcher时设置为true
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
  
  // 初始化状态数据，在拉取数据时不需要加载，因为拉取数据不需要返回data数据
  let removeStates = noop;
  let saveStates = noop as SaveStateFn;
  if (!updateCacheState) {
    const {
      e: expireMilliseconds,
      m: cacheMode,
      t: tag,
    } = getLocalCacheConfigParam(methodInstance);

    const persistentResponse = getPersistentResponse(id, methodKey, storage, tag);    
    // 如果命中持久化数据，则更新数据
    if (persistentResponse !== undefinedValue) {
      update({
        data: persistentResponse,
      }, originalState);
    }

    // 将初始状态存入缓存以便后续更新
    saveStates = (frontStates: FrontRequestState) => setStateCache(id, methodKey, frontStates);
    saveStates(originalState);

    // 设置状态移除函数，将会传递给hook内的effectRequest，它将被设置在组件卸载时调用
    removeStates = () => removeStateCache(id, methodKey);

    // 如果有持久化数据，则需要判断是否需要恢复它到缓存中
    // 如果是STORAGE_RESTORE模式，且缓存没有数据时，则需要将持久化数据恢复到缓存中
    if (persistentResponse && cacheMode === STORAGE_RESTORE && !getResponseCache(id, methodKey)) {
      setResponseCache(id, methodKey, persistentResponse, expireMilliseconds);
    }
  }


  if (silentMode) {
    myAssert(!instanceOf(methodInstance.requestBody, FormData), 'FormData is not supported when silent mode');
    // 需要异步执行，同步执行会导致无法收集各类回调函数
    setTimeoutFn(() => {
      runArgsHandler(successHandlers, undefinedValue);
      runArgsHandler(completeHandlers);
      // 执行完需要从头开始清除promise，这样在updateState中才能获取到对应的promise
      silentRequestPromises.shift();
    });
    
    // silentMode下，如果网络离线的话就不再实际请求了，而是将请求信息存入缓存
    if (!navigator.onLine) {
      pushSilentRequest(id, methodKey, serializeMethod(methodInstance), storage);
      const resolvedPromise = promiseResolve(nullValue);
      pushItem(silentRequestPromises, resolvedPromise);   // 离线状态下，静默请求也需要收集一个promise
      return {
        response: () => resolvedPromise,
        headers: () => promiseResolve({} as Headers),
        progress: noop,
        abort: noop,
        p: resolvedPromise,
        r: removeStates,
        s: saveStates,
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

  // 静默模式下和命中缓存时不需要更新loading状态
  !silentMode && !useCache && update({
    loading: trueValue,
  }, originalState);

  const responseHandlePromise = promiseCatch(
    promiseThen(response(), data => {
      // TODO: 更新缓存响应数据
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
    }),
    
    // catch回调函数
    (error: Error) => {
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
    }
  );
  
  const progressUpdater = (stage: 'downloading' | 'uploading') => 
    (loaded: number, total: number) => {
      update({
        [stage]: {
          loaded,
          total,
        },
      }, originalState);
    };
  enableDownload && onDownload(progressUpdater('downloading'));
  enableUpload && onUpload(progressUpdater('uploading'));
  
  // 静默请求下，需要收集请求的promise，在updateState中使用
  if (silentMode) {
    pushItem(silentRequestPromises, responseHandlePromise);
  }

  return {
    ...ctrl,
    p: responseHandlePromise,
    r: removeStates,
    s: saveStates,
  };
}