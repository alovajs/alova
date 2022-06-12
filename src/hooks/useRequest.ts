import Method from '../methods/Method';
import createRequestState from '../functions/createRequestState';
import useHookToSendRequest from '../functions/useHookToSendRequest';
import { key } from '../utils/helper';
import { getContext } from '../utils/variables';
import { RequestHookConfig } from '../../typings';

export default function useRequest<S, E, R, T>(methodInstance: Method<S, E, R, T>, { force, immediate = true }: RequestHookConfig = {}) {
  const props = createRequestState<S, E, R>(getContext(methodInstance), (
    originalState,
    responser,
    setAbort
  ) => immediate && setAbort(useHookToSendRequest(    // 将控制器传出去供使用者调用
    methodInstance,
    originalState,
    responser,
    force
  ).abort), key(methodInstance));
  return {
    ...props,
    send: () => props.send(methodInstance, !!force),
  };
}