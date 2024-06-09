import Method from '@/Method';
import defaultErrorLogger from '@/predefine/defaultErrorLogger';
import defaultMiddleware from '@/predefine/defaultMiddleware';
import { filterSnapshotMethods } from '@/storage/methodSnapShots';
import { getResponseCache } from '@/storage/responseCache';
import { getPersistentResponse } from '@/storage/responseStorage';
import { getStateCache, removeStateCache, setStateCache } from '@/storage/stateCache';
import createAlovaEvent, { AlovaEventType } from '@/utils/createAlovaEvent';
import {
  GeneralFn,
  exportFetchStates,
  getContext,
  getHandlerMethod,
  getLocalCacheConfigParam,
  getMethodInternalKey,
  isFn,
  noop,
  promiseStatesHook,
  sloughConfig,
  sloughFunction
} from '@/utils/helper';
import { assertMethodMatcher } from '@/utils/myAssert';
import {
  MEMORY,
  STORAGE_PLACEHOLDER,
  STORAGE_RESTORE,
  falseValue,
  forEach,
  len,
  promiseResolve,
  promiseThen,
  pushItem,
  trueValue,
  undefinedValue
} from '@/utils/variables';
import {
  AlovaCompleteEvent,
  AlovaErrorEvent,
  AlovaEvent,
  AlovaFetcherMiddleware,
  AlovaFrontMiddleware,
  AlovaGuardNext,
  AlovaMethodHandler,
  AlovaSuccessEvent,
  CompleteHandler,
  EnumHookType,
  ErrorHandler,
  FetcherHookConfig,
  FrontRequestHookConfig,
  FrontRequestState,
  Hook,
  Progress,
  SuccessHandler,
  WatcherHookConfig
} from '~/typings';

/**
 * 统一处理useRequest/useWatcher/useFetcher等请求钩子函数的请求逻辑
 * @param hookInstance hook实例
 * @param methodHandler 请求方法对象或获取函数
 * @param sendCallingArgs send函数参数
 * @returns 请求状态
 */
export default function useHookToSendRequest<S, E, R, T, RC, RE, RH, ARG extends any[]>(
  hookInstance: Hook,
  methodHandler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH, ARG>,
  sendCallingArgs: [...ARG, ...any] = [] as unknown as any
) {
  let methodInstance = getHandlerMethod(methodHandler, sendCallingArgs);
  const {
      fs: frontStates,
      sh: successHandlers,
      eh: errorHandlers,
      ch: completeHandlers,
      ht,
      c: useHookConfig
    } = hookInstance,
    isFetcher = ht === EnumHookType.USE_FETCHER,
    { force: forceRequest = falseValue, middleware = defaultMiddleware } = useHookConfig as
      | FrontRequestHookConfig<S, E, R, T, RC, RE, RH>
      | FetcherHookConfig,
    alovaInstance = getContext(methodInstance),
    {
      id,
      options: { errorLogger },
      storage
    } = alovaInstance,
    { update } = promiseStatesHook(),
    // 如果是静默请求，则请求后直接调用onSuccess，不触发onError，然后也不会更新progress
    methodKey = getMethodInternalKey(methodInstance),
    { m: cacheMode, t: tag } = getLocalCacheConfigParam(methodInstance),
    { sendable = () => trueValue, abortLast = trueValue } = useHookConfig as WatcherHookConfig<S, E, R, T, RC, RE, RH>;
  hookInstance.m = methodInstance;

  return (async () => {
    let sendableValue = falseValue;
    try {
      sendableValue = !!sendable(createAlovaEvent(AlovaEventType.AlovaEvent, methodInstance, sendCallingArgs));
    } catch (error) {}

    if (!sendableValue) {
      update({ loading: falseValue }, frontStates, hookInstance);
      return;
    }

    // 初始化状态数据，在拉取数据时不需要加载，因为拉取数据不需要返回data数据
    let removeStates = noop,
      saveStates = noop as Hook['sf'][number],
      cachedResponse: R | undefined = getResponseCache(id, methodKey),
      isNextCalled = falseValue,
      responseHandlePromise = promiseResolve<any>(undefinedValue),
      offDownloadEvent = noop,
      offUploadEvent = noop,
      fromCache = () => !!cachedResponse,
      // 是否为受控的loading状态，当为true时，响应处理中将不再设置loading为false
      controlledLoading = falseValue;
    if (!isFetcher) {
      // 当缓存模式为memory时不获取缓存，减少缓存获取
      const persistentResponse =
        cacheMode !== MEMORY ? getPersistentResponse(id, methodKey, storage, tag) : undefinedValue;

      // 如果有持久化数据，则需要判断是否需要恢复它到缓存中
      cachedResponse =
        cacheMode === STORAGE_RESTORE && !cachedResponse && persistentResponse ? persistentResponse : cachedResponse;

      // 当缓存模式为placeholder时，先更新data再去发送请求
      if (cacheMode === STORAGE_PLACEHOLDER && persistentResponse) {
        update(
          {
            data: persistentResponse
          },
          frontStates,
          hookInstance
        );
      }

      // 将初始状态存入缓存以便后续更新
      saveStates = (frontStates: FrontRequestState) => setStateCache(id, methodKey, frontStates, hookInstance);
      saveStates(frontStates);

      // 设置状态移除函数，将会传递给hook内的effectRequest，它将被设置在组件卸载时调用
      removeStates = () => removeStateCache(id, methodKey);
    }

    // 中间件函数next回调函数，允许修改强制请求参数，甚至替换即将发送请求的Method实例
    const guardNext: AlovaGuardNext<S, E, R, T, RC, RE, RH> = guardNextConfig => {
      isNextCalled = trueValue;
      const { force: guardNextForceRequest = forceRequest, method: guardNextReplacingMethod = methodInstance } =
          guardNextConfig || {},
        forceRequestFinally = sloughConfig(guardNextForceRequest, sendCallingArgs),
        progressUpdater =
          (stage: 'downloading' | 'uploading') =>
          ({ loaded, total }: Progress) =>
            update(
              {
                [stage]: {
                  loaded,
                  total
                }
              },
              frontStates,
              hookInstance
            );

      methodInstance = guardNextReplacingMethod;
      // 每次发送请求都需要保存最新的控制器
      pushItem(hookInstance.sf, saveStates);
      pushItem(hookInstance.rf, removeStates);

      // loading状态受控时将不更改loading
      // 未命中缓存，或强制请求时需要设置loading为true
      !controlledLoading && update({ loading: !!forceRequestFinally || !cachedResponse }, frontStates, hookInstance);

      const { ed: enableDownload, eu: enableUpload } = hookInstance;
      offDownloadEvent = enableDownload ? methodInstance.onDownload(progressUpdater('downloading')) : offDownloadEvent;
      offUploadEvent = enableUpload ? methodInstance.onUpload(progressUpdater('uploading')) : offUploadEvent;
      responseHandlePromise = methodInstance.send(forceRequestFinally);
      fromCache = () => methodInstance.fromCache || falseValue;
      return responseHandlePromise;
    };

    // 调用中间件函数
    let successHandlerDecorator:
        | ((
            handler: SuccessHandler<S, E, R, T, RC, RE, RH, ARG>,
            event: AlovaSuccessEvent<S, E, R, T, RC, RE, RH, ARG>,
            index: number,
            length: number
          ) => void)
        | undefined,
      errorHandlerDecorator:
        | ((
            handler: ErrorHandler<S, E, R, T, RC, RE, RH, ARG>,
            event: AlovaErrorEvent<S, E, R, T, RC, RE, RH, ARG>,
            index: number,
            length: number
          ) => void)
        | undefined,
      completeHandlerDecorator:
        | ((
            handler: CompleteHandler<S, E, R, T, RC, RE, RH, ARG>,
            event: AlovaCompleteEvent<S, E, R, T, RC, RE, RH, ARG>,
            index: number,
            length: number
          ) => void)
        | undefined = undefinedValue;

    const commonContext = {
        method: methodInstance,
        cachedResponse,
        config: useHookConfig,
        abort: () => methodInstance.abort(),
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
      runArgsHandler = (
        handlers: GeneralFn[],
        decorator: ((...args: any[]) => void) | undefined,
        event: AlovaEvent<S, E, R, T, RC, RE, RH, ARG>
      ) => {
        forEach(handlers, (handler, index) =>
          isFn(decorator) ? decorator(handler, event, index, len(handlers)) : handler(event)
        );
      },
      // 是否需要更新响应数据，以及调用响应回调
      toUpdateResponse = () => ht !== EnumHookType.USE_WATCHER || !abortLast || hookInstance.m === methodInstance,
      fetchStates = exportFetchStates(frontStates),
      // 调用中间件函数
      middlewareCompletePromise = isFetcher
        ? (middleware as AlovaFetcherMiddleware<S, E, R, T, RC, RE, RH, ARG>)(
            {
              ...commonContext,
              fetchArgs: sendCallingArgs,
              fetch: (matcher, ...args) => {
                const methodInstance = filterSnapshotMethods(matcher, falseValue);
                assertMethodMatcher(methodInstance);
                return useHookToSendRequest(hookInstance, methodInstance as Method, args);
              },
              fetchStates,
              update: newFetchStates => update(newFetchStates, fetchStates, hookInstance),
              controlFetching(control = trueValue) {
                controlledLoading = control;
              }
            },
            guardNext
          )
        : (middleware as AlovaFrontMiddleware<S, E, R, T, RC, RE, RH, ARG>)(
            {
              ...commonContext,
              sendArgs: sendCallingArgs,
              send: (...args: [...ARG, ...any]) => useHookToSendRequest(hookInstance, methodHandler, args),
              frontStates,
              update: newFrontStates => update(newFrontStates, frontStates, hookInstance),
              controlLoading(control = trueValue) {
                controlledLoading = control;
              }
            },
            guardNext
          );

    let finallyResponse: any = undefinedValue;
    try {
      // 统一处理响应
      const middlewareReturnedData = await middlewareCompletePromise;
      const afterSuccess = (data: any) => {
        // 更新缓存响应数据
        if (!isFetcher) {
          toUpdateResponse() && update({ data }, frontStates, hookInstance);
        } else if (hookInstance.c.updateState !== falseValue) {
          // 更新缓存内的状态，一般为useFetcher中进入
          const cachedState = getStateCache(id, methodKey).s;
          cachedState && update({ data }, cachedState, hookInstance);
        }

        // 如果需要更新响应数据，则在请求后触发对应回调函数
        if (toUpdateResponse()) {
          const newStates = { error: undefinedValue } as Partial<FrontRequestState<any, any, any, any, any>>;
          // loading状态受控时将不再更改为false
          !controlledLoading && (newStates.loading = falseValue);
          update(newStates, frontStates, hookInstance);
          runArgsHandler(
            successHandlers,
            successHandlerDecorator,
            createAlovaEvent(AlovaEventType.AlovaSuccessEvent, methodInstance, sendCallingArgs, fromCache(), data)
          );
          runArgsHandler(
            completeHandlers,
            completeHandlerDecorator,
            createAlovaEvent(
              AlovaEventType.AlovaCompleteEvent,
              methodInstance,
              sendCallingArgs,
              fromCache(),
              data,
              undefinedValue,
              'success'
            )
          );
        }
        return data;
      };

      finallyResponse =
        // 中间件中未返回数据或返回undefined时，去获取真实的响应数据
        // 否则使用返回数据并不再等待响应promise，此时也需要调用响应回调
        middlewareReturnedData !== undefinedValue
          ? afterSuccess(middlewareReturnedData)
          : isNextCalled
          ? // 当middlewareCompletePromise为resolve时有两种可能
            // 1. 请求正常
            // 2. 请求错误，但错误被中间件函数捕获了，此时也将调用成功回调，即afterSuccess(undefinedValue)
            await promiseThen(responseHandlePromise, afterSuccess, () => afterSuccess(undefinedValue))
          : // 如果isNextCalled未被调用，则不返回数据
            undefinedValue;

      // 未调用next函数时，更新loading为false
      !isNextCalled && !controlledLoading && update({ loading: falseValue }, frontStates, hookInstance);
    } catch (error: any) {
      if (toUpdateResponse()) {
        // 控制在输出错误消息
        sloughFunction(errorLogger, defaultErrorLogger)(error, methodInstance);
        const newStates = { error } as Partial<FrontRequestState<any, any, any, any, any>>;
        // loading状态受控时将不再更改为false
        !controlledLoading && (newStates.loading = falseValue);
        update(newStates, frontStates, hookInstance);
        runArgsHandler(
          errorHandlers,
          errorHandlerDecorator,
          createAlovaEvent(
            AlovaEventType.AlovaErrorEvent,
            methodInstance,
            sendCallingArgs,
            fromCache(),
            undefinedValue,
            error
          )
        );
        runArgsHandler(
          completeHandlers,
          completeHandlerDecorator,
          createAlovaEvent(
            AlovaEventType.AlovaCompleteEvent,
            methodInstance,
            sendCallingArgs,
            fromCache(),
            undefinedValue,
            error,
            'error'
          )
        );
      }
      throw error;
    }
    // 响应后解绑下载和上传事件
    offDownloadEvent();
    offUploadEvent();
    return finallyResponse;
  })();
}
