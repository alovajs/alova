import { MethodMatcher } from '../../typings';
import Method from '../Method';
import { filterSnapshotMethodsUnified, getResponseCache, keyFilter, setResponseCache } from '../storage/responseCache';
import { persistResponse } from '../storage/responseStorage';
import { getLocalCacheConfigParam, isFn, key } from '../utils/helper';
import { falseValue, forEach, getContext } from '../utils/variables';

/**
 * 手动设置缓存响应数据，如果对应的methodInstance设置了持久化存储，则还会去检出持久化存储中的缓存
 * @param methodInstance 请求方法对象
 * @param data 缓存数据
 */
export default function setCacheData<R = any, S = any, E = any, T = any, RC = any, RE = any, RH = any>(
  matcher: MethodMatcher<S, E, R, T, RC, RE, RH> | Method<S, E, R, T, RC, RE, RH>[],
  dataOrUpater: R | ((oldCache?: R) => R | false)
) {
  const methods = filterSnapshotMethodsUnified(matcher, keyFilter);
  forEach(methods, methodInstance => {
    const { id, storage } = getContext(methodInstance);
    const { e: expireMilliseconds, s: toStorage, t: tag } = getLocalCacheConfigParam(methodInstance);
    const methodKey = key(methodInstance);
    let data: any = dataOrUpater;
    if (isFn(dataOrUpater)) {
      data = dataOrUpater(getResponseCache(id, methodKey));
      if (data === falseValue) {
        return;
      }
    }
    setResponseCache(id, methodKey, data, methodInstance, expireMilliseconds);
    toStorage && persistResponse(id, methodKey, data, expireMilliseconds, storage, tag);
  });
}
