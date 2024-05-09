import { boundStatesHook } from '@/alova';
import { getContextOptions, isNumber } from '@alova/shared/function';
import type { GeneralFn } from '@alova/shared/types';
import { clearTimeoutTimer, nullValue, setTimeoutFn } from '@alova/shared/vars';
import { Alova, FrontRequestState } from '~/typings';
import myAssert from './myAssert';

/**
 * 获取alova实例的statesHook
 * @returns statesHook对象
 */
export const getStatesHook = <States, Computed, Watched, Export, RequestConfig, Response, ResponseHeader>(
  alovaInstance: Alova<States, Computed, Watched, Export, RequestConfig, Response, ResponseHeader>
) => getContextOptions(alovaInstance).statesHook;
/**
 * 创建防抖函数，当delay为0时立即触发函数
 * 场景：在调用useWatcher并设置了immediate为true时，首次调用需立即执行，否则会造成延迟调用
 * @param {GeneralFn} fn 回调函数
 * @param {number|(...args: any[]) => number} delay 延迟描述，设置为函数时可实现动态的延迟
 * @returns 延迟后的回调函数
 */
export const debounce = (fn: GeneralFn, delay: number | ((...args: any[]) => number)) => {
  let timer: any = nullValue;
  return function debounceFn(this: any, ...args: any[]) {
    const bindFn = fn.bind(this, ...args);
    const delayMill = isNumber(delay) ? delay : delay(...args);
    timer && clearTimeoutTimer(timer);
    if (delayMill > 0) {
      timer = setTimeoutFn(bindFn, delayMill);
    } else {
      bindFn();
    }
  };
};

/**
 * 导出fetchStates map
 * @param frontStates front states map
 * @returns fetchStates map
 */
export const exportFetchStates = <L = any, R = any, E = any, D = any, U = any>(frontStates: FrontRequestState<L, R, E, D, U>) => ({
  fetching: frontStates.loading,
  error: frontStates.error,
  downloading: frontStates.downloading,
  uploading: frontStates.uploading
});
export const promiseStatesHook = () => {
  myAssert(!!boundStatesHook, `\`statesHook\` is not set in alova instance`);
  return boundStatesHook as NonNullable<typeof boundStatesHook>;
};
