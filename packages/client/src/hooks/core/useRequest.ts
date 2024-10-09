import { objAssign } from '@alova/shared/function';
import { trueValue } from '@alova/shared/vars';
import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, EnumHookType, RequestHookConfig, UseHookExposure } from '~/typings/clienthook';
import createRequestState from './implements/createRequestState';

export default function useRequest<AG extends AlovaGenerics, Args extends any[] = any[]>(
  handler: Method<AG> | AlovaMethodHandler<AG, Args>,
  config: RequestHookConfig<AG, Args> = {}
) {
  const { immediate = trueValue, initialData } = config;
  const props = createRequestState(EnumHookType.USE_REQUEST, handler, config, initialData, !!immediate);
  const { send } = props;
  return objAssign(props, {
    send: (...args: [...Args, ...any[]]) => send(args)
  }) as unknown as UseHookExposure<AG, Args>;
}
