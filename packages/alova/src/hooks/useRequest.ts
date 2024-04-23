import createRequestState from '@/functions/createRequestState';
import Method from '@/Method';
import { objAssign } from '@alova/shared/function';
import { trueValue } from '@alova/shared/vars';
import { AlovaMethodHandler, EnumHookType, RequestHookConfig } from '~/typings';

export default function useRequest<S, E, R, T, RC, RE, RH>(
  handler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  config: RequestHookConfig<S, E, R, T, RC, RE, RH> = {}
) {
  const { immediate = trueValue, initialData } = config,
    props = createRequestState(EnumHookType.USE_REQUEST, handler, config, initialData, !!immediate),
    send = props.send;
  return objAssign(props, {
    send: (...args: any[]) => send(args)
  });
}
