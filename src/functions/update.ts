import { Ref } from 'vue';
import Method from '../methods/Method';
import { getStateCache } from '../storage/responseCache';
import { key } from '../utils/helper';
import { getContext, getOptions } from '../utils/variables';

type Dispatch<A> = (value: A) => void;
type SetStateAction<S> = S | ((prevState: S) => S);
type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
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