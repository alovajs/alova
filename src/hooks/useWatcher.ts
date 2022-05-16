import { RequestState } from '../../typings';
import Method from '../methods/Method';
import {
  createRequestState,
  debounce,
  useHookRequest
} from '../utils/helper';

interface WatcherConfig {
  effect?: boolean,  // 开启effect后，useWatcher初始化时会自动发起一次请求
  debounce?: number, // 延迟多少毫秒后再发起请求
}
export default function useWatcher<S extends RequestState, E extends RequestState, R, T>(handler: () => Method<S, E, R, T>, watchingStates: any[], { effect, debounce: debounceDelay }: WatcherConfig = {}) {
  const method = handler();
  return createRequestState(method, (originalState, successHandlers, errorHandlers, setCtrl) => {
    const {
      watch,
    } = method.context.options.statesHook;
    
    const handleWatch = () => {
      const method = handler();
      const ctrl = useHookRequest(method, originalState, successHandlers, errorHandlers);
      setCtrl(ctrl);    // 将控制器传出去供使用者调用
    };
    // 如果需要节流，则使用节流函数外封装一层
    debounceDelay = debounceDelay || 0;
    watch(watchingStates, debounceDelay > 0 ? debounce(handleWatch, debounceDelay) : handleWatch);

    // 如果effect为true，监听前先执行一次
    if (effect) {
      handleWatch();
    }
  });
}