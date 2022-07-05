import Method from '../Method';
import { removeResponseCache } from '../storage/responseCache';
import { removePersistentResponse } from '../storage/responseStorage';
import { key } from '../utils/helper';
import { getContext } from '../utils/variables';


/**
* 让对应的返回数据缓存失效
* @param methodInstance 请求方法对象
*/
export default function invalidateCache<S, E, R, T>(methodInstance: Method<S, E, R, T>) {
  const { id, storage } = getContext(methodInstance);
  const methodKey = key(methodInstance);
  removeResponseCache(id, methodKey);
  removePersistentResponse(id, methodKey, storage);
}