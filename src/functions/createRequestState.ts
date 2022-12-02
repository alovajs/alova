import {
  AlovaMethodHandler,
  CompleteHandler,
  ErrorHandler,
  ExportedType,
  FrontRequestHookConfig,
  FrontRequestState,
  Progress,
  SuccessHandler,
  UseHookConfig,
  WatcherHookConfig
} from '../../typings';
import Alova from '../Alova';
import Method from '../Method';
import { debounce, getHandlerMethod, isNumber, noop } from '../utils/helper';
import { falseValue, getStatesHook, promiseCatch, pushItem, trueValue, undefinedValue } from '../utils/variables';
import useHookToSendRequest from './useHookToSendRequest';

export type SaveStateFn = (frontStates: FrontRequestState) => void;
/**
 * 创建请求状态，统一处理useRequest、useWatcher、useEffectWatcher中一致的逻辑
 * 该函数会调用statesHook的创建函数来创建对应的请求状态
 * 当该值为空时，表示useFetcher进入的，此时不需要data状态和缓存状态
 * @param method 请求方法对象
 * @param handleRequest 请求处理的回调函数
 * @param methodKey 请求方法的key
 * @param watchingStates 被监听的状态，如果未传入，直接调用handleRequest
 * @param immediate 是否立即发起请求
 * @param debounceDelay 请求发起的延迟时间
 * @returns 当前的请求状态
 */
export default function createRequestState<S, E, R, T, RC, RE, RH, UC extends UseHookConfig<S, E, R, T, RC, RE, RH>>(
  alovaInstance: Alova<S, E, RC, RE, RH>,
  methodHandler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  useHookConfig: UC,
  initialData?: any,
  immediate = falseValue,
  watchingStates?: E[],
  debounceDelay: WatcherHookConfig<S, E, R, T, RC, RE, RH>['debounce'] = 0
) {
  const { create, export: stateExport, effectRequest } = getStatesHook(alovaInstance);
  const progress: Progress = {
    total: 0,
    loaded: 0
  };

  // 将外部传入的受监管的状态一同放到frontStates集合中
  const { managedStates = {} } = useHookConfig as FrontRequestHookConfig<S, E, R, T, RC, RE, RH>;
  const frontStates = {
    ...managedStates,
    data: create(initialData),
    loading: create(falseValue),
    error: create(undefinedValue as Error | undefined),
    downloading: create({ ...progress }),
    uploading: create({ ...progress })
  };

  const successHandlers = [] as SuccessHandler<R>[];
  const errorHandlers = [] as ErrorHandler[];
  const completeHandlers = [] as CompleteHandler[];
  let abortFn: typeof noop | undefined = undefinedValue;
  let removeStatesFn = noop;
  let saveStatesFn = noop as SaveStateFn;
  const hasWatchingStates = watchingStates !== undefinedValue;

  // 统一处理请求发送
  const handleRequest = (
    methodInstance = getHandlerMethod(methodHandler),
    useHookConfigParam = useHookConfig,
    sendCallingArgs?: any[],
    updateCacheState?: boolean
  ) => {
    const {
      abort,
      p: responseHandlePromise,
      r: removeStates,
      s: saveStates
    } = useHookToSendRequest(
      methodInstance,
      frontStates,
      useHookConfigParam,
      successHandlers,
      errorHandlers,
      completeHandlers,
      sendCallingArgs,
      updateCacheState
    );
    // 每次发送请求都需要保存最新的控制器
    abortFn = abort;
    removeStatesFn = removeStates;
    saveStatesFn = saveStates;
    return responseHandlePromise;
  };

  // 调用请求处理回调函数
  const wrapEffectRequest = () => {
    if (hasWatchingStates || (!hasWatchingStates && immediate)) {
      promiseCatch(handleRequest(), noop); // 此参数是在send中使用的，在这边需要捕获异常，避免异常继续往外跑
    }
  };

  effectRequest({
    handler:
      // watchingStates为数组时表示监听状态（包含空数组），为undefined时表示不监听状态
      hasWatchingStates
        ? debounce(wrapEffectRequest, (changedIndex?: number) =>
            isNumber(changedIndex) ? (isNumber(debounceDelay) ? debounceDelay : debounceDelay[changedIndex]) : 0
          )
        : wrapEffectRequest,
    removeStates: () => removeStatesFn(),
    saveStates: (states: FrontRequestState) => saveStatesFn(states),
    frontStates: frontStates,
    watchingStates,
    immediate: immediate ?? trueValue
  });

  const exportedStates = {
    loading: stateExport(frontStates.loading) as unknown as ExportedType<boolean, S>,
    data: stateExport(frontStates.data) as unknown as ExportedType<R, S>,
    error: stateExport(frontStates.error) as unknown as ExportedType<Error | null, S>,
    downloading: stateExport(frontStates.downloading) as unknown as ExportedType<Progress, S>,
    uploading: stateExport(frontStates.uploading) as unknown as ExportedType<Progress, S>
  };
  return {
    ...exportedStates,
    onSuccess(handler: SuccessHandler<R>) {
      pushItem(successHandlers, handler);
    },
    onError(handler: ErrorHandler) {
      pushItem(errorHandlers, handler);
    },
    onComplete(handler: CompleteHandler) {
      pushItem(completeHandlers, handler);
    },
    abort: () => (abortFn || noop)(),

    /**
     * 通过执行该方法来手动发起请求
     * @param methodInstance 方法对象
     * @param useHookConfig useHook配置参数对象
     * @param sendCallingArgs 调用send函数时传入的参数
     * @param updateCacheState 是否更新缓存状态，此为fetch传入
     * @returns 请求promise
     */
    send(sendCallingArgs?: any[], methodInstance?: Method<S, E, R, T, RC, RE, RH>, updateCacheState?: boolean) {
      return handleRequest(
        methodInstance || getHandlerMethod(methodHandler, sendCallingArgs),
        useHookConfig,
        sendCallingArgs,
        updateCacheState
      );
    }
  };
}
