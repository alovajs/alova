import Method from '../Method';
import createRequestState from '../functions/createRequestState';
import useHookToSendRequest from '../functions/useHookToSendRequest';
import myAssert from '../utils/myAssert';
import { WatcherHookConfig } from '../../typings';
import { noop } from '../utils/helper';

export default function useWatcher<S, E, R, T>(
  handler: (...args: any[]) => Method<S, E, R, T>, 
  watchingStates: E[],
  config: WatcherHookConfig<R> = {}
) {
  myAssert(watchingStates && watchingStates.length > 0, 'must specify at least one watching state');
  
  const {
    immediate,
    debounce = 0,
    force,
    initialData,
  } = config;
  const methodInstance = handler();
  const props = createRequestState(methodInstance.context, (
    originalState,
    hitStorage,
    setAbort
  ) => {
    const { abort, p: responseHandlePromise } = useHookToSendRequest(handler(), originalState, config, [], hitStorage, !!force);
    setAbort(abort);    // 将控制器传出去供使用者调用
    responseHandlePromise.catch(noop);  // 此参数是在send中使用的，在这边需要捕获异常，避免异常继续往外跑

    // !!immediate可以使immediate为falsy值时传入falseValue
  }, methodInstance, initialData, watchingStates, !!immediate, debounce);
  return {
    ...props,
    send: (...args: any[]) => props.send(handler(...args), config, !!force, args),
  }
}