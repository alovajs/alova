import { objAssign } from '@alova/shared/function';
import { trueValue } from '@alova/shared/vars';
import { AlovaGenerics, AlovaMethodHandler, EnumHookType, Method, RequestHookConfig, type UseHookReturnType } from 'alova';
import createRequestState from './implements/createRequestState';

export default function useRequest<AG extends AlovaGenerics>(
  handler: Method<AG> | AlovaMethodHandler<AG>,
  config: RequestHookConfig<AG> = {}
) {
  const { immediate = trueValue, initialData } = config;
  const props = createRequestState(EnumHookType.USE_REQUEST, handler, config, initialData, !!immediate);
  const { send } = props;
  return objAssign(props, {
    send: (...args: any[]) => send(args)
  }) as UseHookReturnType<AG>;
}
