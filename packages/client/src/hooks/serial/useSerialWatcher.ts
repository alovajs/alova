import { AlovaMethodHandler, Method, RequestHookConfig, useWatcher } from 'alova';
import { assertSerialHandlers, serialMiddleware } from './general';

/**
 * 串行请求hook，每个serialHandlers中将接收到上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export default <State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>(
  serialHandlers: [
    (
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
        >
    ),
    ...AlovaMethodHandler<
      State,
      Computed,
      Watched,
      Export,
      Responded,
      Transformed,
      RequestConfig,
      Response,
      ResponseHeader
    >[]
  ],
  watchingStates: Watched,
  config: RequestHookConfig<
    State,
    Computed,
    Watched,
    Export,
    Responded,
    Transformed,
    RequestConfig,
    Response,
    ResponseHeader
  > = {} as any
) => {
  assertSerialHandlers('useSerialWatcher', serialHandlers);
  return useWatcher(serialHandlers[0], watchingStates, {
    ...config,
    middleware: serialMiddleware(serialHandlers, config.middleware)
  });
};
