import Method from '../methods/Method';
import createRequestState from '../functions/createRequestState';
import useHookToSendRequest from '../functions/useHookToSendRequest';
import { getContext, key } from '../utils/helper';

// hook通用配置
export interface UseHookConfig {
  force?: boolean,   // 强制请求
};
export default function useRequest<S, E, R, T>(methodInstance: Method<S, E, R, T>, { force }: UseHookConfig = {}) {
  return createRequestState<S, E, R>(getContext(methodInstance), (
    originalState,
    successHandlers,
    errorHandlers,
    completeHandlers,
    setCtrl
  ) => {
    const ctrl = useHookToSendRequest(
      methodInstance,
      originalState,
      successHandlers,
      errorHandlers,
      completeHandlers,
      force
    );
    setCtrl(ctrl);    // 将控制器传出去供使用者调用
  }, key(methodInstance));
}