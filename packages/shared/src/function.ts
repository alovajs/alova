import type { Alova, Method } from '../../alova/typings';
import { ObjectCls, falseValue, nullValue, typeOf } from './vars';

export type GeneralFn = (...args: any[]) => any;

/**
 * 空函数，做兼容处理
 */
export const noop = () => {};
/**
 * 返回参数自身的函数，做兼容处理用
 * 由于部分系统将self作为了保留字，故使用_self来区分
 * @param arg 任意参数
 * @returns 返回参数本身
 */
export const _self = <T>(arg: T) => arg;
/**
 * 判断参数是否为函数
 * @param fn 任意参数
 * @returns 该参数是否为函数
 */
export const isFn = (arg: any): arg is GeneralFn => typeOf(arg) === 'function';
/**
 * 判断参数是否为数字
 * @param arg 任意参数
 * @returns 该参数是否为数字
 */
export const isNumber = (arg: any): arg is number => typeOf(arg) === 'number' && !isNaN(arg);
/**
 * 判断参数是否为字符串
 * @param arg 任意参数
 * @returns 该参数是否为字符串
 */
export const isString = (arg: any): arg is string => typeOf(arg) === 'string';
/**
 * 全局的toString
 * @param arg 任意参数
 * @returns 字符串化的参数
 */
export const globalToString = (arg: any) => ObjectCls.prototype.toString.call(arg);
/**
 * 判断是否为普通对象
 * @param arg 任意参数
 * @returns 判断结果
 */
export const isPlainObject = (arg: any): arg is Record<string, any> => globalToString(arg) === '[object Object]';
/**
 * 判断是否为某个类的实例
 * @param arg 任意参数
 * @returns 判断结果
 */
export const instanceOf = <T>(arg: any, cls: new (...args: any[]) => T): arg is T => arg instanceof cls;
/**
 * 统一的时间戳获取函数
 * @returns 时间戳
 */
export const getTime = (date?: Date) => (date ? date.getTime() : Date.now());
/**
 * 通过method实例获取alova实例
 * @returns alova实例
 */
export const getContext = <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) =>
  methodInstance.context;
/**
 * 获取method实例配置数据
 * @returns 配置对象
 */
export const getConfig = <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) =>
  methodInstance.config;
/**
 * 获取alova配置数据
 * @returns alova配置对象
 */
export const getContextOptions = <S, E, RC, RE, RH>(alovaInstance: Alova<S, E, RC, RE, RH>) => alovaInstance.options;
/**
 * 通过method实例获取alova配置数据
 * @returns alova配置对象
 */
export const getOptions = <S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>) =>
  getContextOptions(getContext(methodInstance));
/**
 * 获取method实例的key值
 * @param methodInstance method实例
 * @returns {string} 此method实例的key值
 */
export const getMethodInternalKey = (methodInstance: Method) => methodInstance.__key__;
/**
 * 是否为特殊数据
 * @param data 提交数据
 * @returns 判断结果
 */
export const isSpecialRequestBody = (data: any) => {
  const dataTypeString = globalToString(data);
  return (
    /^\[object (Blob|FormData|ReadableStream|URLSearchParams)\]$/i.test(dataTypeString) || instanceOf(data, ArrayBuffer)
  );
};
export const objAssign = <T extends Record<string, any>>(target: T, ...sources: Record<string, any>[]): T => {
  return ObjectCls.assign(target, ...sources);
};
/**
 * 创建类实例
 * @param cls 构造函数
 * @param args 构造函数参数
 * @returns 类实例
 */
export const newInstance = <T extends { new (...args: any[]): InstanceType<T> }>(
  cls: T,
  ...args: ConstructorParameters<T>
) => new cls(...args);
/**
 * 统一配置
 * @param 数据
 * @returns 统一的配置
 */
export const sloughConfig = <T>(config: T | ((...args: any[]) => T), args: any[] = []) =>
  isFn(config) ? config(...args) : config;
export const sloughFunction = <T, U>(arg: T | undefined, defaultFn: U) =>
  isFn(arg) ? arg : ![falseValue, nullValue].includes(arg as any) ? defaultFn : noop;
