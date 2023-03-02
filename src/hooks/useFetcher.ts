import { FetcherHookConfig, FetcherType, MethodMatcher } from '../../typings';
import { alovas } from '../Alova';
import createRequestState from '../functions/createRequestState';
import { filterSnapshotMethods } from '../storage/methodSnapShots';
import { noop } from '../utils/helper';
import myAssert, { assertAlovaCreation } from '../utils/myAssert';
import { falseValue, trueValue } from '../utils/variables';

/**
 * 获取请求数据并缓存
 * @param method 请求方法对象
 */
export default function useFetcher<SE extends FetcherType<any>>(config: FetcherHookConfig = {}) {
  assertAlovaCreation();
  const props = createRequestState<SE['state'], SE['export'], any, any, any, any, any, FetcherHookConfig>(
    alovas[0],
    noop as any,
    config
  );
  return {
    fetching: props.loading,
    error: props.error,
    downloading: props.downloading,
    uploading: props.uploading,
    onSuccess: props.onSuccess,
    onError: props.onError,
    onComplete: props.onComplete,
    abort: props.abort,

    /**
     * 拉取数据
     * fetch一定会发送请求，且如果当前请求的数据有管理对应的状态，则会更新这个状态
     * @param matcher Method对象匹配器
     */
    fetch: <S, E, R, T, RC, RE, RH>(matcher: MethodMatcher<S, E, R, T, RC, RE, RH>, ...args: any[]) => {
      const methodInstance = filterSnapshotMethods(matcher, falseValue);
      myAssert(!!methodInstance, 'method instance is not found');
      props.send(args, methodInstance, trueValue);
    }
  };
}
