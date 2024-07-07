import useWatcher from '@/hooks/core/useWatcher';
import { decorateEvent } from '@alova/shared/createEventManager';
import { statesHookHelper } from '@alova/shared/function';
import { len } from '@alova/shared/vars';
import { AlovaGenerics, Method, promiseStatesHook } from 'alova';
import { AlovaMethodHandler, RequestHookConfig } from '~/typings/clienthook';
import { assertSerialHandlers, serialMiddleware } from './general';

/**
 * 串行请求hook，每个serialHandlers中将接收到上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export default <AG extends AlovaGenerics>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG>, ...AlovaMethodHandler<any>[]],
  watchingStates: AG['StatesExport']['Watched'][],
  config: RequestHookConfig<AG> = {} as any
) => {
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
};
