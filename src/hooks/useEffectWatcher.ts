import { RequestState } from '../../typings';
import Method from '../methods/Method';
import { createRequestState, sendRequest } from '../utils/helper';

export default function useEffectWatcher<S extends RequestState, E extends RequestState, R, T>(handler: () => Method<S, E, R, T>, ...watchingValues: any[]) {
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
    watch(watchingValues, handleWatch);
    // 监听前先执行一次
    handleWatch();
  });
}