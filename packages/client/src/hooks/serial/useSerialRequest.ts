import { AlovaMethodHandler, Method, RequestHookConfig, useRequest } from 'alova';
import { assertSerialHandlers, serialMiddleware } from './general';

/**
 * 串行请求hook，每个serialHandlers中将接收到上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export default <S, E, R, T, RC, RE, RH>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    ...AlovaMethodHandler<S, E, R, T, RC, RE, RH>[]
  ],
  config: RequestHookConfig<S, E, R, T, RC, RE, RH> = {}
) => {
  assertSerialHandlers('useSerialRequest', serialHandlers);
  return useRequest(serialHandlers[0], {
    ...config,
    middleware: serialMiddleware(serialHandlers, config.middleware)
  });
};
