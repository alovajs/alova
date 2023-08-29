import Alova from '@/Alova';
import createRequestState from '@/functions/createRequestState';
import Method from '@/Method';
import { assertAlovaCreation } from '@/utils/myAssert';
import { alovas, HOOK_REQUEST, trueValue } from '@/utils/variables';
import { AlovaMethodHandler, RequestHookConfig } from '~/typings';

export default function useRequest<S, E, R, T, RC, RE, RH>(
  handler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  config: RequestHookConfig<S, E, R, T, RC, RE, RH> = {}
) {
  assertAlovaCreation();
  const { immediate = trueValue, initialData } = config,
    props = createRequestState(
      HOOK_REQUEST,
      alovas[0] as Alova<S, E, RC, RE, RH>,
      handler,
      config,
      initialData,
      !!immediate
    );
  return {
    ...props,
    send: (...args: any[]) => props.send(args)
  };
}
