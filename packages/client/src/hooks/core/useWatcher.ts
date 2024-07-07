import { objAssign } from '@alova/shared/function';
import { len } from '@alova/shared/vars';
import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, EnumHookType, UseHookExposure, WatcherHookConfig } from '~/typings/clienthook';
import { watcherHookAssert } from './implements/assert';
import createRequestState from './implements/createRequestState';

export default function useWatcher<AG extends AlovaGenerics>(
  handler: Method<AG> | AlovaMethodHandler<AG>,
  watchingStates: AG['StatesExport']['Watched'][],
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
