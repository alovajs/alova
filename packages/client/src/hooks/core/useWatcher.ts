import { EnumHookType } from '@/util/helper';
import { len, objAssign } from '@alova/shared';
import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, UseHookExposure, WatcherHookConfig } from '~/typings/clienthook';
import { watcherHookAssert } from './implements/assert';
import createRequestState from './implements/createRequestState';

export default function useWatcher<AG extends AlovaGenerics, Args extends any[] = any[]>(
  handler: Method<AG> | AlovaMethodHandler<AG, Args>,
  watchingStates: AG['StatesExport']['Watched'][],
  config: WatcherHookConfig<AG, Args> = {}
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
    send: (...args: [...Args, ...any[]]) => send(args)
  }) as unknown as UseHookExposure<AG, Args>;
}
