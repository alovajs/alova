import { PromiseCls, forEach, mapItem, objectKeys, pushItem } from '@alova/shared';
import { SilentQueueMap } from '~/typings/clienthook';
import convertPayload2SilentMethod from './convertPayload2SilentMethod';
import {
  SerializedSilentMethodIdQueueMap,
  silentMethodIdQueueMapStorageKey,
  silentMethodStorageKeyPrefix,
  storageGetItem
} from './performers';

/**
 * Load silent queue data from storage
 * @returns All queue data
 */
export default async () => {
  const silentMethodIdQueueMap = ((await storageGetItem(silentMethodIdQueueMapStorageKey)) ||
    {}) as SerializedSilentMethodIdQueueMap;
  const silentQueueMap = {} as SilentQueueMap;

  const readingPromises: Promise<void>[] = [];
  forEach(objectKeys(silentMethodIdQueueMap), queueName => {
    const currentQueue = (silentQueueMap[queueName] = silentQueueMap[queueName] || []);
    pushItem(
      readingPromises,
      ...mapItem(silentMethodIdQueueMap[queueName], async silentMethodId => {
        const serializedSilentMethodPayload = await storageGetItem(silentMethodStorageKeyPrefix + silentMethodId);
        serializedSilentMethodPayload &&
          pushItem(currentQueue, convertPayload2SilentMethod(serializedSilentMethodPayload));
      })
    );
  });
  await PromiseCls.all(readingPromises);
  return silentQueueMap;
};
