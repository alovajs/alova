import Method from '../methods/Method';
import createRequestState from '../functions/createRequestState';
import useHookToSendRequest from '../functions/useHookToSendRequest';
import { isFn } from '../utils/helper';
import { getContext } from '../utils/variables';
import { RequestHookConfig } from '../../typings';

export default function useRequest<S, E, R, T>(methodHandler: Method<S, E, R, T> | ((...args: any[]) => Method<S, E, R, T>), {
  force,
  immediate = true,
  initialData,
}: RequestHookConfig = {}) {
  // isFn封装后不能自动判断类型，需手动转
  const methodInstance = isFn(methodHandler) 
    ? (methodHandler as () => Method<S, E, R, T>)() 
    : (methodHandler as Method<S, E, R, T>);
  const props = createRequestState(getContext(methodInstance), (
    originalState,
    responser,
    setAbort
  ) => immediate && setAbort(useHookToSendRequest(    // 将控制器传出去供使用者调用
    methodInstance,
    originalState,
    responser,
    [],   // 只有调用send的时候才会有参数传入
    !!force
  ).abort), methodInstance, initialData);
  
  return {
    ...props,
    send: (...args: any[]) => {
      const methodInstance = isFn(methodHandler) 
        ? (methodHandler as (...args: any[]) => Method<S, E, R, T>)(...args) 
        : (methodHandler as Method<S, E, R, T>);
      return props.send(methodInstance, !!force, args);
    },
  };
}