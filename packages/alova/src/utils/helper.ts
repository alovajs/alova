import { boundStatesHook } from '@/alova';
import { getContextOptions, instanceOf, isFn, isNumber } from '@alova/shared/function';
import type { GeneralFn } from '@alova/shared/types';
import { clearTimeoutTimer, nullValue, setTimeoutFn } from '@alova/shared/vars';
import { Alova, AlovaMethodHandler, FrontRequestState } from '~/typings';
import Method from '../Method';
import myAssert from './myAssert';

/**
 * 获取alova实例的statesHook
 * @returns statesHook对象
 */
export const getStatesHook = <S, E, RC, RE, RH>(alovaInstance: Alova<S, E, RC, RE, RH>) =>
    getContextOptions(alovaInstance).statesHook,
  /**
   * 创建防抖函数，当delay为0时立即触发函数
   * 场景：在调用useWatcher并设置了immediate为true时，首次调用需立即执行，否则会造成延迟调用
   * @param {GeneralFn} fn 回调函数
   * @param {number|(...args: any[]) => number} delay 延迟描述，设置为函数时可实现动态的延迟
   * @returns 延迟后的回调函数
   */
  debounce = (fn: GeneralFn, delay: number | ((...args: any[]) => number)) => {
    let timer: any = nullValue;
    return function (this: any, ...args: any[]) {
      const bindFn = fn.bind(this, ...args),
        delayMill = isNumber(delay) ? delay : delay(...args);
      timer && clearTimeoutTimer(timer);
      if (delayMill > 0) {
        timer = setTimeoutFn(bindFn, delayMill);
      } else {
        bindFn();
      }
    };
  },
  /**
   * 获取请求方法对象
   * @param methodHandler 请求方法句柄
   * @param args 方法调用参数
   * @returns 请求方法对象
   */
  getHandlerMethod = <S, E, R, T, RC, RE, RH>(
    methodHandler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    args: any[] = []
  ) => {
    const methodInstance = isFn(methodHandler) ? methodHandler(...args) : methodHandler;
    myAssert(
      instanceOf(methodInstance, Method),
      'hook handler must be a method instance or a function that returns method instance'
    );
    return methodInstance;
  },
  /**
   * 导出fetchStates map
   * @param frontStates front states map
   * @returns fetchStates map
   */
  exportFetchStates = <L = any, R = any, E = any, D = any, U = any>(frontStates: FrontRequestState<L, R, E, D, U>) => ({
    fetching: frontStates.loading,
    error: frontStates.error,
    downloading: frontStates.downloading,
    uploading: frontStates.uploading
  }),
  promiseStatesHook = (functionName = '') => {
    myAssert(!!boundStatesHook, `can not call ${functionName} until set the \`statesHook\` at alova instance`);
    return boundStatesHook as NonNullable<typeof boundStatesHook>;
  };
