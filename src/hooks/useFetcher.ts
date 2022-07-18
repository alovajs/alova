import Method from '../Method';
import Alova from '../Alova';
import { noop } from '../utils/helper';
import createRequestState from '../functions/createRequestState';
import myAssert from '../utils/myAssert';
import { getOptions, trueValue } from '../utils/variables';
import { FetcherHookConfig } from '../../typings';

/**
* 获取请求数据并缓存
* @param method 请求方法对象
*/
export default function useFetcher<S, E, R, RC, RE, RH>(alova: Alova<S, E, RC, RE, RH>, config: FetcherHookConfig<R> = {}) {
  const props = createRequestState<S, E, any, any, RC, RE, RH>(alova, noop);
  return {
    fetching: props.loading,
    error: props.error,
    downloading: props.downloading,
    uploading: props.uploading,
    onSuccess: props.onSuccess,
    onError: props.onError,
    onComplete: props.onComplete,
    
    // 通过执行该方法来拉取数据
    // fetch一定会发送请求。且如果当前请求的数据有管理对应的状态，则会更新这个状态
    fetch: <R, T>(methodInstance: Method<S, E, R, T, RC, RE, RH>) => {
      myAssert(alova.options.statesHook === getOptions(methodInstance).statesHook, 'the `statesHook` of the method instance is not the same as the alova instance');
      props.send(methodInstance, config, [], trueValue);
    },
  };
}