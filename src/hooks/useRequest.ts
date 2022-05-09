import {
  StatesHookCreator,
  StatesHookUpdater
} from '../../typings';
import Method from '../methods/Method';
import { noop } from '../utils/helper';

export default function useRequest<C extends StatesHookCreator, U extends StatesHookUpdater>(methodInstance: Method<C, U>) {
  const state = methodInstance.context.options.statesHook.create();
  let successHandler = noop;
  methodInstance.send().then(() => {
    successHandler();
  });
  return {
    state,
    onSuccess(handleSuccess: () => void) {
      successHandler = handleSuccess;
    },
  };
}