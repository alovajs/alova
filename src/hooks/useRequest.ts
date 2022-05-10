import {
  AlovaOptions,
  RequestState,
} from '../../typings';
import Method from '../methods/Method';
import { noop } from '../utils/helper';

export default function useRequest<S extends RequestState, E extends RequestState, R>(methodInstance: Method<S, E, R>) {
  const {
    create,
    export: stateExport,
    update,
  } = methodInstance.context.options.statesHook;

  const originalState = create();
  const exportedState = stateExport(originalState);
  let successHandler = noop;
  update({
    loading: true,
  }, originalState);
  methodInstance.send().then(data => {
    update({
      loading: false,
      data,
    }, originalState);
    successHandler();
  });
  return {
    ...exportedState,
    onSuccess(handler: () => void) {
      successHandler = handler;
    },
  };
}