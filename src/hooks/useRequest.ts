import Method from '../methods/Method';
import createRequestState from '../functions/createRequestState';
import useHookToSendRequest from '../functions/useHookToSendRequest';

// hook通用配置
export interface UseHookConfig {
  force?: boolean,   // 强制请求
};
export default function useRequest<S, E, R, T>(method: Method<S, E, R, T>, { force }: UseHookConfig = {}) {
  return createRequestState(method, (
    originalState,
    successHandlers,
    errorHandlers,
    completeHandlers,
    setCtrl
  ) => {
    const ctrl = useHookToSendRequest(
      method,
      originalState,
      successHandlers,
      errorHandlers,
      completeHandlers,
      force
    );
    setCtrl(ctrl);    // 将控制器传出去供使用者调用
  });
}