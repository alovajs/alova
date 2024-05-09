import Method from '@/Method';
import createHook from '@/createHook';
import { debounce, promiseStatesHook } from '@/utils/helper';
import myAssert from '@/utils/myAssert';
import {
  buildNamespacedCacheKey,
  getContext,
  getHandlerMethod,
  getMethodInternalKey,
  getTime,
  instanceOf,
  isFn,
  isNumber,
  sloughConfig,
  statesHookHelper
} from '@alova/shared/function';
import {
  PromiseCls,
  falseValue,
  forEach,
  isArray,
  isSSR,
  len,
  promiseCatch,
  pushItem,
  trueValue,
  undefinedValue
} from '@alova/shared/vars';
import {
  AlovaMethodHandler,
  CompleteHandler,
  EnumHookType,
  ErrorHandler,
  ExportedType,
  FetcherHookConfig,
  FrontRequestHookConfig,
  FrontRequestState,
  Progress,
  SuccessHandler,
  UseHookConfig,
  WatcherHookConfig
} from '~/typings';
import useHookToSendRequest from './useHookToSendRequest';

const refCurrent = <T>(ref: { current: T }) => ref.current;
const keyData = 'data';
const keyLoading = 'loading';
const keyError = 'error';
const keyDownloading = 'downloading';
const keyUploading = 'uploading';
/**
 * 创建请求状态，统一处理useRequest、useWatcher、useFetcher中一致的逻辑
 * 该函数会调用statesHook的创建函数来创建对应的请求状态
 * 当该值为空时，表示useFetcher进入的，此时不需要data状态和缓存状态
 * @param methodInstance 请求方法对象
 * @param useHookConfig hook请求配置对象
 * @param initialData 初始data数据
 * @param immediate 是否立即发起请求
 * @param watchingStates 被监听的状态，如果未传入，直接调用handleRequest
 * @param debounceDelay 请求发起的延迟时间
 * @returns 当前的请求状态、操作函数及事件绑定函数
 */
export default function createRequestState<
  State,
  Computed,
  Watched,
  Export,
  Responded,
  Transformed,
  RequestConfig,
  Response,
  ResponseHeader,
  Config extends UseHookConfig<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
>(
  hookType: EnumHookType,
  methodHandler:
    | Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
    | AlovaMethodHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
  useHookConfig: Config,
  initialData?: FrontRequestHookConfig<any, any, any, any, any, any, any, any, any>['initialData'],
  immediate = falseValue,
  watchingStates?: Watched[],
  debounceDelay: WatcherHookConfig<any, any, any, any, any, any, any, any, any>['debounce'] = 0
) {
  // shallow clone config object to avoid passing the same useHookConfig object which may cause vue2 state update error
  useHookConfig = { ...useHookConfig };
  const { middleware, __referingObj: referingObject = {} } = useHookConfig;
  let initialLoading = middleware ? falseValue : !!immediate;

  // 当立即发送请求时，需要通过是否强制请求和是否有缓存来确定初始loading值，这样做有以下两个好处：
  // 1. 在react下立即发送请求可以少渲染一次
  // 2. SSR渲染的html中，其初始视图为loading状态的，避免在客户端展现时的loading视图闪动
  // 3. 如果config.middleware中设置了`controlLoading`时，需要默认为false，但这边无法确定middleware中是否有调用`controlLoading`，因此条件只能放宽点，当有`config.middleware`时则初始`loading`为false
  if (immediate && !middleware) {
    // 调用getHandlerMethod时可能会报错，需要try/catch
    try {
      const methodInstance = getHandlerMethod(methodHandler, myAssert);
      const alovaInstance = getContext(methodInstance);
      const l1CacheResult = alovaInstance.l1Cache.get<[any, number]>(
        buildNamespacedCacheKey(alovaInstance.id, getMethodInternalKey(methodInstance))
      );
      let cachedResponse: any = undefinedValue;
      // 只同步检查缓存，因此对异步的l1Cache适配器不生效
      // 建议在客户端不设置异步的l1Cache适配器
      if (l1CacheResult && !instanceOf(l1CacheResult, PromiseCls)) {
        const [data, expireTimestamp] = l1CacheResult;
        // 如果没有过期时间则表示数据永不过期，否则需要判断是否过期
        if (!expireTimestamp || expireTimestamp > getTime()) {
          cachedResponse = data;
        }
      }
      const forceRequestFinally = sloughConfig(
        (useHookConfig as FrontRequestHookConfig<any, any, any, any, any, any, any, any, any> | FetcherHookConfig).force ?? falseValue
      );
      initialLoading = !!forceRequestFinally || !cachedResponse;
    } catch (error) {}
  }

  const { create, export: exportState, effectRequest, memorize, ref, exportObject } = statesHookHelper(promiseStatesHook(), referingObject);
  const progress: Progress = {
    total: 0,
    loaded: 0
  };
  // 将外部传入的受监管的状态一同放到frontStates集合中
  const { managedStates = {} } = useHookConfig as FrontRequestHookConfig<any, any, any, any, any, any, any, any, any>;
  const [data] = create(isFn(initialData) ? initialData() : initialData, keyData);
  const [loading] = create(initialLoading, keyLoading);
  const [error] = create(undefinedValue as Error | undefined, keyError);
  const [downloading] = create({ ...progress }, keyDownloading);
  const [uploading] = create({ ...progress }, keyUploading);
  const frontStates = {
    ...managedStates,
    [keyData]: data,
    [keyLoading]: loading,
    [keyError]: error,
    [keyDownloading]: downloading,
    [keyUploading]: uploading
  };
  const exportings = exportObject({
    [keyData]: data as unknown as ExportedType<Responded, State>,
    [keyLoading]: loading as unknown as ExportedType<boolean, State>,
    [keyError]: error as unknown as ExportedType<Error | undefined, State>
  });
  const hookInstance = refCurrent(ref(createHook(hookType, useHookConfig, referingObject, exportings.update)));
  const hasWatchingStates = watchingStates !== undefinedValue;
  // 初始化请求事件
  // 统一的发送请求函数
  const handleRequest = (
    handler:
      | Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
      | AlovaMethodHandler<
          State,
          Computed,
          Watched,
          Export,
          Responded,
          Transformed,
          RequestConfig,
          Response,
          ResponseHeader
        > = methodHandler,
    sendCallingArgs?: any[]
  ) => useHookToSendRequest(hookInstance, handler, sendCallingArgs) as Promise<Responded>;
  // 以捕获异常的方式调用handleRequest
  // 捕获异常避免异常继续向外抛出
  const wrapEffectRequest = () => {
    promiseCatch(handleRequest(), error => {
      // the existence of error handlers indicates that the error is catched.
      // in this case, we should not throw error.
      if (len(hookInstance.eh) <= 0) {
        throw error;
      }
    });
  };

  /**
   * ## react ##每次执行函数都需要重置以下项
   * */
  hookInstance.fs = frontStates;
  hookInstance.sh = [];
  hookInstance.eh = [];
  hookInstance.ch = [];
  hookInstance.c = useHookConfig;
  hookInstance.ro = referingObject;
  // 在服务端渲染时不发送请求
  if (!isSSR) {
    effectRequest({
      handler:
        // watchingStates为数组时表示监听状态（包含空数组），为undefined时表示不监听状态
        hasWatchingStates
          ? debounce(wrapEffectRequest, (changedIndex?: number) =>
              isNumber(changedIndex) ? (isArray(debounceDelay) ? debounceDelay[changedIndex] : debounceDelay) : 0
            )
          : wrapEffectRequest,
      removeStates: () => forEach(hookInstance.rf, fn => fn()),
      saveStates: (states: FrontRequestState) => forEach(hookInstance.sf, fn => fn(states)),
      frontStates,
      watchingStates,
      immediate: immediate ?? trueValue
    });
  }

  return {
    ...exportings,
    get [keyDownloading]() {
      hookInstance.ed = trueValue;
      return exportState(downloading) as unknown as ExportedType<Progress, State>;
    },
    get [keyUploading]() {
      hookInstance.eu = trueValue;
      return exportState(uploading) as unknown as ExportedType<Progress, State>;
    },
    onSuccess(handler: SuccessHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>) {
      pushItem(hookInstance.sh, handler);
    },
    onError(handler: ErrorHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>) {
      pushItem(hookInstance.eh, handler);
    },
    onComplete(
      handler: CompleteHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
    ) {
      pushItem(hookInstance.ch, handler);
    },
    abort: memorize(() => hookInstance.m && hookInstance.m.abort()),

    /**
     * 通过执行该方法来手动发起请求
     * @param sendCallingArgs 调用send函数时传入的参数
     * @param methodInstance 方法对象
     * @param isFetcher 是否为isFetcher调用
     * @returns 请求promise
     */
    send: memorize(
      (
        sendCallingArgs?: any[],
        methodInstance?: Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
      ) => handleRequest(methodInstance, sendCallingArgs)
    )
  };
}
