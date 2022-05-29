import { RequestState } from '../../typings';
import Method from '../methods/Method';
import createRequestState from '../functions/createRequestState';
import useHookRequest from '../functions/useHookRequest';
import { UseHookConfig } from './useRequest';

interface WatcherConfig extends UseHookConfig {
  immediate?: boolean,  // 开启immediate后，useWatcher初始化时会自动发起一次请求
  debounce?: number, // 延迟多少毫秒后再发起请求
}
export default function useWatcher<S extends RequestState, E extends RequestState, R, T>(handler: () => Method<S, E, R, T>, watchingStates: any[] = [], { immediate, debounce, force }: WatcherConfig = {}) {
  return createRequestState(handler(), (
    originalState,
    successHandlers,
    errorHandlers,
    completeHandlers,
    setCtrl
  ) => {
    const ctrl = useHookRequest(
      handler(),
      originalState,
      successHandlers,
      errorHandlers,
      completeHandlers,
      force
    );
    setCtrl(ctrl);    // 将控制器传出去供使用者调用

    // !!immediate可以使immediate为falsy值时传入false
  }, watchingStates, !!immediate, debounce);
}