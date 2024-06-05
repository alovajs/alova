import useRequest from '@/hooks/core/useRequest';
import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, RequestHookConfig } from '~/typings';
import { assertSerialHandlers, serialMiddleware } from './general';

/**
 * 串行请求hook，每个serialHandlers中将接收到上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export default <AG extends AlovaGenerics>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG>, ...AlovaMethodHandler<any>[]],
  config: RequestHookConfig<AG> = {} as any
) => {
  assertSerialHandlers('useSerialRequest', serialHandlers);
  return useRequest<AG>(serialHandlers[0], {
    ...config,
    middleware: serialMiddleware(serialHandlers, config.middleware)
  });
};
