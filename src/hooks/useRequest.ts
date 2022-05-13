import {
  RequestState,
} from '../../typings';
import Method from '../methods/Method';
import { createRequestState, sendRequest } from '../utils/helper';

export default function useRequest<S extends RequestState, E extends RequestState, R, T>(method: Method<S, E, R, T>) {
  return createRequestState(method, (originalState, successHandlers, errorHandlers) => {
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
  });
}