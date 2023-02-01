import { Method, MethodFilter, MethodFilterHandler, MethodMatcher } from '../../typings';
import MethodCls from '../Method';
import { instanceOf, isPlainObject, isString } from '../utils/helper';
import {
  deleteAttr,
  forEach,
  getConfig,
  getTime,
  isArray,
  objectKeys,
  pushItem,
  trueValue,
  undefinedValue
} from '../utils/variables';

// 响应数据缓存
let responseCache: Record<string, Record<string, [data: any, method: Method, expireTime: number]>> = {};

/**
 * 检查给定时间是否过期，如果没有过期时间则表示数据永不过期，否则需要判断是否过期
 * @param expireTime 过期时间
 * @returns 是否过期
 */
const isExpired = (expireTime: number) => expireTime < getTime();

/**
 * @description 获取Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @returns 缓存的响应数据，如果没有则返回undefined
 */
export const getResponseCache = (namespace: string, key: string) => {
  const cachedResponse = responseCache[namespace];
  if (!cachedResponse) {
    return;
  }
  const cachedItem = cachedResponse[key];
  if (cachedItem) {
    if (!isExpired(cachedItem[2])) {
      return cachedItem[0];
    }
    // 如果过期，则删除缓存
    deleteAttr(cachedResponse, key);
  }
};

/**
 * @description 设置Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 * @param data 缓存数据
 * @param methodInstance method实例
 * @param expireTimestamp 过期时间戳，单位毫秒
 */
export const setResponseCache = (
  namespace: string,
  key: string,
  data: any,
  methodInstance: Method,
  expireTimestamp = 0
) => {
  // 小于0则不缓存了
  if (expireTimestamp > getTime() && data) {
    const cachedResponse = (responseCache[namespace] = responseCache[namespace] || {});
    cachedResponse[key] = [data, methodInstance, expireTimestamp];
  }
};

/**
 * @description 清除Response缓存数据
 * @param baseURL 基础URL
 * @param key 请求key值
 */
export const removeResponseCache = (namespace: string, key: string) => {
  const cachedResponse = responseCache[namespace];
  if (cachedResponse) {
    deleteAttr(cachedResponse, key);
  }
};

/**
 * @description 清空Response缓存数据
 */
export const clearResponseCache = () => {
  responseCache = {};
};

/**
 * 获取Method实例快照，它将根据matcher来筛选出对应的Method实例
 * @param matcher 匹配的快照名称，可以是字符串或正则表达式、或带过滤函数的对象
 * @returns 匹配到的Method实例快照数组
 */
export const matchSnapshotMethod = <M extends boolean>(matcher: MethodFilter, matchAll: M = trueValue as M) => {
  // 将filter参数统一解构为nameMatcher和matchHandler
  let namespace = '';
  let nameMatcher: string | RegExp | undefined = undefinedValue;
  let matchHandler: MethodFilterHandler | undefined;
  if (isString(matcher) || instanceOf(matcher, RegExp)) {
    nameMatcher = matcher;
  } else if (isPlainObject(matcher)) {
    nameMatcher = matcher.name;
    matchHandler = matcher.filter;
    const alova = matcher.alova;
    namespace = alova ? alova.id : namespace;
  }

  // 通过解构的nameMatcher和filterHandler，获取对应的Method实例快照
  const matches = [] as Method[];

  // 如果有提供namespace参数则只在这个namespace中查找，否则在所有缓存数据中查找
  forEach(objectKeys(responseCache), keyedNamespace => {
    if (!namespace || keyedNamespace === namespace) {
      const cachedResponse = responseCache[keyedNamespace];
      forEach(objectKeys(cachedResponse), methodKey => {
        // 为做到和缓存表现统一，如果过期了则不匹配出来，并删除其缓存
        const [_, hitMethodInstance, expireTime] = cachedResponse[methodKey];
        if (isExpired(expireTime)) {
          deleteAttr(cachedResponse, methodKey);
          return;
        }
        const name = getConfig(hitMethodInstance).name || '';
        // 当nameMatcher为undefined时，表示命中所有method实例
        if (
          nameMatcher === undefinedValue ||
          (instanceOf(nameMatcher, RegExp) ? nameMatcher.test(name) : name === nameMatcher)
        ) {
          pushItem(matches, hitMethodInstance);
        }
      });
    }
  });

  return (
    matchHandler ? matches[matchAll ? 'filter' : 'find'](matchHandler) : matchAll ? matches : matches[0]
  ) as M extends true ? Method[] : Method;
};

/**
 *
 * @param matcher
 * @param behavior
 * @returns
 */
export const filterSnapshotMethodsUnified = <S, E, R, T, RC, RE, RH, M extends boolean>(
  matcher: MethodMatcher<S, E, R, T, RC, RE, RH> | Method<S, E, R, T, RC, RE, RH>[],
  matchAll: M
): M extends true ? Method<S, E, R, T, RC, RE, RH>[] : Method<S, E, R, T, RC, RE, RH> | undefined => {
  let methods: any;
  if (isArray(matcher)) {
    methods = matcher;
  } else if (instanceOf(matcher, MethodCls)) {
    methods = matchAll ? [matcher] : matcher;
  } else {
    methods = matchSnapshotMethod(matcher as MethodFilter, matchAll);
  }
  return methods;
};
