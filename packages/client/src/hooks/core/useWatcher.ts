import { objAssign } from '@alova/shared/function';
import { len } from '@alova/shared/vars';
import { AlovaMethodHandler, EnumHookType, Method, WatcherHookConfig } from 'alova';
import { watcherHookAssert } from './implements/assert';
import createRequestState from './implements/createRequestState';

export default function useWatcher<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>(
  handler:
    | Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
    | AlovaMethodHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
  watchingStates: Watched[],
  config: WatcherHookConfig<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> = {}
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
  });
}
