import { objAssign } from '@alova/shared/function';
import { trueValue } from '@alova/shared/vars';
import createRequestState from '@/functions/createRequestState';
import Method from '@/Method';
import { AlovaMethodHandler, EnumHookType, RequestHookConfig } from '~/typings';

export default function useRequest<S, E, R, T, RC, RE, RH>(
  handler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  config: RequestHookConfig<S, E, R, T, RC, RE, RH> = {}
) {
  const { immediate = trueValue, initialData } = config;
  const props = createRequestState(EnumHookType.USE_REQUEST, handler, config, initialData, !!immediate);
  const { send } = props;
  return objAssign(props, {
    send: (...args: any[]) => send(args)
  });
}
