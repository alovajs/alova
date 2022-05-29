import {
  RequestState,
} from '../../typings';
import Method from '../methods/Method';
import createRequestState from '../functions/createRequestState';
import useHookRequest from '../functions/useHookRequest';

// hook通用配置
export interface UseHookConfig {
  force?: boolean,   // 强制请求
};
export default function useRequest<S extends RequestState, E extends RequestState, R, T>(method: Method<S, E, R, T>, { force }: UseHookConfig = {}) {
  return createRequestState(method, (
    originalState,
    successHandlers,
    errorHandlers,
    completeHandlers,
    setCtrl
  ) => {
    const ctrl = useHookRequest(
      method,
      originalState,
      successHandlers,
      errorHandlers,
      completeHandlers,
      force
    );
    setCtrl(ctrl);    // 将控制器传出去供使用者调用
  }, [], true);
}