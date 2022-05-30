import { RequestState } from '../../typings';
import Method from '../methods/Method';
import createRequestState, { CompleteHandler, ErrorHandler, SuccessHandler } from '../functions/createRequestState';
import { noop } from '../utils/helper';
import useHookToSendRequest from '../functions/useHookToSendRequest';
import { UseHookConfig } from './useRequest';

export default function useController<S, E, R, T>(method: Method<S, E, R, T>, { force }: UseHookConfig = {}) {
  let originalState: RequestState;
  let successHandlers: SuccessHandler[];
  let errorHandlers: ErrorHandler[];
  let completeHandlers: CompleteHandler[];
  let setCtrl: Function = noop;
  return {
    ...createRequestState(method, (
        originalStateRaw,
        successHandlersRaw,
        errorHandlersRaw,
        completeHandlersRaw,
        setCtrlRaw
      ) => {
      originalState = originalStateRaw;
      successHandlers = successHandlersRaw;
      errorHandlers = errorHandlersRaw;
      completeHandlers = completeHandlersRaw;
      setCtrl = setCtrlRaw;
    }),
    
    // 通过执行该方法来手动发起请求
    send() {
      const ctrl = useHookToSendRequest(
        method,
        originalState,
        successHandlers,
        errorHandlers,
        completeHandlers,
        force
      );
      setCtrl(ctrl);    // 将控制器传出去供使用者调用
    },
  };
}