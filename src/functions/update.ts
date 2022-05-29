import Method from '../methods/Method';
import { getStateCache } from '../storage/responseCache';
import { key } from '../utils/helper';

/**
 * 更新缓存的数据
 * @param method 请求方法对象
 * @param handleUpdate 更新回调
 */
export default function update<D = any>(method: Method<any, any, any, any>, handleUpdate: (data: D) => void) {
  const { baseURL } = method.context.options;
  const methodKey = key(method);
  const states = getStateCache(baseURL, methodKey);
  states && handleUpdate(states.data);
}