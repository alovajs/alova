import Method from '../Method';
import createRequestState from '../functions/createRequestState';
import useHookToSendRequest from '../functions/useHookToSendRequest';
import { isFn, noop } from '../utils/helper';
import { getContext } from '../utils/variables';
import { RequestHookConfig } from '../../typings';

export default function useRequest<S, E, R, T>(methodHandler: Method<S, E, R, T> | ((...args: any[]) => Method<S, E, R, T>), {
  force,
  immediate = true,
  initialData,
}: RequestHookConfig = {}) {
  // isFn封装后不能自动判断类型，需手动转
  const methodInstance = isFn(methodHandler) 
    ? methodHandler() 
    : methodHandler;
  const props = createRequestState(getContext(methodInstance), (
    originalState,
    responser,
    setAbort
  ) => {
    if (immediate) {
      const { abort, p: responseHandlePromise } = useHookToSendRequest(methodInstance, originalState, responser, [], !!force);
      // 将控制器传出去供使用者调用
      setAbort(abort);
      responseHandlePromise.catch(noop);  // 此参数是在send中使用的，在这边需要捕获异常，避免异常继续往外跑
    }
  }, methodInstance, initialData);
  
  return {
    ...props,
    send: (...args: any[]) => {
      const methodInstance = isFn(methodHandler) 
        ? methodHandler(...args) 
        : methodHandler;
      return props.send(methodInstance, !!force, args);
    },
  };
}