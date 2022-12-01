import { MethodMatcher, UpdateStateCollection } from '../../typings';
import Method from '../Method';
import { getMethodSnapshot, keyFind, setResponseCache } from '../storage/responseCache';
import { persistResponse } from '../storage/responseStorage';
import { getStateCache } from '../storage/stateCache';
import alovaError from '../utils/alovaError';
import { getLocalCacheConfigParam, instanceOf, isFn, key } from '../utils/helper';
import myAssert from '../utils/myAssert';
import { forEach, getContext, getOptions, objectKeys, undefinedValue } from '../utils/variables';

/**
 * 更新对应method的状态
 * @param method 请求方法对象
 * @param handleUpdate 更新回调
 */
export default function updateState<R = any, S = any, E = any, T = any, RC = any, RE = any, RH = any>(
  matcher: MethodMatcher<S, E, R, T, RC, RE, RH>,
  handleUpdate: NonNullable<UpdateStateCollection<R>['data']> | UpdateStateCollection<R>
) {
  const methodInstance = instanceOf(matcher, Method as typeof Method<S, E, R, T, RC, RE, RH>)
    ? matcher
    : getMethodSnapshot(matcher, keyFind);
  // 只处理符合条件的第一个Method实例，如果没有符合条件的实例，则不处理
  if (methodInstance) {
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
          toStorage && persistResponse(id, methodKey, updatedData, expireMilliseconds, storage, tag);
        } catch (e) {
          throw alovaError(`managed state \`${stateName}\` must be a state.`);
        }
      });
    }
  }
}
