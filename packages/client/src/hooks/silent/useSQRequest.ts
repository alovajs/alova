import { noop, promiseResolve } from '@/helper';
import { undefinedValue } from '@/helper/variables';
import { AlovaMethodHandler, useRequest } from 'alova';
import { SQRequestHookConfig } from '~/typings/general';
import createSilentQueueMiddlewares from './createSilentQueueMiddlewares';

export default function <S, E, R, T, RC, RE, RH>(
  handler: AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
  config: SQRequestHookConfig<S, E, R, T, RC, RE, RH> = {}
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
