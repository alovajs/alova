import { Ref } from 'vue';
import Method from '../methods/Method';
import { ReactState } from '../predefine/ReactHook';
import { getStateCache } from '../storage/responseCache';
import { getContext, getOptions, key } from '../utils/helper';

// 以支持React和Vue的方式定义类型
type OriginalType<R, S> = S extends Ref ? Ref<R> : ReactState<R>;

/**
 * 更新缓存的数据
 * @param method 请求方法对象
 * @param handleUpdate 更新回调
 */
export default function update<S, E, R, T>(methodInstance: Method<S, E, R, T>, handleUpdate: (data: OriginalType<R, S>) => void) {
  const { id } = getContext(methodInstance);
  const methodKey = key(methodInstance);
  const states = getStateCache(id, getOptions(methodInstance).baseURL, methodKey);
  states && handleUpdate(states.data);
}