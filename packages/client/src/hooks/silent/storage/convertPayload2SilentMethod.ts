import { Method } from 'alova';
import { forEach, includes, newInstance, objectKeys } from '@/helper';
import { trueValue } from '@/helper/variables';
import { dependentAlovaInstance } from '../globalVariables';
import { SerializedSilentMethod, SilentMethod } from '../SilentMethod';

/**
 * 反序列化silentMethod实例，根据序列化器的名称进行反序列化
 * @param methodInstance 请求方法实例
 * @returns 请求方法实例
 */
export default (payload: SerializedSilentMethod) => {
  const {
    id,
    behavior,
    entity,
    retryError,
    maxRetryTimes,
    backoff,
    fallbackHandlers,
    resolveHandler,
    rejectHandler,
    handlerArgs,
    targetRefMethod,
    force
  } = payload;

  // method类实例化
  const deserializeMethod = (methodPayload: SerializedSilentMethod['entity']) => {
    const { type, url, config, data } = methodPayload;
    return newInstance(Method, type, dependentAlovaInstance, url, config, data);
  };
  const silentMethodInstance = newInstance(
    SilentMethod,
    deserializeMethod(entity),
    behavior,
    id,
    force,
    retryError,
    maxRetryTimes,
    backoff,
    fallbackHandlers,
    resolveHandler,
    rejectHandler,
    handlerArgs
  );
  silentMethodInstance.cache = trueValue;

  // targetRefMethod反序列化
  if (targetRefMethod) {
    silentMethodInstance.targetRefMethod = deserializeMethod(targetRefMethod);
  }

  // 将额外的内容放到silentMethod实例上
  forEach(objectKeys(payload), key => {
    if (
      !includes(
        [
          'id',
          'behavior',
          'entity',
          'retryError',
          'maxRetryTimes',
          'backoff',
          'fallbackHandlers',
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
