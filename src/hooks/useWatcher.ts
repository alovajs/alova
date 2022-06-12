import Method from '../methods/Method';
import createRequestState from '../functions/createRequestState';
import useHookToSendRequest from '../functions/useHookToSendRequest';
import myAssert from '../utils/myAssert';
import { key } from '../utils/helper';
import { WatcherHookConfig } from '../../typings';

export default function useWatcher<S, E, R, T>(
  handler: () => Method<S, E, R, T>, 
  watchingStates: E[],
  { immediate, debounce = 0, force }: WatcherHookConfig = {}
) {
  myAssert(watchingStates && watchingStates.length > 0, 'must specify at least one watching state');
  const methodInstance = handler();
  const props = createRequestState<S, E, R>(methodInstance.context, (
    originalState,
    responser,
    setAbort
  ) => {
    const { abort } = useHookToSendRequest(
      handler(),
      originalState,
      responser,
      force
    );
    setAbort(abort);    // 将控制器传出去供使用者调用

    // !!immediate可以使immediate为falsy值时传入false
  }, key(methodInstance), watchingStates, !!immediate, debounce);
  return {
    ...props,
    send: () => props.send(methodInstance, !!force),
  }
}