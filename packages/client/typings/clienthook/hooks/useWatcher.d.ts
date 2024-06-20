import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, UseHookExposure } from '../general';
import { FrontRequestHookConfig } from './useRequest';

/** useWatcher config export type */
export interface WatcherHookConfig<AG extends AlovaGenerics> extends FrontRequestHookConfig<AG> {
  /** 请求防抖时间（毫秒），传入数组时可按watchingStates的顺序单独设置防抖时间 */
  debounce?: number | number[];
  abortLast?: boolean;
}

/**
 * 监听特定状态值变化后请求
 * @example
 * ```js
 *  const { data, loading, error, send, onSuccess } = useWatcher(() => alova.Get('/api/user-list'), [keywords])
 * ```
 * @param methodHandler method实例或获取函数
 * @param watchingStates 监听状态数组
 * @param config 配置项
 * @returns 响应式请求数据、操作函数及事件绑定函数
 */
export declare function useWatcher<AG extends AlovaGenerics>(
  methodHandler: Method<AG> | AlovaMethodHandler<AG>,
  watchingStates: AG['Watched'][],
  config?: WatcherHookConfig<AG>
): UseHookExposure<AG>;
