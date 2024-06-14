import useRequest from '@/hooks/core/useRequest';
import { decorateEvent } from '@alova/shared/createEventManager';
import { statesHookHelper } from '@alova/shared/function';
import { len } from '@alova/shared/vars';
import { AlovaGenerics, Method, promiseStatesHook } from 'alova';
import { AlovaMethodHandler, FrontRequestHookConfig, UseHookExposure } from '~/typings';
import { assertSerialHandlers, serialMiddleware } from './general';

export type RequestHookConfig<AG extends AlovaGenerics> = FrontRequestHookConfig<AG>;

/**
 * 串行请求hook，每个serialHandlers中将接收到上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export function useSerialRequest<AG extends AlovaGenerics>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG>, ...AlovaMethodHandler<any>[]],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG>;
export function useSerialRequest<AG extends AlovaGenerics, AG2 extends AlovaGenerics>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG>, AlovaMethodHandler<AG2>, ...AlovaMethodHandler<any>[]],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG2>;
export function useSerialRequest<AG extends AlovaGenerics, AG2 extends AlovaGenerics, AG3 extends AlovaGenerics>(
  serialHandlers: [
    Method<AG> | AlovaMethodHandler<AG>,
    AlovaMethodHandler<AG2>,
    AlovaMethodHandler<AG3>,
    ...AlovaMethodHandler<any>[]
  ],
  config?: RequestHookConfig<AG>
): UseHookExposure<AG3>;
export function useSerialRequest<
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
  config?: RequestHookConfig<AG>
): UseHookExposure<AG4>;
export function useSerialRequest<
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
  config?: RequestHookConfig<AG>
): UseHookExposure<AG5>;
export function useSerialRequest<
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
  config?: RequestHookConfig<AG>
): UseHookExposure<AG6>;
export function useSerialRequest<
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
  config?: RequestHookConfig<AG>
): UseHookExposure<AG7>;
export default function useSerialRequest<AG extends AlovaGenerics>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG>, ...AlovaMethodHandler<any>[]],
  config: RequestHookConfig<AG> = {} as any
) {
  assertSerialHandlers('useSerialRequest', serialHandlers);
  // eslint-disable-next-line
  const { ref, __referingObj } = statesHookHelper(promiseStatesHook());
  const methods = ref<Method<AG>[]>([]).current;
  const exposures = useRequest<AG>(serialHandlers[0], {
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
