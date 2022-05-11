import {
  RequestState,
} from '../../typings';
import Method from '../methods/Method';
import { createRequestState } from '../utils/helper';

export default function useRequest<S extends RequestState, E extends RequestState, R>(method: Method<S, E, R>) {
  return createRequestState(method, (originalState, successHandlers) => {
    const { update } = method.context.options.statesHook;
    update({
      loading: true,
    }, originalState);
    method.send().then(data => {
      update({
        loading: false,
        data,
      }, originalState);
      successHandlers.forEach(handler => handler());
    });
  });
}