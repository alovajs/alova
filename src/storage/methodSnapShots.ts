import { Method, MethodFilter, MethodFilterHandler, MethodMatcher } from '../../typings';
import { instanceOf, isPlainObject, isString } from '../utils/helper';
import { forEach, getConfig, isArray, objectKeys, pushItem, trueValue, undefinedValue } from '../utils/variables';

/** method实例快照集合，发送过请求的method实例将会被保存 */
const methodSnapshots: Record<string, Record<string, Method>> = {};

/**
 * 保存method实例快照
 * @param namespace 命名空间
 * @param methodInstance method实例
 */
export const saveMethodSnapshot = (namespace: string, key: string, methodInstance: Method) => {
  const namespacedSnapshots = (methodSnapshots[namespace] = methodSnapshots[namespace] || {});
  namespacedSnapshots[key] = methodInstance;
};

/**
 * 获取Method实例快照，它将根据matcher来筛选出对应的Method实例
 * @param matcher 匹配的快照名称，可以是字符串或正则表达式、或带过滤函数的对象
 * @returns 匹配到的Method实例快照数组
 */
export const matchSnapshotMethod = <M extends boolean = true>(matcher: MethodFilter, matchAll: M = trueValue as M) => {
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
  forEach(objectKeys(methodSnapshots), keyedNamespace => {
    if (!namespace || keyedNamespace === namespace) {
      const namespacedSnapshots = methodSnapshots[keyedNamespace];
      forEach(objectKeys(namespacedSnapshots), methodKey => {
        // 为做到和缓存表现统一，如果过期了则不匹配出来，并删除其缓存
        const hitMethodInstance = namespacedSnapshots[methodKey];
        const name = getConfig(hitMethodInstance).name || '';
        // 当nameMatcher为undefined时，表示命中所有method实例
        if (
          nameMatcher === undefinedValue ||
          (instanceOf(nameMatcher, RegExp) ? nameMatcher.test(name) : name === nameMatcher)
        ) {
          // 在外部需要使用原始的key，而不是实时生成key
          // 原因是，method的参数可能传入引用类型值，但引用类型值在外部改变时，实时生成的key也随之改变，因此使用最开始的key更准确
          hitMethodInstance.__key__ = methodKey;
          pushItem(matches, hitMethodInstance);
        }
      });
    }
  });

  return (
    matchHandler ? matches[matchAll ? 'filter' : 'find'](matchHandler) : matchAll ? matches : matches[0]
  ) as M extends true ? Method[] : Method | undefined;
};

/**
 *
 * @param matcher Method实例匹配器
 * @param matchAll 是否匹配全部method实例
 * @returns
 */
export const filterSnapshotMethods = <S, E, R, T, RC, RE, RH, M extends boolean>(
  matcher: MethodMatcher<S, E, R, T, RC, RE, RH> | Method<S, E, R, T, RC, RE, RH>[],
  matchAll: M
): M extends true ? Method<S, E, R, T, RC, RE, RH>[] : Method<S, E, R, T, RC, RE, RH> | undefined => {
  let methods: any;
  if (isArray(matcher)) {
    methods = matcher;
  } else if (matcher && isString((matcher as Method).url)) {
    methods = matchAll ? [matcher] : matcher;
  } else {
    methods = matchSnapshotMethod(matcher as MethodFilter, matchAll);
  }
  return methods;
};
