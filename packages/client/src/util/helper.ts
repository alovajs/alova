import { createAssert } from '@alova/shared/assert';
import { instanceOf, isFn, isNumber, noop, uuid } from '@alova/shared/function';
import { GeneralFn } from '@alova/shared/types';
import {
  clearTimeoutTimer,
  falseValue,
  filterItem,
  forEach,
  nullValue,
  setTimeoutFn,
  undefinedValue
} from '@alova/shared/vars';
import { Method } from 'alova';
import { AlovaMethodHandler } from '~/typings';
import { AnyFn } from '~/typings/general';

const referenceList = [] as { id: string; ref: any }[];
/**
 * 获取唯一的引用类型id，如果是非引用类型则返回自身
 * @param 引用类型数据
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
export const throwFn = <T>(error: T) => {
  // eslint-disable-next-line @typescript-eslint/no-throw-literal
  throw error;
};

export const valueObject = <T>(value: T, writable = falseValue) => ({
  value,
  writable
});

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
 * 批量执行事件回调函数，并将args作为参数传入
 * @param handlers 事件回调数组
 * @param args 函数参数
 */
export const runArgsHandler = (handlers: GeneralFn[], ...args: any[]) => {
  let ret: any = undefinedValue;
  forEach(handlers, handler => {
    const retInner = handler(...args);
    ret = retInner !== undefinedValue ? retInner : ret;
  });
  return ret;
};

/**
 * 获取请求方法对象
 * @param methodHandler 请求方法句柄
 * @param args 方法调用参数
 * @returns 请求方法对象
 */
export const getHandlerMethod = (methodHandler: Method | AlovaMethodHandler, args: any[] = []) => {
  const methodInstance = isFn(methodHandler) ? methodHandler(...args) : methodHandler;
  createAssert('scene')(
    instanceOf(methodInstance, Method),
    'hook handler must be a method instance or a function that returns method instance'
  );
  return methodInstance;
};

/**
 * 转换对象的每一项值，并返回新的对象
 * @param obj 对象
 * @param callback 回调函数
 * @returns 转换后的对象
 */
export const mapObject = <T extends Record<string, any>, U>(
  obj: T,
  callback: (value: T[keyof T], key: string, parent: T) => U
) => {
  const ret: Record<string, U> = {};
  for (const key in obj) {
    ret[key] = callback(obj[key], key, obj);
  }
  return ret as Record<keyof T, U>;
};
