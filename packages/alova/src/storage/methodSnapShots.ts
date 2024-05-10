import { globalConfigMap } from '@/globalConfig';
import { getConfig, instanceOf, isFn, isPlainObject, isString } from '@alova/shared/function';
import { RegExpCls, filterItem, pushItem } from '@alova/shared/vars';
import { Method, MethodDetaiedFilter, MethodFilter, MethodFilterHandler } from '~/typings';

const buildNamespacedSnapshotKey = (namespace: string, name: string | number) => `${namespace}:${name}`;
const buildNamespaceKey = (namespace: string) => `ns:${namespace}`;

/** method实例快照集合，发送过请求的method实例将会被保存 */
const methodSnapshotRecords: Record<string, (Method | string)[]> = {};
let snapshotCount = 0;

/**
 * 保存method实例快照
 * @param namespace 命名空间
 * @param methodInstance method实例
 */
export const saveMethodSnapshot = (namespace: string, methodInstance: Method) => {
  const { name } = getConfig(methodInstance);
  if (name && snapshotCount < globalConfigMap.methodSnapshots) {
    // 以method的name为key，将method实例保存到快照中
    const namespacedMethodName = buildNamespacedSnapshotKey(namespace, name);
    const targetSnapshots = (methodSnapshotRecords[namespacedMethodName] = methodSnapshotRecords[namespacedMethodName] || []);
    pushItem(targetSnapshots, methodInstance);

    // 保存这个name到当前namespace下，便于使用正则表达式查找
    const namespaceKey = buildNamespaceKey(namespace);
    const targetNamespaces = (methodSnapshotRecords[namespaceKey] = methodSnapshotRecords[namespaceKey] || []);
    pushItem(targetNamespaces, name);

    // 统计数量
    snapshotCount += 1;
  }
};

/**
 * 获取Method实例快照，它将根据matcher来筛选出对应的Method实例
 * @param matcher 匹配的快照名称，可以是字符串或正则表达式、或带过滤函数的对象
 * @returns 匹配到的Method实例快照数组
 */
export const matchSnapshotMethods = (namespace: string, matcher: MethodFilter) => {
  // 将filter参数统一解构为nameMatcher和matchHandler
  let nameString: string | undefined;
  let nameReg: RegExp | undefined;
  let matchHandler: MethodFilterHandler | undefined;
  let nameMatcher: any = matcher;
  if (isPlainObject(matcher)) {
    nameMatcher = (matcher as MethodDetaiedFilter).name;
    matchHandler = (matcher as MethodDetaiedFilter).filter;
  }

  if (instanceOf(nameMatcher, RegExpCls)) {
    nameReg = nameMatcher;
  } else if (isString(nameMatcher)) {
    nameString = nameMatcher;
  }

  // 通过解构的nameMatcher和filterHandler，获取对应的Method实例快照
  let matches = [] as Method[];

  // 如果有提供namespace参数则只在这个namespace中查找，否则在所有缓存数据中查找
  if (nameString) {
    matches = (methodSnapshotRecords[buildNamespacedSnapshotKey(namespace, nameString)] as Method[]) || matches;
  } else if (nameReg) {
    filterItem(methodSnapshotRecords[buildNamespaceKey(namespace)] || [], methodName => nameReg.test(methodName as string)).forEach(
      methodName => {
        matches = [...matches, ...((methodSnapshotRecords[buildNamespacedSnapshotKey(namespace, methodName as string)] || []) as Method[])];
      }
    );
  }
  return isFn(matchHandler) ? filterItem(matches, matchHandler) : matches;
};
