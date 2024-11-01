import useRequest from '@/hooks/core/useRequest';
import { statesHookHelper } from '@/util/helper';
import { decorateEvent, len } from '@alova/shared';
import { AlovaGenerics, Method, promiseStatesHook } from 'alova';
import { AlovaMethodHandler, RequestHookConfig } from '~/typings/clienthook';
import { assertSerialHandlers, serialMiddleware } from './general';

/**
 * Serial request hook, each serialHandlers will receive the result of the previous request
 * Applicable scenario: Serial request for a set of interfaces
 * @param serialHandlers Serial request callback array
 * @param config Configuration parameters
 * @return useSerialRequest related data and operation functions
 */
export default <AG extends AlovaGenerics, Args extends any[] = any[]>(
  serialHandlers: [Method<AG> | AlovaMethodHandler<AG, Args>, ...AlovaMethodHandler<any>[]],
  config: RequestHookConfig<AG, Args> = {} as any
) => {
  assertSerialHandlers('useSerialRequest', serialHandlers);
  // eslint-disable-next-line
  const { ref, __referingObj } = statesHookHelper(promiseStatesHook());
  const methods = ref<Method<AG>[]>([]).current;
  const exposures = useRequest(serialHandlers[0], {
    ...config,
    __referingObj,
    middleware: serialMiddleware(serialHandlers, config.middleware, methods)
  });

  // Decorate the error callback function and set event.method to the instance of the error
  exposures.onError = decorateEvent(exposures.onError, (handler, event) => {
    event.method = methods[len(methods) - 1];
    handler(event);
  });

  return exposures;
};
