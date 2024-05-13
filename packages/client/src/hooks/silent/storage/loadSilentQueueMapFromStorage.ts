import { SilentQueueMap } from '~/typings/general';
import convertPayload2SilentMethod from './convertPayload2SilentMethod';
import {
  SerializedSilentMethodIdQueueMap,
  silentMethodIdQueueMapStorageKey,
  silentMethodStorageKeyPrefix,
  storageGetItem
} from './performers';
import { forEach, objectKeys, pushItem } from '@alova/shared/vars';

/**
 * 从storage中载入静默队列数据
 * @returns 所有队列数据
 */
export default () => {
  const silentMethodIdQueueMap = (storageGetItem(silentMethodIdQueueMapStorageKey) || {}) as SerializedSilentMethodIdQueueMap;
  const silentQueueMap = {} as SilentQueueMap;
  forEach(objectKeys(silentMethodIdQueueMap), queueName => {
    const currentQueue = (silentQueueMap[queueName] = silentQueueMap[queueName] || []);
    forEach(silentMethodIdQueueMap[queueName], silentMethodId => {
      const serializedSilentMethodPayload = storageGetItem(silentMethodStorageKeyPrefix + silentMethodId);
      serializedSilentMethodPayload && pushItem(currentQueue, convertPayload2SilentMethod(serializedSilentMethodPayload));
    });
  });
  return silentQueueMap;
};
