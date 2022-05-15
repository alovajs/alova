import {
  RequestState,
} from '../../typings';
import Method from '../methods/Method';
import {
  createRequestState,
  sendRequest
} from '../utils/helper';

export default function useController<S extends RequestState, E extends RequestState, R, T>(method: Method<S, E, R, T>) {
  let originalState: S;
  let successHandlers: Function[];
  let errorHandlers: Function[];
  return {
    ...createRequestState(method, (originalStateRaw, successHandlersRaw, errorHandlersRaw) => {
      originalState = originalStateRaw;
      successHandlers = successHandlersRaw;
      errorHandlers = errorHandlersRaw;
    }),
    
    // 通过执行该方法来手动发起请求
    send() {
      const { update } = method.context.options.statesHook;
      update({
        loading: true,
      }, originalState);
      sendRequest(method).then(data => {
        update({ data }, originalState);
        successHandlers.forEach(handler => handler());
      }).catch((error: Error) => errorHandlers.forEach(handler => handler(error)))
      .finally(() => update({
        loading: false,
      }, originalState));
    },
  };
}