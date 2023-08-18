import Alova from '@/Alova';
import createRequestState from '@/functions/createRequestState';
import Method from '@/Method';
import myAssert, { assertAlovaCreation } from '@/utils/myAssert';
import { alovas, len, trueValue } from '@/utils/variables';
import { Writable } from 'svelte/store';
import { WatchSource } from 'vue';
import { AlovaMethodHandler, SvelteWritable, VueRef, WatcherHookConfig } from '~/typings';

export default function useWatcher<S, E, R, T, RC, RE, RH>(
  handler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  watchingStates: S extends VueRef ? (WatchSource<any> | object)[] : S extends SvelteWritable ? Writable<any>[] : any[],
  config: WatcherHookConfig<S, E, R, T, RC, RE, RH> = {}
) {
  myAssert(watchingStates && len(watchingStates) > 0, 'must specify at least one watching state');
  assertAlovaCreation();
  const { immediate, debounce = 0, initialData, abortLast = trueValue } = config,
    props = createRequestState(
      alovas[0] as Alova<S, E, RC, RE, RH>,
      handler,
      config,
      initialData,
      !!immediate, // !!immediate可以使immediate为falsy值时传入false，即不立即发送请求
      watchingStates,
      debounce,
      abortLast
    );

  return {
    ...props,
    send: (...args: any[]) => props.send(args)
  };
}
