import { Ref } from 'vue';
import { RequestAdapter } from '../../typings';
import Method from '../methods/Method';
import { setStateCache } from '../storage/responseCache';
import { getPersistentResponse } from '../storage/responseStorage';
import { debounce, key } from '../utils/helper';

export type SuccessHandler = () => void;
export type ErrorHandler = (error: Error) => void;
export type CompleteHandler = () => void;
export type ConnectController = ReturnType<RequestAdapter<unknown, unknown>>;
/**
 * 创建请求状态，统一处理useRequest、useWatcher、useEffectWatcher中一致的逻辑
 * 该函数会调用statesHook的创建函数来创建对应的请求状态
 * @param method 请求方法对象
 * @param handleRequest 请求处理的回调函数
 * @param watchedStates 被监听的状态，如果未传入，直接调用handleRequest
 * @param immediate 是否立即发起请求
 * @returns 当前的请求状态
 */

type RequestState<R = unknown> = {
  loading: any,
  data: R,
  error: any,
  progress: any,
};
type HandleRequest<R> = (
  originalState: RequestState<R>,
  successHandlers: SuccessHandler[],
  errorHandlers: ErrorHandler[],
  completeHandlers: CompleteHandler[],
  setCtrl: (ctrl: ConnectController) => void,
) => void;
export default function createRequestState<S, E, R, T>(
  method: Method<S, E, R, T>, 
  handleRequest: HandleRequest<R>,
  watchedStates?: any[],
  immediate = true,
  debounceDelay = 0
) {
  const {
    id,
    options,
    storage,
  } = method.context;
  const {
    create,
    export: stateExport,
    effectRequest,
  } = options.statesHook;

  // 如果有持久化数据则先使用它
  const loading: boolean = false;
  const initialData: R | undefined = getPersistentResponse(id, key(method), storage);
  const error: Error | undefined = undefined;
  const progress: number = 0;
  const originalState = {
    loading: create(loading),
    data: create(initialData),
    error: create(error),
    progress: create(progress),
  };
  setStateCache(options.baseURL, key(method), originalState);   // 将初始状态存入缓存以便后续更新
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
  watchedStates ? effectRequest(
    debounceDelay > 0 ? 
      debounce(wrapEffectRequest, debounceDelay, () => !immediate || handleRequestCalled) :
      wrapEffectRequest,
    watchedStates,
    immediate
  ) : wrapEffectRequest();
  const exportedState = {
    loading: stateExport(originalState.loading),
    data: stateExport(originalState.data),
    error: stateExport(originalState.error),
    progress: stateExport(originalState.progress),
  };
  return {
    ...exportedState,

    // 以支持React和Vue的方式定义类型
    data: exportedState.data as E['data'] extends Ref ? Ref<R> : R,
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
    }
  };
}