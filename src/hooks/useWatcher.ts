import { AlovaMethodHandler, WatcherHookConfig } from '../../typings';
import Alova from '../Alova';
import createRequestState from '../functions/createRequestState';
import useHookToSendRequest from '../functions/useHookToSendRequest';
import { alovas } from '../network';
import { noop } from '../utils/helper';
import myAssert, { assertAlovaCreation } from '../utils/myAssert';
import { len, promiseCatch } from '../utils/variables';

export default function useWatcher<S, E, R, T, RC, RE, RH>(
  handler: AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  watchingStates: E[],
  config: WatcherHookConfig = {}
) {
  myAssert(watchingStates && len(watchingStates) > 0, 'must specify at least one watching state');
  assertAlovaCreation();
  const { immediate, debounce = 0, initialData } = config;
  const props = createRequestState(
    alovas[0] as Alova<S, E, RC, RE, RH>,
    (originalState, successHandlers, errorHandlers, completeHandlers, setFns) => {
      const {
        abort,
        r: removeStates,
        s: saveStates,
        p: responseHandlePromise
      } = useHookToSendRequest(handler(), originalState, config, successHandlers, errorHandlers, completeHandlers);
      // 将控制器传出去供使用者调用
      setFns(abort, removeStates, saveStates);

      // 此参数是在send中使用的，在这边需要捕获异常，避免异常继续往外跑
      promiseCatch(responseHandlePromise, noop);
    },
    handler,
    initialData,
    watchingStates,
    !!immediate, // !!immediate可以使immediate为falsy值时传入false，即不立即发送请求
    debounce
  );
  return {
    ...props,
    send: (...args: any[]) => props.send(config, args)
  };
}
