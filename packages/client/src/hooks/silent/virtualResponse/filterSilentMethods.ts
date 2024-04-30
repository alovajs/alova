import { getConfig, instanceOf, regexpTest } from '@/helper';
import { DEFAUT_QUEUE_NAME, falseValue, trueValue, undefinedValue } from '@/helper/variables';
import { SilentQueueMap } from '~/typings/general';
import { silentFactoryStatus } from '../globalVariables';
import { SilentMethod } from '../SilentMethod';
import { silentQueueMap } from '../silentQueue';
import loadSilentQueueMapFromStorage from '../storage/loadSilentQueueMapFromStorage';

/**
 * 按method名称或正则表达式筛选满足条件的所有silentMethod实例
 * @param methodNameMatcher method名称匹配器
 * @param queueName 查找队列名，默认为default队列
 * @param filterActive 是否过滤掉激活状态的实例
 * @returns silentMethod实例数组
 */
export const filterSilentMethods = (
  methodNameMatcher?: string | number | RegExp,
  queueName = DEFAUT_QUEUE_NAME,
  filterActive = falseValue
) => {
  const matchSilentMethods = (targetQueue: SilentQueueMap[string] = []) =>
    targetQueue.filter(silentMethodItem => {
      if (methodNameMatcher === undefinedValue) {
        return trueValue;
      }
      const name = getConfig(silentMethodItem.entity).name || '';
      const retain = instanceOf(methodNameMatcher, RegExp)
        ? regexpTest(methodNameMatcher, name)
        : name === methodNameMatcher;
      return retain && (filterActive ? silentMethodItem.active : trueValue);
    });

  return [
    ...matchSilentMethods(silentQueueMap[queueName]),

    // 如果当前未启动silentFactory，则还需要去持久化存储中匹配silentMethods
    ...(silentFactoryStatus === 0 ? matchSilentMethods(loadSilentQueueMapFromStorage()[queueName]) : [])
  ];
};

/**
 * 按method名称或正则表达式查找第一个满足条件的silentMethod实例
 * @param methodNameMatcher method名称匹配器
 * @param queueName 查找队列名，默认为default队列
 * @param filterActive 是否过滤掉激活状态的实例
 * @returns silentMethod实例，未找到时为undefined
 */
export const getSilentMethod = (
  methodNameMatcher?: string | number | RegExp,
  queueName = DEFAUT_QUEUE_NAME,
  filterActive = falseValue
): SilentMethod | undefined => filterSilentMethods(methodNameMatcher, queueName, filterActive)[0];
