import createRequestState from '../functions/createRequestState';
import useHookToSendRequest from '../functions/useHookToSendRequest';
import { getHandlerMethod, noop } from '../utils/helper';
import { promiseCatch, trueValue } from '../utils/variables';
import { AlovaMethodHandler, RequestHookConfig } from '../../typings';
import { alovas } from '../network';
import Method from '../Method';
import Alova from '../Alova';

export default function useRequest<S, E, R, T, RC, RE, RH>(methodHandler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>, config: RequestHookConfig = {}) {
  const {
    immediate = trueValue,
    initialData,
  } = config;

  const props = createRequestState(
    alovas[0] as Alova<S, E, RC, RE, RH>,
    (originalState, successHandler, errorHandlers, completeHandlers, setFns) => {
      if (immediate) {
        const {
          abort,
          p: responseHandlePromise,
          r: removeStates,
          s: saveStates,
        } = useHookToSendRequest(getHandlerMethod(methodHandler), originalState, config, successHandler, errorHandlers, completeHandlers);
        // 将控制器传出去供使用者调用
        setFns(abort, removeStates, saveStates);
        promiseCatch(responseHandlePromise, noop);  // 此参数是在send中使用的，在这边需要捕获异常，避免异常继续往外跑
      }
    },
    methodHandler,
    initialData
  );
  
  return {
    ...props,
    send: (...args: any[]) => props.send(config, args),
  };
}