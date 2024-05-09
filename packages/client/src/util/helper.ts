import { noop } from '@alova/shared/function';
import { falseValue, filterItem, forEach } from '@alova/shared/vars';
import { AnyFn, BackoffPolicy, UsePromiseReturnType } from '~/typings/general';

/**
 * 创建uuid简易版
 * @returns uuid
 */
export const uuid = () => {
  const timestamp = new Date().getTime();
  return Math.floor(Math.random() * timestamp).toString(36);
};

const referenceList = [] as { id: string; ref: any }[];
/**
 * 获取唯一的引用类型id，如果是非引用类型则返回自身
 * @param {reference} 引用类型数据
 * @returns uniqueId
 */
export const getUniqueReferenceId = (reference: any) => {
  const refType = typeof reference;
  if (!['object', 'function', 'symbol'].includes(refType)) {
    return reference;
  }

  let existedRef = referenceList.find(({ ref }) => ref === reference);
  if (!existedRef) {
    const uniqueId = uuid();
    existedRef = {
      id: uniqueId,
      ref: reference
    };
    referenceList.push(existedRef);
  }
  return existedRef.id;
};

/**
 * 兼容函数，抛出参数
 * @param error 错误
 */
export const __throw = <T>(error: T) => {
  throw error;
};

export const valueObject = <T>(value: T, writable = falseValue) => ({
  value,
  writable
});

/**
 * 根据避让策略和重试次数计算重试延迟时间
 * @param backoff 避让参数
 * @param retryTimes 重试次数
 * @returns 重试延迟时间
 */
export const delayWithBackoff = (backoff: BackoffPolicy, retryTimes: number) => {
  let { startQuiver, endQuiver } = backoff;
  const { delay, multiplier = 1 } = backoff;
  let retryDelayFinally = (delay || 0) * multiplier ** (retryTimes - 1);
  // 如果startQuiver或endQuiver有值，则需要增加指定范围的随机抖动值
  if (startQuiver || endQuiver) {
    startQuiver = startQuiver || 0;
    endQuiver = endQuiver || 1;
    retryDelayFinally += retryDelayFinally * startQuiver + Math.random() * retryDelayFinally * (endQuiver - startQuiver);
    retryDelayFinally = Math.floor(retryDelayFinally); // 取整数延迟
  }
  return retryDelayFinally;
};

export function useCallback<Fn extends AnyFn = AnyFn>(onCallbackChange: (callbacks: Fn[]) => void = noop) {
  let callbacks: Fn[] = [];

  const setCallback = (fn: Fn) => {
    if (!callbacks.includes(fn)) {
      callbacks.push(fn);
      onCallbackChange(callbacks);
    }
    // 返回取消注册函数
    return () => {
      callbacks = filterItem(callbacks, e => e !== fn);
      onCallbackChange(callbacks);
    };
  };

  const triggerCallback = (...args: any[]) => {
    if (callbacks.length > 0) {
      return forEach(callbacks, fn => fn(...args));
    }
  };

  const removeAllCallback = () => {
    callbacks = [];
    onCallbackChange(callbacks);
  };

  return [setCallback, triggerCallback as Fn, removeAllCallback] as const;
}

export function usePromise<T = any>(): UsePromiseReturnType<T> {
  let _resolve: UsePromiseReturnType<T>['resolve'];
  let _reject: UsePromiseReturnType<T>['reject'];

  const promise = new Promise<T>((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { promise, resolve: _resolve!, reject: _reject! };
}
