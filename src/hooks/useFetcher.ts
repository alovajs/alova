import { FetcherHookConfig, FetcherType, MethodMatcher } from '../../typings';
import createRequestState from '../functions/createRequestState';
import Method from '../Method';
import { alovas } from '../network';
import { getMethodSnapshot, keyFind } from '../storage/responseCache';
import { instanceOf, noop } from '../utils/helper';
import myAssert, { assertAlovaCreation } from '../utils/myAssert';
import { trueValue } from '../utils/variables';

/**
 * 获取请求数据并缓存
 * @param method 请求方法对象
 */
export default function useFetcher<SE extends FetcherType<any>>(config: FetcherHookConfig = {}) {
	assertAlovaCreation();
	const props = createRequestState<SE['state'], SE['export'], any, any, any, any, any>(alovas[0], noop, noop as any);
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
    // fetch一定会发送请求。且如果当前请求的数据有管理对应的状态，则会更新这个状态
     * @param matcher Method对象匹配器
     */
		fetch: <S, E, R, T, RC, RE, RH>(matcher: MethodMatcher<S, E, R, T, RC, RE, RH>) => {
			const methodInstance = instanceOf(matcher, Method as typeof Method<S, E, R, T, RC, RE, RH>)
				? matcher
				: getMethodSnapshot(matcher, keyFind);
			myAssert(!!methodInstance, 'method instance is not found');
			props.send(config, [], methodInstance, trueValue);
		}
	};
}
