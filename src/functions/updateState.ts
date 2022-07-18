import { MethodMatcher } from '../../typings';
import Method from '../Method';
import { getMethodSnapshot, keyFind } from '../storage/methodSnapshots';
import { setResponseCache } from '../storage/responseCache';
import { persistResponse } from '../storage/responseStorage';
import { getStateCache } from '../storage/stateCache';
import { getLocalCacheConfigParam, instanceOf, key } from '../utils/helper';
import { getContext, getOptions } from '../utils/variables';


/**
 * 更新对应method的状态
 * @param method 请求方法对象
 * @param handleUpdate 更新回调
 */
export default function updateState<S, E, R, T, RC, RE, RH>(
  matcher: MethodMatcher<S, E, R, T, RC, RE, RH>,
  handleUpdate: (data: R) => any
) {
  const methodInstance = instanceOf(matcher, Method as typeof Method<S, E, R, T, RC, RE, RH>) ? matcher : getMethodSnapshot(matcher, keyFind);
  // 只处理符合条件的第一个Method实例，如果没有符合条件的实例，则不处理
  if (methodInstance) {
    const {
      statesHook: { dehydrate, update }
    } = getOptions(methodInstance);
    const methodKey = key(methodInstance);
    const { id, storage } = getContext(methodInstance);
    const originalStates = getStateCache(id, methodKey);

    // 将更新后的数据赋值给data状态
    if (originalStates) {
      const updatedData = handleUpdate(dehydrate(originalStates.data));
      update({
        data: updatedData,
      }, originalStates);

      // 同时需要更新缓存和持久化数据
      const {
        e: expireMilliseconds,
        s: toStorage,
      } = getLocalCacheConfigParam(methodInstance);
      setResponseCache(id, methodKey, updatedData, expireMilliseconds);
      toStorage && persistResponse(id, methodKey, updatedData, expireMilliseconds, storage);
    }
  }
}