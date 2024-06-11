import createRequestState from '@/functions/createRequestState';
import Method from '@/Method';
import { objAssign } from '@/utils/helper';
import { trueValue } from '@/utils/variables';
import { AlovaMethodHandler, EnumHookType, RequestHookConfig } from '~/typings';

export default function useRequest<S, E, R, T, RC, RE, RH, ARG extends any[]>(
  handler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH, ARG>,
  config: RequestHookConfig<S, E, R, T, RC, RE, RH, ARG> = {}
) {
  const { immediate = trueValue, initialData } = config,
    props = createRequestState(EnumHookType.USE_REQUEST, handler, config, initialData, !!immediate),
    send = props.send;
  return objAssign(props, {
    send: (...args: [...ARG, ...any]) => send(args)
  });
}
