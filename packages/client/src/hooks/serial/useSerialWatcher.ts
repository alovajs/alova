import { AlovaMethodHandler, Method, RequestHookConfig, SvelteWritable, useWatcher, VueRef } from 'alova';
import { Writable } from 'svelte/store';
import { WatchSource } from 'vue';
import { assertSerialHandlers, serialMiddleware } from './general';

/**
 * 串行请求hook，每个serialHandlers中将接收到上一个请求的结果
 * 适用场景：监听状态变化后，串行请求一组接口
 * @param serialHandlers 串行请求回调数组
 * @param config 配置参数
 * @return useSerialRequest相关数据和操作函数
 */
export default <S, E, R, T, RC, RE, RH>(
  serialHandlers: [
    Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    ...AlovaMethodHandler<S, E, R, T, RC, RE, RH>[]
  ],
  watchingStates: S extends VueRef ? (WatchSource<any> | object)[] : S extends SvelteWritable ? Writable<any>[] : any[],
  config: RequestHookConfig<S, E, R, T, RC, RE, RH> = {}
) => {
  assertSerialHandlers('useSerialWatcher', serialHandlers);
  return useWatcher(serialHandlers[0], watchingStates, {
    ...config,
    middleware: serialMiddleware(serialHandlers, config.middleware)
  });
};
