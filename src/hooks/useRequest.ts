import Method from '../methods/Method';
import createRequestState from '../functions/createRequestState';
import useHookToSendRequest from '../functions/useHookToSendRequest';
import { getContext, key } from '../utils/helper';
import { RequestHookConfig } from './hookConfig.inter';

export default function useRequest<S, E, R, T>(methodInstance: Method<S, E, R, T>, { force, immediate = true }: RequestHookConfig = {}) {
  const props = createRequestState<S, E, R>(getContext(methodInstance), (
    originalState,
    successHandlers,
    errorHandlers,
    completeHandlers,
    setAbort
  ) => immediate && setAbort(useHookToSendRequest(    // 将控制器传出去供使用者调用
    methodInstance,
    originalState,
    successHandlers,
    errorHandlers,
    completeHandlers,
    force
  ).abort), key(methodInstance));
  return {
    ...props,
    send: () => props.send(methodInstance, !!force),
  };
}