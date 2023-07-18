import { filterSnapshotMethods } from '@/storage/methodSnapShots';
import { setResponseCache } from '@/storage/responseCache';
import { persistResponse } from '@/storage/responseStorage';
import { getStateCache } from '@/storage/stateCache';
import { getContext, getLocalCacheConfigParam, getOptions, isFn, key, noop } from '@/utils/helper';
import myAssert from '@/utils/myAssert';
import { falseValue, forEach, objectKeys, trueValue, undefinedValue } from '@/utils/variables';
import { MethodMatcher, updateOptions, UpdateStateCollection } from '~/typings';

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
  const { onMatch = noop } = options,
    methodInstance = filterSnapshotMethods(matcher, falseValue);
  let updated = falseValue;

  // 只处理符合条件的第一个Method实例，如果没有符合条件的实例，则不处理
  if (methodInstance) {
    onMatch(methodInstance); // 触发onMatch事件
    const {
        statesHook: { dehydrate, update }
      } = getOptions(methodInstance),
      methodKey = methodInstance.__key__ || key(methodInstance),
      { id, storage } = getContext(methodInstance),
      frontStates = getStateCache(id, methodKey),
      updateStateCollection = isFn(handleUpdate) ? ({ data: handleUpdate } as UpdateStateCollection<R>) : handleUpdate;

    let updatedDataColumnData = undefinedValue as any;
    if (frontStates) {
      // 循环遍历更新数据，并赋值给受监管的状态
      forEach(objectKeys(updateStateCollection), stateName => {
        myAssert(frontStates[stateName] !== undefinedValue, `can not find state named \`${stateName}\``);
        myAssert(!objectKeys(frontStates).slice(-4).includes(stateName), 'can not update preset states');
        const updatedData = updateStateCollection[stateName as keyof typeof updateStateCollection](
          dehydrate(frontStates[stateName])
        );

        // 记录data字段的更新值，用于更新缓存数据
        if (stateName === 'data') {
          updatedDataColumnData = updatedData;
        }
        update(
          {
            [stateName]: updatedData
          },
          frontStates
        );
      });
      updated = trueValue;
    }

    // 如果更新了data，则需要同时更新缓存和持久化数据
    if (updatedDataColumnData !== undefinedValue) {
      const { e: expireMilliseconds, s: toStorage, t: tag } = getLocalCacheConfigParam(methodInstance);
      setResponseCache(id, methodKey, updatedDataColumnData, expireMilliseconds);
      toStorage && persistResponse(id, methodKey, updatedDataColumnData, expireMilliseconds, storage, tag);
    }
  }
  return updated;
}
