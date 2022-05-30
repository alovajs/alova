import Method from '../methods/Method';
import sendRequest from '../functions/sendRequest';
import { UseHookConfig } from './useRequest';
import Alova from '../Alova';
import { key, undefinedValue } from '../utils/helper';
import { CompleteHandler, ConnectController, ErrorHandler, ExportedType, SuccessHandler } from '../functions/createRequestState';
import { Ref } from 'vue';
import useHookToSendRequest from '../functions/useHookToSendRequest';

/**
* 获取请求数据并缓存
* @param method 请求方法对象
*/
export default function useFetcher<S, E>(alova: Alova<S, E>, { force }: UseHookConfig) {
  const {
    id,
    options,
    storage,
  } = alova;
  const {
    create,
    export: stateExport,
    effectRequest,
  } = options.statesHook;

  const originalState = {
    fetching: create(false),
    error: create(undefinedValue as Error | undefined),
    progress: create(0),
  };
  const successHandlers = [] as SuccessHandler[];
  const errorHandlers = [] as ErrorHandler[];
  const completeHandlers = [] as CompleteHandler[];
  let ctrl: ConnectController;
  const exportedState = {
    fetching: stateExport(originalState.fetching) as unknown as ExportedType<boolean>,
    error: stateExport(originalState.error) as unknown as ExportedType<Error|undefined>,
    progress: stateExport(originalState.progress) as unknown as ExportedType<number>,
  };
  return {
    ...exportedState,
    
    fetch<R, T>(method: Method<S, E, R, T>) {
      const methodKey = key(method);
      // 发出请求
      useHookToSendRequest(method, originalState, successHandlers, errorHandlers, completeHandlers, ctrl);
      const request = sendRequest(method);
    },

    // 以支持React和Vue的方式定义类型
    // data: exportedState.data as E['data'] extends Ref ? Ref<R> : R,
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

  // return createRequestState(method, (
  //   originalState,
  //   successHandlers,
  //   errorHandlers,
  //   completeHandlers,
  //   setCtrl
  // ) => {
  //   const ctrl = useHookToSendRequest(
  //     method,
  //     originalState,
  //     successHandlers,
  //     errorHandlers,
  //     completeHandlers,
  //     force
  //   );
  //   setCtrl(ctrl);    // 将控制器传出去供使用者调用
  // });

  sendRequest(method, true);
}