import { Ref } from 'vue';
import { RequestAdapter, RequestState } from '../../typings';
import Alova from '../Alova';
import Method from '../methods/Method';
import { setStateCache } from '../storage/responseCache';
import { getPersistentResponse } from '../storage/responseStorage';
import { debounce, undefinedValue } from '../utils/helper';
import useHookToSendRequest from './useHookToSendRequest';

export type SuccessHandler = () => void;
export type ErrorHandler = (error: Error) => void;
export type CompleteHandler = () => void;
export type ConnectController = ReturnType<RequestAdapter<unknown, unknown>>;
export type ExportedType<E, S> = S extends Ref ? Ref<E> : E;    // 以支持React和Vue的方式定义类型
/**
 * 创建请求状态，统一处理useRequest、useWatcher、useEffectWatcher中一致的逻辑
 * 该函数会调用statesHook的创建函数来创建对应的请求状态
 * 当该值为空时，表示useFetcher进入的，此时不需要data状态和缓存状态
 * @param method 请求方法对象
 * @param handleRequest 请求处理的回调函数
 * @param methodKey 请求方法的key
 * @param watchedStates 被监听的状态，如果未传入，直接调用handleRequest
 * @param immediate 是否立即发起请求
 * @param debounceDelay 请求发起的延迟时间
 * @returns 当前的请求状态
 */

type HandleRequest = (
  originalState: RequestState,
  successHandlers: SuccessHandler[],
  errorHandlers: ErrorHandler[],
  completeHandlers: CompleteHandler[],
  setCtrl: (ctrl: ConnectController) => void,
) => void;
export default function createRequestState<S, E, R>(
  {
    id,
    options,
    storage,
  }: Alova<S, E>,
  handleRequest: HandleRequest,
  methodKey?: string,
  watchedStates?: E[],
  immediate = true,
  debounceDelay = 0
) {
  const {
    create,
    export: stateExport,
    effectRequest,
  } = options.statesHook;

  // 如果有持久化数据则先使用它
  const initialData: R | undefined = methodKey ? getPersistentResponse(id, methodKey, storage) : undefinedValue;
  const originalState = {
    loading: create(false),
    data: create(initialData),
    error: create(undefinedValue as Error | undefined),
    progress: create(0),
  };
  if (methodKey) {
    // 如果有methodKey时，将初始状态存入缓存以便后续更新
    setStateCache(id, options.baseURL, methodKey, originalState);
  }
  const successHandlers = [] as SuccessHandler[];
  const errorHandlers = [] as ErrorHandler[];
  const completeHandlers = [] as CompleteHandler[];
  let ctrl: ConnectController;

  // 调用请求处理回调函数
  let handleRequestCalled = false;
  const wrapEffectRequest = () => {
    handleRequest(
      originalState,
      successHandlers,
      errorHandlers,
      completeHandlers,
      newCtrl => ctrl = newCtrl
    );
    handleRequestCalled = true;
  };

  watchedStates !== undefinedValue ? effectRequest(
    debounceDelay > 0 ? 
      debounce(wrapEffectRequest, debounceDelay, () => !immediate || handleRequestCalled) :
      wrapEffectRequest,
    watchedStates,
    immediate
  ) : effectRequest(wrapEffectRequest);
  
  const exportedState = {
    loading: stateExport(originalState.loading) as unknown as ExportedType<boolean, S>,
    data: stateExport(originalState.data) as unknown as ExportedType<R, S>,
    error: stateExport(originalState.error) as unknown as ExportedType<Error|undefined, S>,
    progress: stateExport(originalState.progress) as unknown as ExportedType<number, S>,
  };
  return {
    ...exportedState,
    onSuccess(handler: SuccessHandler) {
      successHandlers.push(handler);
    },
    onError(handler: ErrorHandler) {
      errorHandlers.push(handler);
    },
    onComplete(handler: CompleteHandler) {
      completeHandlers.push(handler);
    },
    abort() {
      ctrl && ctrl.abort();
    },
    
    // 通过执行该方法来手动发起请求
    send<S, E, R, T>(methodInstance: Method<S, E, R, T>, forceRequest: boolean, updateCacheState?: boolean) {
      ctrl = useHookToSendRequest(
        methodInstance,
        originalState,
        successHandlers,
        errorHandlers,
        completeHandlers,
        forceRequest,
        updateCacheState
      );
    },
  };
}