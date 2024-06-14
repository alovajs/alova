import useRequest from '@/hooks/core/useRequest';
import { noop } from '@alova/shared/function';
import { promiseResolve, undefinedValue } from '@alova/shared/vars';
import { AlovaGenerics } from 'alova';
import { AlovaMethodHandler, RequestHookConfig } from '~/typings';
import { SQHookConfig } from '~/typings/general';
import createSilentQueueMiddlewares from './createSilentQueueMiddlewares';

export type SQRequestHookConfig<AG extends AlovaGenerics> = SQHookConfig<AG> & RequestHookConfig<AG>;

/**
 * 带silentQueue的request hook
 * silentQueue是实现静默提交的核心部件，其中将用于存储silentMethod实例，它们将按顺序串行发送提交
 */
export default function useSQRequest<AG extends AlovaGenerics>(
  handler: AlovaMethodHandler<AG>,
  config: SQRequestHookConfig<AG> = {}
) {
  const { middleware = noop } = config;
  const {
    c: methodCreateHandler,
    m: silentMiddleware,
    b: binders,
    d: decorateEvent
  } = createSilentQueueMiddlewares(handler, config);
  const states = useRequest(methodCreateHandler, {
    ...config,
    middleware: (ctx, next) => {
      middleware(ctx, () => promiseResolve(undefinedValue as any));
      return silentMiddleware(ctx, next);
    }
  });
  decorateEvent(states);

  return {
    ...states,
    ...binders
  };
}
