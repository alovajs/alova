import { createEventManager, forEach, includes, newInstance, objectKeys, trueValue } from '@alova/shared';
import { Method } from 'alova';
import { ScopedSQEvents } from '~/typings/clienthook';
import { SerializedSilentMethod, SilentMethod } from '../SilentMethod';
import { dependentAlovaInstance } from '../globalVariables';

/**
 * Deserialize the silentMethod instance according to the name of the serializer.
 * @param methodInstance Request method instance
 * @returns Request method instance
 */
export default (payload: SerializedSilentMethod) => {
  const {
    id,
    behavior,
    entity,
    retryError,
    maxRetryTimes,
    backoff,
    resolveHandler,
    rejectHandler,
    handlerArgs,
    targetRefMethod,
    force
  } = payload;

  // Method class instantiation
  const deserializeMethod = (methodPayload: SerializedSilentMethod['entity']) => {
    const { type, url, config, data } = methodPayload;
    return newInstance(Method, type, dependentAlovaInstance, url, config, data);
  };

  const silentMethodInstance = newInstance(
    SilentMethod,
    deserializeMethod(entity),
    behavior,
    createEventManager<ScopedSQEvents<any>>(),
    id,
    force,
    retryError,
    maxRetryTimes,
    backoff,
    resolveHandler,
    rejectHandler,
    handlerArgs
  );
  silentMethodInstance.cache = trueValue;

  // Target ref method deserialization
  if (targetRefMethod) {
    silentMethodInstance.targetRefMethod = deserializeMethod(targetRefMethod);
  }

  // Put extra content on the silent method instance
  forEach(objectKeys(payload), key => {
    if (
      !includes(
        [
          'id',
          'behavior',
          'emitter',
          'entity',
          'retryError',
          'maxRetryTimes',
          'backoff',
          'resolveHandler',
          'rejectHandler',
          'handlerArgs',
          'targetRefMethod',
          'force'
        ],
        key
      )
    ) {
      (silentMethodInstance as any)[key] = payload[key as keyof typeof payload];
    }
  });
  return silentMethodInstance;
};
