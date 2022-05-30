import Method from '../methods/Method';
import createRequestState from '../functions/createRequestState';
import useHookToSendRequest from '../functions/useHookToSendRequest';
import { UseHookConfig } from './useRequest';
import myAssert from '../utils/myAssert';
import { key } from '../utils/helper';

interface WatcherConfig extends UseHookConfig {
  immediate?: boolean,  // 开启immediate后，useWatcher初始化时会自动发起一次请求
  debounce?: number, // 延迟多少毫秒后再发起请求
}
export default function useWatcher<S, E, R, T>(
  handler: () => Method<S, E, R, T>, 
  watchingStates: E[],
  { immediate, debounce, force }: WatcherConfig = {}
) {
  myAssert(watchingStates && watchingStates.length > 0, 'must specify at least one watching state');
  const methodInstance = handler();
  return createRequestState<S, E, R>(methodInstance.context, (
    originalState,
    successHandlers,
    errorHandlers,
    completeHandlers,
    setCtrl
  ) => {
    const ctrl = useHookToSendRequest(
      handler(),
      originalState,
      successHandlers,
      errorHandlers,
      completeHandlers,
      force
    );
    setCtrl(ctrl);    // 将控制器传出去供使用者调用

    // !!immediate可以使immediate为falsy值时传入false
  }, key(methodInstance), watchingStates, !!immediate, debounce);
}