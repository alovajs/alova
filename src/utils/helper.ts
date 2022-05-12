import { Ref } from 'vue';
import {
  RequestState
} from '../../typings';
import Method from '../methods/Method';

/**
 * 空函数，做兼容处理
 */
export function noop() {}

type SuccessHandler = () => void;
/**
 * 创建请求状态，统一处理useRequest、useWatcher、useEffectWatcher中一致的逻辑
 * 该函数会调用statesHook的创建函数来创建对应的请求状态
 * @param method 请求方法对象
 * @param handleRequest 请求处理的回调函数
 * @returns 当前的请求状态
 */
export function createRequestState<S extends RequestState, E extends RequestState, R>(
  method: Method<S, E, R>, 
  handleRequest: (originalState: S, successHandlers: SuccessHandler[]) => void
) {
  const {
    create,
    export: stateExport,
  } = method.context.options.statesHook;
  const originalState = create();
  const successHandlers = [] as SuccessHandler[];

  // type fn = NonNullable<typeof method.config.transformResponse>;
  // type aa = ReturnType<fn>;

  // 调用请求处理回调函数
  handleRequest(originalState, successHandlers);
  const exportedState = stateExport(originalState);
  return {
    ...exportedState,
    // 以支持React和Vue的方式写法
    data: exportedState.data as E['data'] extends Ref ? Ref<R> : R,
    onSuccess(handler: () => void) {
      successHandlers.push(handler);
    },
  };
}