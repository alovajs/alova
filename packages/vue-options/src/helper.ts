import { isFn } from '@alova/shared/function';

/**
 * 将useHook的返回对象按函数和非函数拆分
 * @param useHookReturns useHook的返回对象
 * @returns 拆分后的对象
 */
export const splitStatesAndFn = (useHookReturns: Record<string, any>) => {
  const states = {} as Record<string, any>;
  const fns = {} as Record<string, (...args: any) => any>;
  Object.keys(useHookReturns).forEach(key => {
    const item = useHookReturns[key];
    if (isFn(item)) {
      fns[key] = item;
    } else {
      states[key] = item;
    }
  });
  return [states, fns];
};

export const vv = {};
