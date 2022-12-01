import {
  AlovaGuardNext,
  CompleteHandler,
  ErrorHandler,
  FrontRequestHookConfig,
  FrontRequestState,
  SuccessHandler,
  UseHookConfig
} from '../../typings';
import Method from '../Method';
import { getResponseCache, setResponseCache } from '../storage/responseCache';
import { getPersistentResponse } from '../storage/responseStorage';
import { getStateCache, removeStateCache, setStateCache } from '../storage/stateCache';
import { GeneralFn, getLocalCacheConfigParam, key, noop } from '../utils/helper';
import {
  falseValue,
  forEach,
  getConfig,
  getContext,
  len,
  objectKeys,
  promiseCatch,
  promiseReject,
  promiseResolve,
  promiseThen,
  STORAGE_RESTORE,
  trueValue,
  undefinedValue
} from '../utils/variables';
import { SaveStateFn } from './createRequestState';
import sendRequest from './sendRequest';

/**
 * 统一处理useRequest/useWatcher/useController等请求钩子函数的请求逻辑
 * @param method 请求方法对象
 * @param frontStates 前端状态集合
 * @param responser 响应处理对象
 * @param responserHandlerArgs 响应处理回调的参数，该参数由use hooks的send传入
 * @param forceRequest 是否强制发起请求
 * @param updateCacheState 是否更新缓存状态，一般在useFetcher时设置为true
 * @returns 请求状态
 */
export default function useHookToSendRequest<S, E, R, T, RC, RE, RH>(
  methodInstance: Method<S, E, R, T, RC, RE, RH>,
  frontStates: FrontRequestState,
  useHookConfig: UseHookConfig<S, E, R, T, RC, RE, RH>,
  successHandlers: SuccessHandler<R>[],
  errorHandlers: ErrorHandler[],
  completeHandlers: CompleteHandler[],
  responserHandlerArgs: any[] = [],
  updateCacheState = falseValue
) {
  const { force: forceRequest = falseValue, middleware } = useHookConfig as FrontRequestHookConfig<
    S,
    E,
    R,
    T,
    RC,
    RE,
    RH
  >;
  const { id, options, storage } = getContext(methodInstance);
  const { update } = options.statesHook;
  const { enableDownload, enableUpload } = getConfig(methodInstance);
  // 如果是静默请求，则请求后直接调用onSuccess，不触发onError，然后也不会更新progress
  const methodKey = key(methodInstance);

  const runArgsHandler = (handlers: GeneralFn[], ...args: any[]) =>
    forEach(handlers, handler => handler(...args, ...responserHandlerArgs));

  // 初始化状态数据，在拉取数据时不需要加载，因为拉取数据不需要返回data数据
  let removeStates = noop;
  let saveStates = noop as SaveStateFn;
  if (!updateCacheState) {
    const { e: expireMilliseconds, m: cacheMode, t: tag } = getLocalCacheConfigParam(methodInstance);
    const persistentResponse = getPersistentResponse(id, methodKey, storage, tag);
    const cachedResponse = getResponseCache(id, methodKey);

    // 如果有持久化数据，则需要判断是否需要恢复它到缓存中
    // 如果是STORAGE_RESTORE模式，且缓存没有数据时，则需要将持久化数据恢复到缓存中
    if (persistentResponse && cacheMode === STORAGE_RESTORE && !cachedResponse) {
      setResponseCache(id, methodKey, persistentResponse, methodInstance, expireMilliseconds);
    }

    // 如果命中持久化数据，则更新数据
    if (cachedResponse || persistentResponse) {
      update(
        {
          data: cachedResponse || persistentResponse
        },
        frontStates
      );
    }

    // 将初始状态存入缓存以便后续更新
    saveStates = (frontStates: FrontRequestState) => setStateCache(id, methodKey, frontStates);
    saveStates(frontStates);

    // 设置状态移除函数，将会传递给hook内的effectRequest，它将被设置在组件卸载时调用
    removeStates = () => removeStateCache(id, methodKey);
  }

  let requestCtrl: Partial<ReturnType<typeof sendRequest>> = {};
  let responseHandlePromise = promiseResolve<any>(undefinedValue);

  // 中间件函数next回调函数，允许修改强制请求参数，甚至替换即将发送请求的Method实例
  const guardNext: AlovaGuardNext<S, E, R, T, RC, RE, RH> = guardNextConfig => {
    const { force: guardNextforceRequest = forceRequest, method: guardNextReplacingMethod = methodInstance } =
      guardNextConfig || {};
    // 未使用缓存才需要更新loading状态
    const {
      response,
      onDownload = noop,
      onUpload = noop,
      useCache
    } = (requestCtrl = sendRequest(guardNextReplacingMethod, guardNextforceRequest));

    // 命中缓存时不需要更新loading状态
    !useCache &&
      update(
        {
          loading: trueValue
        },
        frontStates
      );

    responseHandlePromise = response();
    const progressUpdater = (stage: 'downloading' | 'uploading') => (loaded: number, total: number) => {
      update(
        {
          [stage]: {
            loaded,
            total
          }
        },
        frontStates
      );
    };
    enableDownload && onDownload(progressUpdater('downloading'));
    enableUpload && onUpload(progressUpdater('uploading'));
    return responseHandlePromise;
  };

  // 调用中间件函数
  let middlewareCompletePromise: Promise<void> | void;
  if (middleware) {
    try {
      middlewareCompletePromise = middleware(
        {
          method: methodInstance
        },
        guardNext
      );
    } catch (e) {
      middlewareCompletePromise = promiseReject(e);
    }
  } else {
    guardNext();
  }

  const isNextCalled = () => len(objectKeys(requestCtrl)) > 0;
  // 统一处理响应
  responseHandlePromise = promiseCatch(
    promiseThen(middlewareCompletePromise || responseHandlePromise, responseData => {
      if (!isNextCalled()) {
        return;
      }

      const afterSuccess = (data: any) => {
        // 更新缓存响应数据
        if (!updateCacheState) {
          update({ data }, frontStates);
        } else {
          // 更新缓存内的状态，一般为useFetcher中进入
          const cachedState = getStateCache(id, methodKey);
          cachedState && update({ data }, cachedState);
        }

        // 在请求后触发对应回调函数，静默请求在请求前已经触发过回调函数了
        update({ loading: falseValue }, frontStates);
        runArgsHandler(successHandlers, data);
        runArgsHandler(completeHandlers);
        return data;
      };

      // 当middlewareCompletePromise有值时，能进入此函数表示为没有错误,或者错误在middleware中被捕获了
      // 此时即使请求有错误，也不需要抛出了，因此调用了afterSuccess(undefinedValue)
      return middlewareCompletePromise
        ? promiseThen(responseHandlePromise, afterSuccess, () => afterSuccess(undefinedValue))
        : afterSuccess(responseData);
    }),

    // catch回调函数
    (error: Error) => {
      if (!isNextCalled()) {
        return;
      }

      // 静默请求下，失败了的话则将请求信息保存到缓存，并开启循环调用请求
      update(
        {
          error,
          loading: falseValue
        },
        frontStates
      );
      runArgsHandler(errorHandlers, error);
      runArgsHandler(completeHandlers);
      return promiseReject(error);
    }
  );

  return {
    ...requestCtrl,
    p: responseHandlePromise,
    r: removeStates,
    s: saveStates
  };
}
