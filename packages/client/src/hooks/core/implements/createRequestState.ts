import { debounce, mapObject } from '@/util/helper';
import createEventManager from '@alova/shared/createEventManager';
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
import { PromiseCls, falseValue, forEach, isArray, promiseCatch, trueValue, undefinedValue } from '@alova/shared/vars';
import type { AlovaGlobalCacheAdapter, Method, Progress } from 'alova';
import { AlovaGenerics, globalConfigMap, promiseStatesHook } from 'alova';
import {
  AlovaCompleteEvent,
  AlovaErrorEvent,
  AlovaMethodHandler,
  AlovaSuccessEvent,
  CompleteHandler,
  EnumHookType,
  ErrorHandler,
  FrontRequestHookConfig,
  SuccessHandler,
  UseHookConfig,
  WatcherHookConfig
} from '~/typings/clienthook';
import { KEY_COMPLETE, KEY_ERROR, KEY_SUCCESS } from './alovaEvent';
import { coreHookAssert } from './assert';
import createHook from './createHook';
import useHookToSendRequest from './useHookToSendRequest';

const refCurrent = <T>(ref: { current: T }) => ref.current;
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
  AG extends AlovaGenerics,
  Args extends any[],
  Config extends UseHookConfig<AG, Args>
>(
  hookType: EnumHookType,
  methodHandler: Method<AG> | AlovaMethodHandler<AG, Args>,
  useHookConfig: Config,
  initialData?: FrontRequestHookConfig<AG, Args>['initialData'],
  immediate = falseValue,
  watchingStates?: AG['StatesExport']['Watched'][],
  debounceDelay: WatcherHookConfig<AG>['debounce'] = 0
) {
  // shallow clone config object to avoid passing the same useHookConfig object which may cause vue2 state update error
  useHookConfig = { ...useHookConfig };
  const { __referingObj: referingObject = { trackedKeys: {}, bindError: falseValue } } = useHookConfig;
  let initialLoading = !!immediate;

  // 当立即发送请求时，需要通过是否强制请求和是否有缓存来确定初始loading值，这样做有以下两个好处：
  // 1. 在react下立即发送请求可以少渲染一次
  // 2. SSR渲染的html中，其初始视图为loading状态的，避免在客户端展现时的loading视图闪动
  if (immediate) {
    // 调用getHandlerMethod时可能会报错，需要try/catch
    try {
      const methodInstance = getHandlerMethod(methodHandler, coreHookAssert(hookType));
      const alovaInstance = getContext(methodInstance);
      const l1CacheResult = (alovaInstance.l1Cache as AlovaGlobalCacheAdapter).get<[any, number]>(
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
      const forceRequestFinally = sloughConfig((useHookConfig as UseHookConfig<AG, Args>).force ?? falseValue);
      initialLoading = !!forceRequestFinally || !cachedResponse;
    } catch (error) {}
  }

  const { create, effectRequest, ref, objectify, exposeProvider, transformState2Proxy } = statesHookHelper<AG>(
    promiseStatesHook(),
    referingObject
  );
  const progress: Progress = {
    total: 0,
    loaded: 0
  };
  // 将外部传入的受监管的状态一同放到frontStates集合中
  const { managedStates = {} } = useHookConfig as FrontRequestHookConfig<AG, Args>;
  const managedStatesProxy = mapObject(managedStates, (state, key) => transformState2Proxy(state, key));
  const data = create((isFn(initialData) ? initialData() : initialData) as AG['Responded'], 'data');
  const loading = create(initialLoading, 'loading');
  const error = create(undefinedValue as Error | undefined, 'error');
  const downloading = create({ ...progress }, 'downloading');
  const uploading = create({ ...progress }, 'uploading');

  const frontStates = objectify([data, loading, error, downloading, uploading]);
  const eventManager = createEventManager<{
    success: AlovaSuccessEvent<AG, Args>;
    error: AlovaErrorEvent<AG, Args>;
    complete: AlovaCompleteEvent<AG, Args>;
  }>();

  const hookInstance = refCurrent(ref(createHook(hookType, useHookConfig, eventManager, referingObject)));

  /**
   * ## react ##每次执行函数都需要重置以下项
   */
  hookInstance.fs = frontStates;
  hookInstance.em = eventManager;
  hookInstance.c = useHookConfig;
  hookInstance.ms = managedStatesProxy;

  const hasWatchingStates = watchingStates !== undefinedValue;
  // 初始化请求事件
  // 统一的发送请求函数
  const handleRequest = (
    handler: Method<AG> | AlovaMethodHandler<AG, Args> = methodHandler,
    sendCallingArgs?: [...Args, ...any[]]
  ) => useHookToSendRequest(hookInstance, handler, sendCallingArgs) as Promise<AG['Responded']>;
  // 以捕获异常的方式调用handleRequest
  // 捕获异常避免异常继续向外抛出
  const wrapEffectRequest = (ro = referingObject, handler?: Method<AG> | AlovaMethodHandler<AG>) =>
    promiseCatch(handleRequest(handler), error => {
      // the error tracking indicates that the error need to throw.
      if (!ro.bindError && !ro.trackedKeys.error) {
        throw error;
      }
    });

  /**
   * fix: #421
   * Use ref wraps to prevent react from creating new debounce function in every render
   * Explicit passing is required because the context will change
   */
  const debouncingSendHandler = ref(
    debounce(
      (delay, ro, handler) => wrapEffectRequest(ro, handler),
      (changedIndex?: number) =>
        isNumber(changedIndex) ? (isArray(debounceDelay) ? debounceDelay[changedIndex] : debounceDelay) : 0
    )
  );

  // 在服务端渲染时不发送请求
  if (!globalConfigMap.ssr) {
    effectRequest({
      handler:
        // watchingStates为数组时表示监听状态（包含空数组），为undefined时表示不监听状态
        hasWatchingStates
          ? (delay: number) => debouncingSendHandler.current(delay, referingObject, methodHandler)
          : () => wrapEffectRequest(referingObject),
      removeStates: () => forEach(hookInstance.rf, fn => fn()),
      saveStates: states => forEach(hookInstance.sf, fn => fn(states)),
      frontStates: { ...frontStates, ...managedStatesProxy },
      watchingStates,
      immediate: immediate ?? trueValue
    });
  }

  return exposeProvider({
    ...objectify([data, loading, error, downloading, uploading]),
    abort: () => hookInstance.m && hookInstance.m.abort(),
    /**
     * 通过执行该方法来手动发起请求
     * @param sendCallingArgs 调用send函数时传入的参数
     * @param methodInstance 方法对象
     * @param isFetcher 是否为isFetcher调用
     * @returns 请求promise
     */
    send: (sendCallingArgs?: [...Args, ...any[]], methodInstance?: Method<AG>) =>
      handleRequest(methodInstance, sendCallingArgs),
    onSuccess(handler: SuccessHandler<AG, Args>) {
      eventManager.on(KEY_SUCCESS, handler);
    },
    onError(handler: ErrorHandler<AG, Args>) {
      // will not throw error when bindError is true.
      // it will reset in `exposeProvider` so that ignore the error binding in custom use hooks.
      referingObject.bindError = trueValue;
      eventManager.on(KEY_ERROR, handler);
    },
    onComplete(handler: CompleteHandler<AG, Args>) {
      eventManager.on(KEY_COMPLETE, handler);
    }
  });
}
