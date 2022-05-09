import {
  RequestState,
} from '../../typings';
import Method from '../methods/Method';
import { noop } from '../utils/helper';

export default function useRequest<S extends RequestState>(methodInstance: Method<S>) {
  const state = methodInstance.context.options.statesHook.create();
  let successHandler = noop;
  methodInstance.send().then(() => {
    successHandler();
  });
  return {
    ...state,
    onSuccess(handleSuccess: () => void) {
      successHandler = handleSuccess;
    },
  };
}