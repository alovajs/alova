import { ExportedType, Progress, RequestAdapter, RequestState } from '../../typings';
import Alova from '../Alova';
import Method from '../methods/Method';
import Responser from '../Responser';
import { removeStateCache, setStateCache } from '../storage/responseCache';
import { getPersistentResponse } from '../storage/responseStorage';
import { debounce, noop } from '../utils/helper';
import { undefinedValue } from '../utils/variables';
import useHookToSendRequest from './useHookToSendRequest';

export type ConnectController = ReturnType<RequestAdapter<unknown, unknown>>;
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

type HandleRequest<R> = (
  originalState: RequestState,
  responser: Responser<R>,
  setAbort: (abort: () => void) => void,
) => void;
export default function createRequestState<S, E, R>(
  {
    id,
    options,
    storage,
  }: Alova<S, E>,
  handleRequest: HandleRequest<R>,
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
  const progress = {
    total: 0,
    loaded: 0,
  };
  const originalState = {
    loading: create(false),
    data: create(initialData),
    error: create(undefinedValue as Error | undefined),
    downloading: create({ ...progress }),
    uploading: create({ ...progress }),
  };
  let removeState = noop;
  if (methodKey) {
    // 如果有methodKey时，将初始状态存入缓存以便后续更新
    setStateCache(id, options.baseURL, methodKey, originalState);

    // 设置状态移除函数，将会传递给hook内的effectRequest，它将被设置在组件卸载时调用
    removeState = () => removeStateCache(id, options.baseURL, methodKey);
  }
  const responser = new Responser<R>();
  let abortFn = noop;

  // 调用请求处理回调函数
  let handleRequestCalled = false;
  const wrapEffectRequest = () => {
    handleRequest(
      originalState,
      responser,
      abort => abortFn = abort,
    );
    handleRequestCalled = true;
  };

  watchedStates !== undefinedValue ? effectRequest(
    debounceDelay > 0 ? 
      debounce(wrapEffectRequest, debounceDelay, () => !immediate || handleRequestCalled) :
      wrapEffectRequest,
    removeState,
    watchedStates,
    immediate
  ) : effectRequest(wrapEffectRequest, removeState);
  
  const exportedState = {
    loading: stateExport(originalState.loading) as unknown as ExportedType<boolean, S>,
    data: stateExport(originalState.data) as unknown as ExportedType<R, S>,
    error: stateExport(originalState.error) as unknown as ExportedType<Error|undefined, S>,
    downloading: stateExport(originalState.downloading) as unknown as ExportedType<Progress, S>,
    uploading: stateExport(originalState.uploading) as unknown as ExportedType<Progress, S>,
  };
  return {
    ...exportedState,
    responser,
    abort: () => abortFn(),
    
    // 通过执行该方法来手动发起请求
    send<T>(methodInstance: Method<S, E, R, T>, forceRequest: boolean, updateCacheState?: boolean) {
      abortFn = useHookToSendRequest(
        methodInstance,
        originalState,
        responser,
        forceRequest,
        updateCacheState
      ).abort;
    },
  };
}