import { AlovaMethodHandler, useRequest } from 'alova';
import { SQRequestHookConfig } from '~/typings/general';
import createSilentQueueMiddlewares from './createSilentQueueMiddlewares';
import { promiseResolve, undefinedValue } from '@alova/shared/vars';
import { noop } from '@alova/shared/function';

export default function <
  State,
  Computed,
  Watched,
  Export,
  Responded,
  Transformed,
  RequestConfig,
  Response,
  ResponseHeader
>(
  handler: AlovaMethodHandler<
    State,
    Computed,
    Watched,
    Export,
    Responded,
    Transformed,
    RequestConfig,
    Response,
    ResponseHeader
  >,
  config: SQRequestHookConfig<
    State,
    Computed,
    Watched,
    Export,
    Responded,
    Transformed,
    RequestConfig,
    Response,
    ResponseHeader
  > = {}
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
