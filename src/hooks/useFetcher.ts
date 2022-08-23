import Method from '../Method';
import { instanceOf, noop } from '../utils/helper';
import createRequestState from '../functions/createRequestState';
import myAssert from '../utils/myAssert';
import { trueValue } from '../utils/variables';
import { FetcherHookConfig, MethodMatcher } from '../../typings';
import { getMethodSnapshot, keyFind } from '../storage/methodSnapshots';
import Alova from '../Alova';

/**
* 获取请求数据并缓存
* @param method 请求方法对象
*/
export default function useFetcher<S, E, R, RC, RE, RH>(alova: Alova<S, E, RC, RE, RH>, config: FetcherHookConfig<R> = {}) {
  const props = createRequestState<S, E, any, any, RC, RE, RH>(alova, noop, noop as any);
  return {
    fetching: props.loading,
    error: props.error,
    downloading: props.downloading,
    uploading: props.uploading,
    onSuccess: props.onSuccess,
    onError: props.onError,
    onComplete: props.onComplete,
    
    /**
     * 拉取数据
    // fetch一定会发送请求。且如果当前请求的数据有管理对应的状态，则会更新这个状态
     * @param matcher Method对象匹配器
     */
    fetch: <R, T>(matcher: MethodMatcher<S, E, R, T, RC, RE, RH>) => {
      const methodInstance = instanceOf(matcher, Method as typeof Method<S, E, R, T, RC, RE, RH>) ? matcher : getMethodSnapshot(matcher, keyFind);
      myAssert(!!methodInstance, 'method instance is not found');
      props.send(config, [], methodInstance, trueValue);
    },
  };
}