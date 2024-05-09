import { AlovaMethodHandler, Method, RequestHookConfig, useRequest } from 'alova';
import { assertSerialHandlers, serialMiddleware } from './general';

/**
 * 串行请求hook，每个serialHandlers中将接收到上一个请求的结果
 * 适用场景：串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export default <State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>(
  serialHandlers: [
    (
      | Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
      | AlovaMethodHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
    ),
    ...AlovaMethodHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>[]
  ],
  config: RequestHookConfig<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> = {} as any
) => {
  assertSerialHandlers('useSerialRequest', serialHandlers);
  return useRequest(serialHandlers[0], {
    ...config,
    middleware: serialMiddleware(serialHandlers, config.middleware)
  });
};
