import myAssert from '@/utils/myAssert';
import { getConfig, instanceOf, isFn, isPlainObject, isString, newInstance } from '@alova/shared/function';
import { RegExpCls, filterItem, forEach, objectKeys } from '@alova/shared/vars';
import { Method, MethodDetaiedFilter, MethodFilter, MethodFilterHandler } from '~/typings';

const SetCls = Set;

export default class MethodSnapshotContainer<State, Computed, Watched, Export, RequestConfig, Response, ResponseHeader> {
  /**
   * method实例快照集合，发送过请求的method实例将会被保存
   */
  records: Record<string, Set<Method<State, Computed, Watched, Export, any, any, RequestConfig, Response, ResponseHeader>>> = {};

  capacity: number;

  occupy = 0;

  constructor(capacity: number) {
    myAssert(capacity >= 0, 'expected snapshots limit to be >= 0');
    this.capacity = capacity;
  }

  /**
   * 保存method实例快照
   * @param methodInstance method实例
   */
  save(methodInstance: Method) {
    const { name } = getConfig(methodInstance);
    const { records, occupy, capacity } = this;
    if (name && occupy < capacity) {
      // 以method的name为key，将method实例保存到快照中
      const targetSnapshots = (records[name] = records[name] || newInstance(SetCls));
      targetSnapshots.add(methodInstance);

      // 统计数量
      this.occupy += 1;
    }
  }

  /**
   * 获取Method实例快照，它将根据matcher来筛选出对应的Method实例
   * @param matcher 匹配的快照名称，可以是字符串或正则表达式、或带过滤函数的对象
   * @returns 匹配到的Method实例快照数组
   */
  match<M extends boolean = true>(matcher: MethodFilter, matchAll: M = true as M) {
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

    const { records } = this;
    // 通过解构的nameMatcher和filterHandler，获取对应的Method实例快照
    let matches = newInstance(SetCls<Method>);

    // 如果有提供namespace参数则只在这个namespace中查找，否则在所有缓存数据中查找
    if (nameString) {
      matches = records[nameString] || matches;
    } else if (nameReg) {
      forEach(
        filterItem(objectKeys(records), methodName => nameReg.test(methodName)),
        methodName => {
          records[methodName].forEach(method => matches.add(method));
        }
      );
    }

    const fromMatchesArray = isFn(matchHandler) ? filterItem([...matches], matchHandler) : [...matches];
    return (matchAll ? fromMatchesArray : fromMatchesArray[0]) as M extends true
      ? Method<State, Computed, Watched, Export, any, any, RequestConfig, Response, ResponseHeader>[]
      : Method<State, Computed, Watched, Export, any, any, RequestConfig, Response, ResponseHeader> | undefined;
  }
}
