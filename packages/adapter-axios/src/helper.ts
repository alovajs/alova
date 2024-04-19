export const undefinedValue = undefined,
  nullValue = null,
  trueValue = true,
  falseValue = false;

/**
 * 空函数，做兼容处理
 */
export const noop = () => {};

export type GeneralFn = (...args: any[]) => any;
/**
 * 判断参数是否为函数
 * @param fn 任意参数
 * @returns 该参数是否为函数
 */
export const isFn = (arg: any): arg is GeneralFn => typeof arg === 'function';

// 判断是否为某个类的实例
export const instanceOf = <T>(arg: any, cls: new (...args: any[]) => T): arg is T => arg instanceof cls;

/**
 * 判断参数是否为数字
 * @param arg 任意参数
 * @returns 该参数是否为数字
 */
export const isNumber = (arg: any): arg is number => typeof arg === 'number' && !isNaN(arg);

/**
 * 判断参数是否为字符串
 * @param arg 任意参数
 * @returns 该参数是否为字符串
 */
export const isString = (arg: any): arg is string => typeof arg === 'string';

// 判断是否为普通对象
export const isPlainObject = (arg: any): arg is Record<string, any> =>
  Object.prototype.toString.call(arg) === '[object Object]';

/**
 * 获取数据长度
 * @param data 数据
 * @returns 数据长度
 */
export const len = (data: any[] | Uint8Array | string) => data.length;
