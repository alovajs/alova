import useRequest from '@/hooks/core/useRequest';
import { noop, statesHookHelper } from '@alova/shared/function';
import { AlovaGenerics, promiseStatesHook } from 'alova';
import { AlovaMethodHandler, SQRequestHookConfig, UseHookExposure } from '~/typings/clienthook';
import createSilentQueueMiddlewares from './createSilentQueueMiddlewares';

export default function useSQRequest<AG extends AlovaGenerics>(
  handler: AlovaMethodHandler<AG>,
  config: SQRequestHookConfig<AG> = {}
) {
  const { exposeProvider, __referingObj: referingObj } = statesHookHelper(promiseStatesHook());
  const { middleware = noop } = config;
  const {
    c: methodCreateHandler,
    m: silentMiddleware,
    b: binders,
    d: decorateEvent
  } = createSilentQueueMiddlewares(handler, config);
  const states = useRequest(methodCreateHandler, {
    ...config,
    __referingObj: referingObj,
    middleware: (ctx, next) => {
      const silentMidPromise = silentMiddleware(ctx, next);
      middleware(ctx, () => silentMidPromise);
      return silentMidPromise;
    }
  });
  decorateEvent(states as UseHookExposure<AG>);

  return exposeProvider({
    ...states,
    ...binders
  });
}
