import useWatcher from '@/hooks/core/useWatcher';
import { decorateEvent } from '@alova/shared/createEventManager';
import { statesHookHelper } from '@alova/shared/function';
import { len } from '@alova/shared/vars';
import { AlovaGenerics, Method, promiseStatesHook } from 'alova';
import { AlovaMethodHandler, FrontRequestHookConfig, RequestHookConfig, UseHookExposure } from '~/typings';
import { assertSerialHandlers, serialMiddleware } from './general';

export interface WatcherHookConfig<AG extends AlovaGenerics> extends FrontRequestHookConfig<AG> {
  /** 请求防抖时间（毫秒），传入数组时可按watchingStates的顺序单独设置防抖时间 */
  debounce?: number | number[];
  abortLast?: boolean;
}

/**
 * 串行请求hook，每个serialHandlers中将接收到上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export function useSerialWatcher<AG extends AlovaGenerics>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG>, ...AlovaMethodHandler<any>[]],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG>;
export function useSerialWatcher<AG extends AlovaGenerics, AG2 extends AlovaGenerics>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG>, AlovaMethodHandler<AG2>, ...AlovaMethodHandler<any>[]],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG2>;
export function useSerialWatcher<AG extends AlovaGenerics, AG2 extends AlovaGenerics, AG3 extends AlovaGenerics>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    ...AlovaMethodHandler<any>[]
  ],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG3>;
export function useSerialWatcher<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    ...AlovaMethodHandler<any>[]
  ],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG4>;
export function useSerialWatcher<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    ...AlovaMethodHandler<any>[]
  ],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG5>;
export function useSerialWatcher<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics,
  AG6 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    AlovaMethodHandler<AG6>,
    ...AlovaMethodHandler<any>[]
  ],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG6>;
export function useSerialWatcher<
  AG extends AlovaGenerics,
  AG2 extends AlovaGenerics,
  AG3 extends AlovaGenerics,
  AG4 extends AlovaGenerics,
  AG5 extends AlovaGenerics,
  AG6 extends AlovaGenerics,
  AG7 extends AlovaGenerics
>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    AlovaMethodHandler<AG4>,
    AlovaMethodHandler<AG5>,
    AlovaMethodHandler<AG6>,
    AlovaMethodHandler<AG7>,
    ...AlovaMethodHandler<any>[]
  ],
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG7>;
export default function useSerialWatcher<AG extends AlovaGenerics>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG>, ...AlovaMethodHandler<any>[]],
  watchingStates: AG['Watched'][],
  config: RequestHookConfig<AG> = {} as any
) {
  assertSerialHandlers('useSerialWatcher', serialHandlers);
  // eslint-disable-next-line
  const { ref, __referingObj } = statesHookHelper(promiseStatesHook());
  const methods = ref<Method<AG>[]>([]).current;
  const exposures = useWatcher<AG>(serialHandlers[0], watchingStates, {
    ...config,
    __referingObj,
    middleware: serialMiddleware(serialHandlers, config.middleware, methods)
  });

  // 装饰错误回调函数，将event.method设置为出错的实例
  exposures.onError = decorateEvent(exposures.onError, (handler, event) => {
    event.method = methods[len(methods) - 1];
    handler(event);
  });
  return exposures;
}
