import { useRequest } from '@/index';
import { noop } from '@alova/shared/function';
import { promiseResolve, undefinedValue } from '@alova/shared/vars';
import { AlovaGenerics } from 'alova';
import { AlovaMethodHandler } from '~/typings';
import { SQRequestHookConfig } from '~/typings/general';
import createSilentQueueMiddlewares from './createSilentQueueMiddlewares';

export default function useSQRequest<AG extends AlovaGenerics>(
  handler: AlovaMethodHandler<AG>,
  config: SQRequestHookConfig<AG> = {}
) {
  const { middleware = noop } = config;
  const { c: methodCreateHandler, m: silentMiddleware, b: binders } = createSilentQueueMiddlewares(handler, config);
  const states = useRequest(methodCreateHandler, {
    ...config,
    middleware: (ctx, next) => {
      middleware(ctx, () => promiseResolve(undefinedValue as any));
      return silentMiddleware(ctx, next);
    }
  });
  return {
    ...states,
    ...binders
  };
}
