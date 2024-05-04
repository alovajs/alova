import { objAssign } from '@alova/shared/function';
import { len } from '@alova/shared/vars';
import createRequestState from '@/functions/createRequestState';
import Method from '@/Method';
import myAssert from '@/utils/myAssert';
import { AlovaMethodHandler, EnumHookType, WatcherHookConfig } from '~/typings';

export default function useWatcher<S, E, R, T, RC, RE, RH>(
  handler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  watchingStates: E[],
  config: WatcherHookConfig<S, E, R, T, RC, RE, RH> = {}
) {
  myAssert(watchingStates && len(watchingStates) > 0, 'must specify at least one watching state');
  const { immediate, debounce = 0, initialData } = config;
  const props = createRequestState(
    EnumHookType.USE_WATCHER,
    handler,
    config,
    initialData,
    !!immediate, // !!immediate可以使immediate为falsy值时传入false，即不立即发送请求
    watchingStates,
    debounce
  );
  const { send } = props;
  return objAssign(props, {
    send: (...args: any[]) => send(args)
  });
}
