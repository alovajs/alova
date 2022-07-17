import { Ref } from 'vue';
import Method from '../Method';
import { getStateCache } from '../storage/responseCache';
import { key } from '../utils/helper';
import { getContext } from '../utils/variables';

type Dispatch<A> = (value: A) => void;
type SetStateAction<S> = S | ((prevState: S) => S);
type ReactState<D> = [D, Dispatch<SetStateAction<D>>];
type OriginalType<R, S> = S extends Ref ? Ref<R> : ReactState<R>;
/**
 * 更新对应method的状态
 * @param method 请求方法对象
 * @param handleUpdate 更新回调
 */
export default function updateState<S, E, R, T, RC, RE, RH>(methodInstance: Method<S, E, R, T, RC, RE, RH>, handleUpdate: (data: OriginalType<R, S>) => void) {
  const { id } = getContext(methodInstance);
  const methodKey = key(methodInstance);
  const states = getStateCache(id, methodKey);
  states && handleUpdate(states.data);
}