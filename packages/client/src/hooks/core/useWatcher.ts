import { objAssign } from '@alova/shared/function';
import { len } from '@alova/shared/vars';
import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, EnumHookType, WatcherHookConfig, type UseHookExposure } from '~/typings';
import { watcherHookAssert } from './implements/assert';
import createRequestState from './implements/createRequestState';

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
export default function useWatcher<AG extends AlovaGenerics>(
  handler: Method<AG> | AlovaMethodHandler<AG>,
  watchingStates: AG['Watched'][],
  config: WatcherHookConfig<AG> = {}
) {
  watcherHookAssert(watchingStates && len(watchingStates) > 0, 'expected at least one watching state');
  const { immediate, debounce = 0, initialData } = config;
  const props = createRequestState(
    EnumHookType.USE_WATCHER,
    handler,
    config,
    initialData,
    !!immediate, // !!immediate means not send request immediately
    watchingStates,
    debounce
  );
  const { send } = props;
  return objAssign(props, {
    send: (...args: any[]) => send(args)
  }) as UseHookExposure<AG>;
}
