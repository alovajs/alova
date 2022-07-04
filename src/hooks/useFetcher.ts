import Method from '../methods/Method';
import Alova from '../Alova';
import { noop } from '../utils/helper';
import createRequestState from '../functions/createRequestState';
import myAssert from '../utils/myAssert';
import { getOptions } from '../utils/variables';

/**
* 获取请求数据并缓存
* @param method 请求方法对象
*/
export default function useFetcher<S, E>(alova: Alova<S, E>) {
  const props = createRequestState<S, E, any, any>(alova, noop);
  return {
    fetching: props.loading,
    error: props.error,
    downloading: props.downloading,
    uploading: props.uploading,
    responser: props.responser,
    
    // 通过执行该方法来拉取数据
    // fetch一定会发送请求。且如果当前请求的数据有管理对应的状态，则会更新这个状态
    fetch: <R, T>(methodInstance: Method<S, E, R, T>) => {
      myAssert(alova.options.statesHook === getOptions(methodInstance).statesHook, 'the `statesHook` of the method instance is not the same as the alova instance');
      props.send(methodInstance, true, [], true);
    },
  };
}