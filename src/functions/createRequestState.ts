import {
	AlovaMethodHandler,
	CompleteHandler,
	ErrorHandler,
	ExportedType,
	FrontRequestState,
	Progress,
	SuccessHandler,
	UseHookConfig,
	WatcherHookConfig
} from '../../typings';
import Alova from '../Alova';
import Method from '../Method';
import { debounce, getHandlerMethod, isNumber, noop } from '../utils/helper';
import { falseValue, getStatesHook, pushItem, trueValue, undefinedValue } from '../utils/variables';
import useHookToSendRequest from './useHookToSendRequest';

type VoidFn = () => void;
export type SaveStateFn = (frontStates: FrontRequestState) => void;
/**
 * 创建请求状态，统一处理useRequest、useWatcher、useEffectWatcher中一致的逻辑
 * 该函数会调用statesHook的创建函数来创建对应的请求状态
 * 当该值为空时，表示useFetcher进入的，此时不需要data状态和缓存状态
 * @param method 请求方法对象
 * @param handleRequest 请求处理的回调函数
 * @param methodKey 请求方法的key
 * @param watchingStates 被监听的状态，如果未传入，直接调用handleRequest
 * @param immediate 是否立即发起请求
 * @param debounceDelay 请求发起的延迟时间
 * @returns 当前的请求状态
 */
export default function createRequestState<S, E, R, T, RC, RE, RH>(
	alovaInstance: Alova<S, E, RC, RE, RH>,
	handleRequest: (
		originalState: FrontRequestState,
		successHandlers: SuccessHandler<R>[],
		errorHandlers: ErrorHandler[],
		completeHandlers: CompleteHandler[],
		setFns: (abort: VoidFn, removeStates: VoidFn, saveStates: SaveStateFn) => void
	) => void,
	methodHandler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
	initialData?: any,
	watchingStates?: E[],
	immediate = trueValue,
	debounceDelay: WatcherHookConfig['debounce'] = 0
) {
	const { create, export: stateExport, effectRequest } = getStatesHook(alovaInstance);
	const progress: Progress = {
		total: 0,
		loaded: 0
	};
	const originalState = {
		loading: create(falseValue),
		data: create(initialData),
		error: create(undefinedValue as Error | undefined),
		downloading: create({ ...progress }),
		uploading: create({ ...progress })
	};

	const successHandlers = [] as SuccessHandler<R>[];
	const errorHandlers = [] as ErrorHandler[];
	const completeHandlers = [] as CompleteHandler[];
	let abortFn = noop;
	let removeStatesFn = noop;
	let saveStatesFn = noop as SaveStateFn;

	// 调用请求处理回调函数
	const wrapEffectRequest = () => {
		handleRequest(
			originalState,
			successHandlers,
			errorHandlers,
			completeHandlers,
			(abort, removeStates, saveStates) => {
				abortFn = abort;
				removeStatesFn = removeStates;
				saveStatesFn = saveStates;
			}
		);
	};

	effectRequest({
		handler:
			// watchingStates为数组时表示监听状态（包含空数组），为undefined时表示不监听状态
			watchingStates !== undefinedValue
				? debounce(wrapEffectRequest, (changedIndex?: number) =>
						isNumber(changedIndex) ? (isNumber(debounceDelay) ? debounceDelay : debounceDelay[changedIndex]) : 0
				  )
				: wrapEffectRequest,
		removeStates: () => removeStatesFn(),
		saveStates: (states: FrontRequestState) => saveStatesFn(states),
		frontStates: originalState,
		watchingStates,
		immediate: immediate ?? trueValue
	});

	const exportedState = {
		loading: stateExport(originalState.loading) as unknown as ExportedType<boolean, S>,
		data: stateExport(originalState.data) as unknown as ExportedType<R, S>,
		error: stateExport(originalState.error) as unknown as ExportedType<Error | null, S>,
		downloading: stateExport(originalState.downloading) as unknown as ExportedType<Progress, S>,
		uploading: stateExport(originalState.uploading) as unknown as ExportedType<Progress, S>
	};
	return {
		...exportedState,
		onSuccess(handler: SuccessHandler<R>) {
			pushItem(successHandlers, handler);
		},
		onError(handler: ErrorHandler) {
			pushItem(errorHandlers, handler);
		},
		onComplete(handler: CompleteHandler) {
			pushItem(completeHandlers, handler);
		},
		abort: () => abortFn(),

		/**
		 * 通过执行该方法来手动发起请求
		 * @param methodInstance 方法对象
		 * @param useHookConfig useHook配置参数对象
		 * @param sendCallingArgs 调用send函数时传入的参数
		 * @param updateCacheState 是否更新缓存状态，此为fetch传入
		 * @returns 请求promise
		 */
		send(
			useHookConfig: UseHookConfig,
			sendCallingArgs?: any[],
			methodInstance?: Method<S, E, R, T, RC, RE, RH>,
			updateCacheState?: boolean
		) {
			methodInstance = methodInstance || getHandlerMethod(methodHandler, sendCallingArgs);
			const { abort, p, r, s } = useHookToSendRequest(
				methodInstance,
				originalState,
				useHookConfig,
				successHandlers,
				errorHandlers,
				completeHandlers,
				sendCallingArgs,
				updateCacheState
			);
			abortFn = abort;
			removeStatesFn = r;
			saveStatesFn = s;
			return p;
		}
	};
}
