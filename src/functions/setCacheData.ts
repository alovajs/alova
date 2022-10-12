import { MethodMatcher } from '../../typings';
import Method from '../Method';
import { getMethodSnapshot, keyFilter } from '../storage/methodSnapshots';
import { getResponseCache, setResponseCache } from '../storage/responseCache';
import { persistResponse } from '../storage/responseStorage';
import { getLocalCacheConfigParam, instanceOf, isFn, key } from '../utils/helper';
import { forEach, getContext } from '../utils/variables';


/**
* 手动设置缓存响应数据
* @param methodInstance 请求方法对象
* @param data 缓存数据
*/
export default function setCacheData<R = any, S = any, E = any, T = any, RC = any, RE = any, RH = any>(matcher: MethodMatcher<S, E, R, T, RC, RE, RH>, dataOrFn: R | ((oldCache: R) => R)) {
  const methods: Method<S, E, R, T, RC, RE, RH>[] = instanceOf(matcher, Method as typeof Method<S, E, R, T, RC, RE, RH>) ? [matcher] : getMethodSnapshot(matcher, keyFilter);
  forEach(methods, methodInstance => {
    const {
      e: expireMilliseconds,
      s: toStorage,
      t: tag,
    } = getLocalCacheConfigParam(methodInstance);
    const { id, storage } = getContext(methodInstance);
    const methodKey = key(methodInstance);
    const data = isFn(dataOrFn) ? dataOrFn(getResponseCache(id, methodKey)) : dataOrFn;
    setResponseCache(id, methodKey, data, expireMilliseconds);
    toStorage && persistResponse(id, methodKey, data, expireMilliseconds, storage, tag);
  });
}