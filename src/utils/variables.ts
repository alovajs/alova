import Method from '../methods/Method';

// 以下为减少编译代码量而添加的统一处理函数
export const getTime = (date?: Date) => date ? date.getTime() : Date.now();
export const promiseResolve = <T>(value: T) => Promise.resolve(value);
export const promiseReject = <T>(value: T) => Promise.reject(value);
export const undefinedValue = undefined;
export const getContext = <S, E, R, T>(methodInstance: Method<S, E, R, T>) => methodInstance.context;
export const getOptions = <S, E, R, T>(methodInstance: Method<S, E, R, T>) => getContext(methodInstance).options;
export const JSONStringify = <T>(value: T) => JSON.stringify(value);
export const JSONParse = (value: string) => JSON.parse(value);
export const setTimeoutFn = (fn: Function, delay: number) => setTimeout(fn, delay);
export const clearTimeoutTimer = (timer: number) => clearTimeout(timer);