import Method from '../methods/Method';
import Alova from '../Alova';
import { noop } from '../utils/helper';
import createRequestState, { CompleteHandler, ErrorHandler, SuccessHandler } from '../functions/createRequestState';
import useHookToSendRequest from '../functions/useHookToSendRequest';
import { RequestState } from '../../typings';

/**
* 获取请求数据并缓存
* @param method 请求方法对象
*/
export default function useFetcher<S, E>(alova: Alova<S, E>) {
  let originalState: RequestState;
  let successHandlers: SuccessHandler[];
  let errorHandlers: ErrorHandler[];
  let completeHandlers: CompleteHandler[];
  let setCtrl: Function = noop;
  const states = createRequestState(alova, (
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
  });
  return {
    fetching: states.loading,
    error: states.error,
    progress: states.progress,
    onSuccess: states.onSuccess,
    onError: states.onError,
    onComplete: states.onComplete,
    
    // 通过执行该方法来拉取数据
    // fetch一定会发送请求。且如果当前请求的数据有管理对应的状态，则会更新这个状态
    fetch<R, T>(methodInstance: Method<S, E, R, T>) {
      const ctrl = useHookToSendRequest(
        methodInstance,
        originalState,
        successHandlers,
        errorHandlers,
        completeHandlers,
        true,
        true
      );
      setCtrl(ctrl);    // 将控制器传出去供使用者调用
    },
  };
}