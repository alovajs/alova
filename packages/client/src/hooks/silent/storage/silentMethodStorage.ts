import { len, objectKeys, pushItem, splice } from '@alova/shared';
import { AlovaGenerics } from 'alova';
import type { SilentMethod } from '../SilentMethod';
import {
  SerializedSilentMethodIdQueueMap,
  silentMethodIdQueueMapStorageKey,
  silentMethodStorageKeyPrefix,
  storageGetItem,
  storageRemoveItem,
  storageSetItem
} from './performers';

/**
 * Serialize and save silentMethod instance
 * @param silentMethodInstance silentMethod instance
 */
export const persistSilentMethod = <AG extends AlovaGenerics>(silentMethodInstance: SilentMethod<AG>) =>
  storageSetItem(silentMethodStorageKeyPrefix + silentMethodInstance.id, silentMethodInstance);

/**
 * Put the configuration information of silent request into the corresponding storage
 * Logic: Construct a key and use this key to put the configuration information of the silent method into the corresponding storage, and then store the key in the unified management key storage.
 * @param silentMethod SilentMethodInstance
 * @param queue Operation queue name
 */
export const push2PersistentSilentQueue = async <AG extends AlovaGenerics>(
  silentMethodInstance: SilentMethod<AG>,
  queueName: string
) => {
  await persistSilentMethod(silentMethodInstance);
  // Save the silent method instance id to queue storage
  const silentMethodIdQueueMap = ((await storageGetItem(silentMethodIdQueueMapStorageKey)) ||
    {}) as SerializedSilentMethodIdQueueMap;
  const currentQueue = (silentMethodIdQueueMap[queueName] = silentMethodIdQueueMap[queueName] || []);
  pushItem(currentQueue, silentMethodInstance.id);
  await storageSetItem(silentMethodIdQueueMapStorageKey, silentMethodIdQueueMap);
};

/**
 * Remove or replace silentMethod instances in the cache
 * @param queue Operation queue name
 * @param targetSilentMethodId Target silentMethod instance id
 * @param newSilentMethod The new silentMethod instance to replace. If not passed, it means deleted.
 */
export const spliceStorageSilentMethod = async <AG extends AlovaGenerics>(
  queueName: string,
  targetSilentMethodId: string,
  newSilentMethod?: SilentMethod<AG>
) => {
  // Remove the silent method instance id from the queue
  const silentMethodIdQueueMap = ((await storageGetItem(silentMethodIdQueueMapStorageKey)) ||
    {}) as SerializedSilentMethodIdQueueMap;
  const currentQueue = silentMethodIdQueueMap[queueName] || [];
  const index = currentQueue.findIndex(id => id === targetSilentMethodId);
  if (index >= 0) {
    if (newSilentMethod) {
      splice(currentQueue, index, 1, newSilentMethod.id);
      await persistSilentMethod(newSilentMethod);
    } else {
      splice(currentQueue, index, 1);
    }

    await storageRemoveItem(silentMethodStorageKeyPrefix + targetSilentMethodId);
    // Delete this queue when it is empty
    len(currentQueue) <= 0 && delete silentMethodIdQueueMap[queueName];
    if (len(objectKeys(silentMethodIdQueueMap)) > 0) {
      await storageSetItem(silentMethodIdQueueMapStorageKey, silentMethodIdQueueMap);
    } else {
      // Remove the queue collection when it is empty
      await storageRemoveItem(silentMethodIdQueueMapStorageKey);
    }
  }
};
