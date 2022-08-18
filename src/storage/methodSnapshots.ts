import { MethodFilter, MethodFilterHandler } from '../../typings';
import Method from '../Method';
import { instanceOf, isPlainObject, isString } from '../utils/helper';
import { forEach, getConfig, objectKeys, pushItem } from '../utils/variables';

// Method<S, E, R, T, RC, RE, RH>
type AnyMethod = Method<any, any, any, any, any, any, any>;
const methodSnapshots: Record<string, AnyMethod[]> = {};

/** 过滤出所有符合条件的项 */
export const keyFilter = 'filter';

/** 过滤出符合条件的第一项 */
export const keyFind = 'find';

/**
 * 获取Method实例快照，它将根据matcher来筛选出对应的Method实例
 * @param 匹配的快照名称，可以是字符串或正则表达式、或带过滤函数的对象
 * @returns 匹配到的Method实例快照数组
 */
export const getMethodSnapshot = <F extends 'filter' | 'find'>(filter: MethodFilter, filterFn: F) => {
  // 将filter参数统一解构为nameMatcher和filterHandler
  let nameMatcher: string | RegExp = '';
  let filterHandler: MethodFilterHandler | undefined;
  if (isString(filter) || instanceOf(filter, RegExp)) {
    nameMatcher = filter;
  } else if (isPlainObject(filter)) {
    nameMatcher = filter.name;
    filterHandler = filter.filter;
  }

  // 通过解构的nameMatcher和filterHandler，获取对应的Method实例快照
  const matches = [] as AnyMethod[];
  forEach(
    objectKeys(methodSnapshots),
    name => {
      if (instanceOf(nameMatcher, RegExp) ? nameMatcher.test(name) : name === nameMatcher) {
        pushItem(matches, ...methodSnapshots[name]);
      }
    }
  );
  return (filterHandler 
    ? matches[filterFn](filterHandler) 
    : filterFn === keyFind ? matches[0] : matches) as F extends 'filter' ? AnyMethod[] : AnyMethod;
};


/**
 * 添加Method实例快照
 * 没有name属性的Method实例将不会被保存
 * @param method 待添加的Method实例
 */
export const addMethodSnapshot = <S, E, R, T, RC, RE, RH>(method: Method<S, E, R, T, RC, RE, RH>) => {
  const { name } = getConfig(method);
  if (name) {
    const snapshots = methodSnapshots[name] = methodSnapshots[name] || [];
    pushItem(snapshots, method);
  }
}