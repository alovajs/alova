import { Ref } from 'vue';
import { RequestAdapter, RequestState } from '../../typings';
import Method from '../methods/Method';
import { setStateCache } from '../storage/responseCache';
import { getPersistentResponse } from '../storage/responseStorage';
import { debounce, key, undefinedValue } from '../utils/helper';

export type SuccessHandler = () => void;
export type ErrorHandler = (error: Error) => void;
export type CompleteHandler = () => void;
export type ConnectController = ReturnType<RequestAdapter<unknown, unknown>>;
export type ExportedType<E> = E extends Ref ? Ref<E> : E;    // 以支持React和Vue的方式定义类型
/**
 * 创建请求状态，统一处理useRequest、useWatcher、useEffectWatcher中一致的逻辑
 * 该函数会调用statesHook的创建函数来创建对应的请求状态
 * @param method 请求方法对象
 * @param handleRequest 请求处理的回调函数
 * @param watchedStates 被监听的状态，如果未传入，直接调用handleRequest
 * @param immediate 是否立即发起请求
 * @returns 当前的请求状态
 */

type HandleRequest = (
  originalState: RequestState,
  successHandlers: SuccessHandler[],
  errorHandlers: ErrorHandler[],
  completeHandlers: CompleteHandler[],
  setCtrl: (ctrl: ConnectController) => void,
) => void;
export default function createRequestState<S, E, R, T>(
  method: Method<S, E, R, T>,
  handleRequest: HandleRequest,
  watchedStates?: E[],
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

  const methodKey = key(method);
  // 如果有持久化数据则先使用它
  const initialData: R | undefined = getPersistentResponse(id, methodKey, storage);
  const originalState = {
    loading: create(false),
    data: create(initialData),
    error: create(undefinedValue as Error | undefined),
    progress: create(0),
  };
  setStateCache(options.baseURL, methodKey, originalState);   // 将初始状态存入缓存以便后续更新
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
  
  return {
    ...{
      loading: stateExport(originalState.loading) as unknown as ExportedType<boolean>,
      data: stateExport(originalState.data) as unknown as ExportedType<R>,
      error: stateExport(originalState.error) as unknown as ExportedType<Error|undefined>,
      progress: stateExport(originalState.progress) as unknown as ExportedType<number>,
    },
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