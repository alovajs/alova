import Method from '../methods/Method';
import { setResponseCache } from '../storage/responseCache';
import { persistResponse } from '../storage/responseStorage';
import { getLocalCacheConfigParam, key } from '../utils/helper';
import { getContext } from '../utils/variables';


/**
* 手动设置缓存响应数据
* @param methodInstance 请求方法对象
* @param data 缓存数据
*/
export default function setCacheData<S, E, R, T>(methodInstance: Method<S, E, R, T>, data: R) {
  const {
    e: expireMilliseconds,
    s: toStorage
  } = getLocalCacheConfigParam(methodInstance);
  const { id, storage } = getContext(methodInstance);
  const methodKey = key(methodInstance);
  setResponseCache(id, methodKey, data, expireMilliseconds);
  toStorage && persistResponse(id, methodKey, data, expireMilliseconds, storage);
}