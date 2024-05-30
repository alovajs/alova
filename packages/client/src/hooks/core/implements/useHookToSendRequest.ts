import { AlovaCompleteEvent, AlovaErrorEvent, AlovaEventBase, AlovaSuccessEvent } from '@alova/shared/event';
import {
  getContext,
  getHandlerMethod,
  getMethodInternalKey,
  newInstance,
  noop,
  omit,
  sloughConfig
} from '@alova/shared/function';
import { falseValue, promiseResolve, promiseThen, pushItem, trueValue, undefinedValue } from '@alova/shared/vars';
import { AlovaGenerics, FrontRequestState, Method, Progress, queryCache } from 'alova';
import {
  AlovaFetcherMiddleware,
  AlovaFrontMiddleware,
  AlovaGuardNext,
  AlovaMethodHandler,
  EnumHookType,
  FetcherHookConfig,
  FrontRequestHookConfig,
  Hook,
  WatcherHookConfig
} from '~/typings';
import defaultMiddleware from '../defaults/middleware';
import { KEY_COMPLETE, KEY_ERROR, KEY_SUCCESS } from './alovaEvent';
import { assertMethod, coreHookAssert } from './assert';
import { getStateCache, removeStateCache, setStateCache } from './stateCache';

/**
 * 统一处理useRequest/useWatcher/useFetcher等请求钩子函数的请求逻辑
 * @param hookInstance hook实例
 * @param methodHandler 请求方法对象或获取函数
 * @param sendCallingArgs send函数参数
 * @returns 请求状态
 */
export default function useHookToSendRequest<AG extends AlovaGenerics>(
  hookInstance: Hook,
  methodHandler: Method<AG> | AlovaMethodHandler<AG>,
  sendCallingArgs: any[] = []
) {
  const currentHookAssert = coreHookAssert(hookInstance.ht);
  let methodInstance = getHandlerMethod(methodHandler, currentHookAssert, sendCallingArgs);
  const { fs: frontStates, ht: hookType, c: useHookConfig, upd: update, em: eventManager } = hookInstance;
  const isFetcher = hookType === EnumHookType.USE_FETCHER;
  const { force: forceRequest = falseValue, middleware = defaultMiddleware } = useHookConfig as
    | FrontRequestHookConfig<AG>
    | FetcherHookConfig<AG>;
  const alovaInstance = getContext(methodInstance);
  const { id } = alovaInstance;
  // 如果是静默请求，则请求后直接调用onSuccess，不触发onError，然后也不会更新progress
  const methodKey = getMethodInternalKey(methodInstance);
  const { abortLast = trueValue } = useHookConfig as WatcherHookConfig<AG>;
  hookInstance.m = methodInstance;

  return (async () => {
    // 初始化状态数据，在拉取数据时不需要加载，因为拉取数据不需要返回data数据
    let removeStates = noop;
    let saveStates = noop as Hook['sf'][number];
    let isNextCalled = falseValue;
    let responseHandlePromise = promiseResolve<any>(undefinedValue);
    let offDownloadEvent = noop;
    let offUploadEvent = noop;
    const cachedResponse = await queryCache(methodInstance as Method);
    let fromCache = () => !!cachedResponse;
    // 是否为受控的loading状态，当为true时，响应处理中将不再设置loading为false
    let controlledLoading = falseValue;
    if (!isFetcher) {
      // 将初始状态存入缓存以便后续更新
      saveStates = (frontStates: FrontRequestState) => setStateCache(id, methodKey, frontStates, hookInstance);
      saveStates(frontStates);

      // 设置状态移除函数，将会传递给hook内的effectRequest，它将被设置在组件卸载时调用
      removeStates = () => removeStateCache(id, methodKey);
    }

    // 中间件函数next回调函数，允许修改强制请求参数，甚至替换即将发送请求的Method实例
    const guardNext: AlovaGuardNext<AG> = guardNextConfig => {
      isNextCalled = trueValue;
      const { force: guardNextForceRequest = forceRequest, method: guardNextReplacingMethod = methodInstance } =
        guardNextConfig || {};
      const forceRequestFinally = sloughConfig(guardNextForceRequest, [
        newInstance(AlovaEventBase<AG>, methodInstance, sendCallingArgs)
      ]);
      const progressUpdater =
        (stage: 'downloading' | 'uploading') =>
        ({ loaded, total }: Progress) =>
          update({
            [stage]: { loaded, total }
          });

      methodInstance = guardNextReplacingMethod;
      // 每次发送请求都需要保存最新的控制器
      pushItem(hookInstance.sf, saveStates);
      pushItem(hookInstance.rf, removeStates);

      // loading状态受控时将不更改loading
      // 未命中缓存，或强制请求时需要设置loading为true
      !controlledLoading && update({ loading: !!forceRequestFinally || !cachedResponse });

      // 根据downloading、uploading的追踪状态来判断是否触发进度更新
      const { downloading: enableDownload, uploading: enableUpload } = hookInstance.ro.trackedKeys;
      offDownloadEvent = enableDownload ? methodInstance.onDownload(progressUpdater('downloading')) : offDownloadEvent;
      offUploadEvent = enableUpload ? methodInstance.onUpload(progressUpdater('uploading')) : offUploadEvent;
      responseHandlePromise = methodInstance.send(forceRequestFinally);
      fromCache = () => methodInstance.fromCache || falseValue;
      return responseHandlePromise;
    };

    // 调用中间件函数
    type EventHandlerDecorator = Parameters<(typeof eventManager)['setDecorator']>[1];
    const commonContext = {
      method: methodInstance,
      cachedResponse,
      config: useHookConfig,
      abort: () => methodInstance.abort(),
      decorateSuccess(decorator: EventHandlerDecorator) {
        eventManager.setDecorator(KEY_SUCCESS, decorator);
      },
      decorateError(decorator: EventHandlerDecorator) {
        eventManager.setDecorator(KEY_ERROR, decorator);
      },
      decorateComplete(decorator: EventHandlerDecorator) {
        eventManager.setDecorator(KEY_COMPLETE, decorator);
      }
    };
    // 是否需要更新响应数据，以及调用响应回调
    const toUpdateResponse = () =>
      hookType !== EnumHookType.USE_WATCHER || !abortLast || hookInstance.m === methodInstance;
    // 调用中间件函数
    const middlewareCompletePromise = isFetcher
      ? (middleware as AlovaFetcherMiddleware<AG>)(
          {
            ...commonContext,
            fetchArgs: sendCallingArgs,
            fetch: (methodInstance, ...args) => {
              assertMethod(currentHookAssert, methodInstance);
              return useHookToSendRequest(hookInstance, methodInstance as Method<AG>, args);
            },
            fetchStates: omit(frontStates, 'data'),
            update,
            controlFetching(control = trueValue) {
              controlledLoading = control;
            }
          },
          guardNext
        )
      : (middleware as AlovaFrontMiddleware<AG>)(
          {
            ...commonContext,
            sendArgs: sendCallingArgs,
            send: (...args) => useHookToSendRequest(hookInstance, methodHandler, args),
            frontStates,
            update,
            controlLoading(control = trueValue) {
              controlledLoading = control;
            }
          },
          guardNext
        );

    let finallyResponse: any = undefinedValue;
    const baseEvent = AlovaEventBase.spawn(methodInstance, sendCallingArgs);
    try {
      // 统一处理响应
      const middlewareReturnedData = await middlewareCompletePromise;
      const afterSuccess = (data: any) => {
        // 更新缓存响应数据
        if (!isFetcher) {
          toUpdateResponse() && update({ data });
        } else if (hookInstance.c.updateState !== falseValue) {
          // 更新缓存内的状态，一般为useFetcher中进入
          const cachedState = getStateCache(id, methodKey).s;
          cachedState && update({ data }, cachedState);
        }

        // 如果需要更新响应数据，则在请求后触发对应回调函数
        if (toUpdateResponse()) {
          const newStates = { error: undefinedValue } as Partial<FrontRequestState<any, any, any, any, any>>;
          // loading状态受控时将不再更改为false
          !controlledLoading && (newStates.loading = falseValue);
          update(newStates);
          eventManager.emit(KEY_SUCCESS, newInstance(AlovaSuccessEvent<AG>, baseEvent, data, fromCache()));
          eventManager.emit(
            KEY_COMPLETE,
            newInstance(AlovaCompleteEvent<AG>, baseEvent, KEY_SUCCESS, data, fromCache(), undefinedValue)
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
      !isNextCalled && !controlledLoading && update({ loading: falseValue });
    } catch (error: any) {
      if (toUpdateResponse()) {
        // 控制在输出错误消息
        const newStates = { error } as Partial<FrontRequestState<any, any, any, any, any>>;
        // loading状态受控时将不再更改为false
        !controlledLoading && (newStates.loading = falseValue);
        update(newStates);
        eventManager.emit(KEY_ERROR, newInstance(AlovaErrorEvent<AG>, baseEvent, error));
        eventManager.emit(
          KEY_COMPLETE,
          newInstance(AlovaCompleteEvent<AG>, baseEvent, KEY_ERROR, undefinedValue, fromCache(), error)
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
