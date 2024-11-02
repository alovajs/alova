import { falseValue, getConfig, instanceOf, regexpTest, trueValue, undefinedValue } from '@alova/shared';
import { SilentQueueMap } from '~/typings/clienthook';
import { SilentMethod } from '../SilentMethod';
import { DEFAULT_QUEUE_NAME, silentFactoryStatus } from '../globalVariables';
import { silentQueueMap } from '../silentQueue';
import loadSilentQueueMapFromStorage from '../storage/loadSilentQueueMapFromStorage';

/**
 * Filter all silentMethod instances that meet the criteria by method name or regular expression
 * @param methodNameMatcher method name matcher
 * @param queueName Find the queue name, the default is default queue
 * @param filterActive Whether to filter out active instances
 * @returns array of silentMethod instances
 */
export const filterSilentMethods = async (
  methodNameMatcher?: string | number | RegExp,
  queueName = DEFAULT_QUEUE_NAME,
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

    // If the silent factory is not currently started, you also need to match the silent methods in the persistent storage.
    ...(silentFactoryStatus === 0 ? matchSilentMethods((await loadSilentQueueMapFromStorage())[queueName]) : [])
  ];
};

/**
 * Find the first silentMethod instance that meets the condition by method name or regular expression
 * @param methodNameMatcher method name matcher
 * @param queueName Find the queue name, the default is default queue
 * @param filterActive Whether to filter out active instances
 * @returns silentMethod instance, undefined when not found
 */
export const getSilentMethod = async (
  methodNameMatcher?: string | number | RegExp,
  queueName = DEFAULT_QUEUE_NAME,
  filterActive = falseValue
): Promise<SilentMethod<any> | undefined> => (await filterSilentMethods(methodNameMatcher, queueName, filterActive))[0];
