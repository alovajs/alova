import { noop } from '@alova/shared/function';
import { falseValue } from '@alova/shared/vars';
import createRequestState from '@/functions/createRequestState';
import { filterSnapshotMethods } from '@/storage/methodSnapShots';
import { exportFetchStates } from '@/utils/helper';
import { assertMethodMatcher } from '@/utils/myAssert';
import { EnumHookType, FetcherHookConfig, FetcherType, MethodMatcher } from '~/typings';

/**
 * 获取请求数据并缓存
 * @param method 请求方法对象
 */
export default function useFetcher<SE extends FetcherType<any>>(config: FetcherHookConfig = {}) {
  const props = createRequestState<SE['state'], SE['export'], any, any, any, any, any, FetcherHookConfig>(
    EnumHookType.USE_FETCHER,
    noop as any,
    config
  );
  return {
    ...exportFetchStates(props),
    onSuccess: props.onSuccess,
    onError: props.onError,
    onComplete: props.onComplete,
    abort: props.abort,
    update: props.update,
    _$c: props._$c,

    /**
     * 拉取数据
     * fetch一定会发送请求，且如果当前请求的数据有管理对应的状态，则会更新这个状态
     * @param matcher Method对象匹配器
     */
    fetch: <S, E, R, T, RC, RE, RH>(matcher: MethodMatcher<S, E, R, T, RC, RE, RH>, ...args: any[]) => {
      const methodInstance = filterSnapshotMethods(matcher, falseValue);
      assertMethodMatcher(methodInstance);
      return props.send(args, methodInstance);
    }
  };
}
