import Method from '../methods/Method';
import { getStateCache } from '../storage/responseCache';
import { getContext, getOptions, key } from '../utils/helper';

/**
 * 更新缓存的数据
 * @param method 请求方法对象
 * @param handleUpdate 更新回调
 */
export default function update<D = any>(methodInstance: Method<any, any, any, any>, handleUpdate: (data: D) => void) {
  const { id } = getContext(methodInstance);
  const methodKey = key(methodInstance);
  const states = getStateCache(id, getOptions(methodInstance).baseURL, methodKey);
  states && handleUpdate(states.data);
}