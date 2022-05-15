import { RequestState } from '../../typings';
import Method from '../methods/Method';
import { createRequestState, sendRequest } from '../utils/helper';

interface WatcherConfig {
  effect?: boolean,  // 开启effect后，useWatcher初始化时会自动发起一次请求
  debounce?: number, // 延迟多少毫秒后再发起请求
  
}
export default function useWatcher<S extends RequestState, E extends RequestState, R, T>(handler: () => Method<S, E, R, T>, watchingStates: any[], config: WatcherConfig = { effect: false }) {
  const method = handler();
  return createRequestState(method, (originalState, successHandlers) => {
    const {
      update,
      watch
    } = method.context.options.statesHook;

    const handleWatch = () => {
      const method = handler();
      update({
        loading: true,
      }, originalState);
      sendRequest(method).then(data => {
        update({
          loading: false,
          data,
        }, originalState);
        successHandlers.forEach(handler => handler());
      });
    };
    watch(watchingStates, handleWatch);

    // 如果effect为true，监听前先执行一次
    if (config.effect) {
      handleWatch();
    }
  });
}