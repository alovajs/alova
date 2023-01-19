import { MethodMatcher } from '../../typings';
import Method from '../Method';
import {
  clearResponseCache,
  filterSnapshotMethodsUnified,
  keyFilter,
  removeResponseCache
} from '../storage/responseCache';
import { removePersistentResponse } from '../storage/responseStorage';
import { key } from '../utils/helper';
import { forEach, getContext } from '../utils/variables';

/**
 * 让对应的返回数据缓存失效
 * 分为3种清空：
 * 1. 如果matcher为Method实例，则清空该Method实例缓存
 * 2. 如果matcher为字符串或正则，则清空所有符合条件的Method实例缓存
 * 3. 如果未传入matcher，则会清空所有缓存
 * @param matcher Method实例匹配器
 */
export default function invalidateCache<S, E, R, T, RC, RE, RH>(
  matcher?: MethodMatcher<S, E, R, T, RC, RE, RH> | Method<S, E, R, T, RC, RE, RH>[]
) {
  if (!matcher) {
    clearResponseCache();
    return;
  }
  const methods = filterSnapshotMethodsUnified(matcher, keyFilter);
  forEach(methods, methodInstance => {
    const { id, storage } = getContext(methodInstance);
    const methodKey = key(methodInstance);
    removeResponseCache(id, methodKey);
    removePersistentResponse(id, methodInstance, storage);
  });
}
