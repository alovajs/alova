import Method from '@/Method';
import createRequestState from '@/functions/createRequestState';
import myAssert from '@/utils/myAssert';
import { objAssign } from '@alova/shared/function';
import { len } from '@alova/shared/vars';
import { AlovaMethodHandler, EnumHookType, WatcherHookConfig } from '~/typings';

export default function useWatcher<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>(
  handler:
    | Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
    | AlovaMethodHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
  watchingStates: Watched[],
  config: WatcherHookConfig<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> = {}
) {
  myAssert(watchingStates && len(watchingStates) > 0, 'must specify at least one watching state');
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
