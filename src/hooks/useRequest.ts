import {
  RequestState,
} from '../../typings';
import Method from '../methods/Method';
import {
  createRequestState,
  useHookRequest
} from '../utils/helper';

export default function useRequest<S extends RequestState, E extends RequestState, R, T>(method: Method<S, E, R, T>) {
  return createRequestState(method, (originalState, successHandlers, errorHandlers, setCtrl) => {
    const ctrl = useHookRequest(method, originalState, successHandlers, errorHandlers);
    setCtrl(ctrl);    // 将控制器传出去供使用者调用
  });
}