import { MethodMatcher, updateOptions, UpdateStateCollection } from '../../typings';
import { filterSnapshotMethodsUnified, keyFind, setResponseCache } from '../storage/responseCache';
import { persistResponse } from '../storage/responseStorage';
import { getStateCache } from '../storage/stateCache';
import alovaError from '../utils/alovaError';
import { getLocalCacheConfigParam, isFn, key, noop } from '../utils/helper';
import myAssert from '../utils/myAssert';
import { falseValue, forEach, getContext, getOptions, objectKeys, trueValue, undefinedValue } from '../utils/variables';

/**
 * 更新对应method的状态
 * @param method 请求方法对象
 * @param handleUpdate 更新回调
 * @returns 是否更新成功，未找到对应的状态时不会更新成功
 */
export default function updateState<R = any, S = any, E = any, T = any, RC = any, RE = any, RH = any>(
  matcher: MethodMatcher<S, E, R, T, RC, RE, RH>,
  handleUpdate: ((data: R) => any) | UpdateStateCollection<R>,
  options: updateOptions = {}
) {
  const { onMatch = noop } = options;
  const methodInstance = filterSnapshotMethodsUnified(matcher, keyFind);
  let updated = falseValue;

  // 只处理符合条件的第一个Method实例，如果没有符合条件的实例，则不处理
  if (methodInstance) {
    onMatch(methodInstance); // 触发onMatch事件
    const {
      statesHook: { dehydrate, update }
    } = getOptions(methodInstance);
    const methodKey = key(methodInstance);
    const { id, storage } = getContext(methodInstance);
    const frontStates = getStateCache(id, methodKey);

    if (frontStates) {
      const { e: expireMilliseconds, s: toStorage, t: tag } = getLocalCacheConfigParam(methodInstance);
      const updateStateCollection = isFn(handleUpdate)
        ? ({ data: handleUpdate } as UpdateStateCollection<R>)
        : handleUpdate;
      // 循环遍历更新数据，并赋值给受监管的状态
      forEach(objectKeys(updateStateCollection), stateName => {
        myAssert(frontStates[stateName] !== undefinedValue, `can not find state named \`${stateName}\``);
        myAssert(!objectKeys(frontStates).slice(-4).includes(stateName), 'can not update preset states');
        try {
          const updatedData = updateStateCollection[stateName as keyof typeof updateStateCollection](
            dehydrate(frontStates[stateName])
          );
          update(
            {
              [stateName]: updatedData
            },
            frontStates
          );
          // 同时需要更新缓存和持久化数据
          setResponseCache(id, methodKey, updatedData, methodInstance, expireMilliseconds);
          toStorage && persistResponse(id, methodInstance, updatedData, expireMilliseconds, storage, tag);
        } catch (e) {
          throw alovaError(`managed state \`${stateName}\` must be a state.`);
        }
      });
      updated = trueValue;
    }
  }
  return updated;
}
