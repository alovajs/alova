import Method from '@/Method';
import defaultMiddleware from '@/predefine/defaultMiddleware';
import { getResponseCache, setResponseCache } from '@/storage/responseCache';
import { getPersistentResponse } from '@/storage/responseStorage';
import { getStateCache, removeStateCache, setStateCache } from '@/storage/stateCache';
import createAlovaEvent from '@/utils/createAlovaEvent';
import { GeneralFn, getLocalCacheConfigParam, instanceOf, isFn, key, noop, sloughConfig } from '@/utils/helper';
import myAssert from '@/utils/myAssert';
import {
  falseValue,
  forEach,
  getConfig,
  getContext,
  len,
  MEMORY,
  objectKeys,
  promiseCatch,
  PromiseCls,
  promiseReject,
  promiseResolve,
  promiseThen,
  STORAGE_RESTORE,
  trueValue,
  undefinedValue
} from '@/utils/variables';
import {
  AlovaCompleteEvent,
  AlovaErrorEvent,
  AlovaEvent,
  AlovaGuardNext,
  AlovaSuccessEvent,
  CompleteHandler,
  ErrorHandler,
  FrontRequestHookConfig,
  FrontRequestState,
  SuccessHandler,
  UseHookConfig
} from '~/typings';
import { SaveStateFn } from './createRequestState';
import sendRequest from './sendRequest';

/**
 * 统一处理useRequest/useWatcher/useController等请求钩子函数的请求逻辑
 * @param methodInstance 请求方法对象
 * @param frontStates 前端状态集合
 * @param useHookConfig useHook配置对象
 * @param successHandlers 成功回调
 * @param errorHandlers 失败回调
 * @param completeHandlers 完成回调
 * @param sendArgs send函数参数
 * @param updateCacheState 是否更新缓存状态，一般在useFetcher时设置为true
 * @returns 请求状态
 */
export default function useHookToSendRequest<S, E, R, T, RC, RE, RH, UC extends UseHookConfig<S, E, R, T, RC, RE, RH>>(
  methodInstance: Method<S, E, R, T, RC, RE, RH>,
  frontStates: FrontRequestState,
  useHookConfig: UC,
  successHandlers: SuccessHandler<S, E, R, T, RC, RE, RH>[],
  errorHandlers: ErrorHandler<S, E, R, T, RC, RE, RH>[],
  completeHandlers: CompleteHandler<S, E, R, T, RC, RE, RH>[],
  sendArgs: any[] = [],
  updateCacheState = falseValue
) {
  const { force: forceRequest = falseValue, middleware = defaultMiddleware } = useHookConfig as FrontRequestHookConfig<
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
  // 如果是静默请求，则请求后直接调用onSuccess，不触发onError，然后也不会更新progress
  const methodKey = key(methodInstance);

  // 初始化状态数据，在拉取数据时不需要加载，因为拉取数据不需要返回data数据
  let removeStates = noop;
  let saveStates = noop as SaveStateFn;
  const { e: expireMilliseconds, m: cacheMode, t: tag } = getLocalCacheConfigParam(methodInstance);
  let cachedResponse: R | undefined = getResponseCache(id, methodKey);
  if (!updateCacheState) {
    // 当缓存模式为memory时不获取缓存，减少缓存获取
    const persistentResponse =
      cacheMode !== MEMORY ? getPersistentResponse(id, methodKey, storage, tag) : undefinedValue;

    // 如果有持久化数据，则需要判断是否需要恢复它到缓存中
    // 如果是STORAGE_RESTORE模式，且缓存没有数据时，则需要将持久化数据恢复到缓存中
    if (cacheMode === STORAGE_RESTORE && !cachedResponse && persistentResponse) {
      setResponseCache(id, methodKey, persistentResponse, expireMilliseconds);
      cachedResponse = persistentResponse;
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
  let fromCache = () => !!cachedResponse;
  // 是否为受控的loading状态，当为true时，响应处理中将不再设置loading为false
  let controlledLoading = falseValue;

  // 中间件函数next回调函数，允许修改强制请求参数，甚至替换即将发送请求的Method实例
  const guardNext: AlovaGuardNext<S, E, R, T, RC, RE, RH> = guardNextConfig => {
    const { force: guardNextForceRequest = forceRequest, method: guardNextReplacingMethod = methodInstance } =
      guardNextConfig || {};
    const forceRequestFinally = sloughConfig(guardNextForceRequest, sendArgs);
    const {
      response,
      onDownload = noop,
      onUpload = noop,
      fromCache: getFromCacheValue
    } = (requestCtrl = sendRequest(guardNextReplacingMethod, forceRequestFinally));
    fromCache = getFromCacheValue;

    // 命中缓存，或强制请求时需要更新loading状态
    // loading状态受控时将不再更改为false
    if ((forceRequestFinally || !cachedResponse) && !controlledLoading) {
      update({ loading: trueValue }, frontStates);
    }

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

    const { enableDownload, enableUpload } = getConfig(methodInstance);
    enableDownload && onDownload(progressUpdater('downloading'));
    enableUpload && onUpload(progressUpdater('uploading'));
    return responseHandlePromise;
  };

  // 调用中间件函数
  let successHandlerDecorator: (
    handler: SuccessHandler<S, E, R, T, RC, RE, RH>,
    event: AlovaSuccessEvent<S, E, R, T, RC, RE, RH>,
    index: number,
    length: number
  ) => void | void;
  let errorHandlerDecorator: (
    handler: ErrorHandler<S, E, R, T, RC, RE, RH>,
    event: AlovaErrorEvent<S, E, R, T, RC, RE, RH>,
    index: number,
    length: number
  ) => void | void;
  let completeHandlerDecorator: (
    handler: CompleteHandler<S, E, R, T, RC, RE, RH>,
    event: AlovaCompleteEvent<S, E, R, T, RC, RE, RH>,
    index: number,
    length: number
  ) => void | void;

  const middlewareCompletePromise = middleware(
    {
      method: methodInstance,
      cachedResponse,
      sendArgs,
      config: useHookConfig,
      frontStates,
      update: newFrontStates => update(newFrontStates, frontStates),
      controlLoading(control = trueValue) {
        controlledLoading = control;
      },
      decorateSuccess(decorator: NonNullable<typeof successHandlerDecorator>) {
        isFn(decorator) && (successHandlerDecorator = decorator);
      },
      decorateError(decorator: NonNullable<typeof errorHandlerDecorator>) {
        isFn(decorator) && (errorHandlerDecorator = decorator);
      },
      decorateComplete(decorator: NonNullable<typeof completeHandlerDecorator>) {
        isFn(decorator) && (completeHandlerDecorator = decorator);
      }
    },
    guardNext
  );
  myAssert(instanceOf(middlewareCompletePromise, PromiseCls), 'middleware must be a async function');
  const isNextCalled = () => len(objectKeys(requestCtrl)) > 0;
  const runArgsHandler = (
    handlers: GeneralFn[],
    decorator: (...args: any[]) => void,
    event: AlovaEvent<S, E, R, T, RC, RE, RH>
  ) => {
    forEach(handlers, (handler, index) =>
      isFn(decorator) ? decorator(handler, event, index, len(handlers)) : handler(event)
    );
  };
  // 统一处理响应
  const responseCompletePromise = promiseCatch(
    promiseThen(middlewareCompletePromise, middlewareReturnedData => {
      const afterSuccess = (data: any) => {
        // 更新缓存响应数据
        if (!updateCacheState) {
          update({ data }, frontStates);
        } else {
          // 更新缓存内的状态，一般为useFetcher中进入
          const cachedState = getStateCache(id, methodKey);
          cachedState && update({ data }, cachedState);
        }

        // loading状态受控时将不再更改为false
        !controlledLoading && update({ loading: falseValue }, frontStates);
        // 在请求后触发对应回调函数
        runArgsHandler(
          successHandlers,
          successHandlerDecorator,
          createAlovaEvent(0, methodInstance, sendArgs, fromCache(), data)
        );
        runArgsHandler(
          completeHandlers,
          completeHandlerDecorator,
          createAlovaEvent(2, methodInstance, sendArgs, fromCache(), data, undefinedValue, 'success')
        );
        return data;
      };

      // 中间件中未返回数据或返回undefined时，去获取真实的响应数据
      // 否则使用返回数据并不再等待响应promise，此时也需要调用响应回调
      if (middlewareReturnedData !== undefinedValue) {
        return afterSuccess(middlewareReturnedData);
      }
      if (!isNextCalled()) {
        return;
      }

      // 当middlewareCompletePromise为resolve时有两种可能
      // 1. 请求正常
      // 2. 请求错误，但错误被中间件函数捕获了，此时也将调用成功回调，即afterSuccess(undefinedValue)
      return promiseThen(responseHandlePromise, afterSuccess, () => afterSuccess(undefinedValue));
    }),

    // catch回调函数
    (error: Error) => {
      const newStates = { error } as Partial<FrontRequestState<any, any, any, any, any>>;
      // loading状态受控时将不再更改为false
      !controlledLoading && (newStates.loading = falseValue);
      update(newStates, frontStates);
      runArgsHandler(
        errorHandlers,
        errorHandlerDecorator,
        createAlovaEvent(1, methodInstance, sendArgs, fromCache(), undefinedValue, error)
      );
      runArgsHandler(
        completeHandlers,
        completeHandlerDecorator,
        createAlovaEvent(2, methodInstance, sendArgs, fromCache(), undefinedValue, error, 'error')
      );
      return promiseReject(error);
    }
  );

  return {
    ...requestCtrl,
    p: responseCompletePromise,
    r: removeStates,
    s: saveStates
  };
}
