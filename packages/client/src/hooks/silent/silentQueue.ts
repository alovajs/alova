import {
  GlobalSQErrorEvent,
  GlobalSQEvent,
  GlobalSQFailEvent,
  GlobalSQSuccessEvent,
  ScopedSQErrorEvent,
  ScopedSQRetryEvent
} from '@/event';
import updateState from '@/updateState';
import {
  PromiseCls,
  RegExpCls,
  delayWithBackoff,
  falseValue,
  forEach,
  instanceOf,
  isObject,
  isString,
  len,
  mapItem,
  newInstance,
  noop,
  objectKeys,
  promiseThen,
  pushItem,
  regexpTest,
  setTimeoutFn,
  shift,
  sloughConfig,
  trueValue,
  walkObject
} from '@alova/shared';
import { AlovaGenerics, Method, setCache } from 'alova';
import { RetryErrorDetailed, SilentMethod, SilentQueueMap, UpdateStateCollection } from '~/typings/clienthook';
import {
  BEHAVIOR_SILENT,
  BeforeEventKey,
  DEFAULT_QUEUE_NAME,
  ErrorEventKey,
  FailEventKey,
  SuccessEventKey,
  globalSQEventManager,
  queueRequestWaitSetting,
  setSilentFactoryStatus,
  silentFactoryStatus
} from './globalVariables';
import {
  persistSilentMethod,
  push2PersistentSilentQueue,
  spliceStorageSilentMethod
} from './storage/silentMethodStorage';
import stringifyVData from './virtualResponse/stringifyVData';
import { regVDataId } from './virtualResponse/variables';

/** Silent method queue collection */
export let silentQueueMap = {} as SilentQueueMap;

/**
 * Merge queueMap into silentMethod queue collection
 * @param queueMap silentMethod queue collection
 */
export const merge2SilentQueueMap = (queueMap: SilentQueueMap) => {
  forEach(objectKeys(queueMap), targetQueueName => {
    const currentQueue = (silentQueueMap[targetQueueName] = silentQueueMap[targetQueueName] || []);
    pushItem(currentQueue, ...queueMap[targetQueueName]);
  });
};

/**
 * Clear all items in silentQueue (used for testing)
 */
export const clearSilentQueueMap = () => {
  silentQueueMap = {};
};

/**
 * Deeply traverse the target data and replace dummy data with real data
 * @param target target data
 * @param vDataResponse Collection of dummy data and real data
 * @returns Is there any replacement data?
 */
export const deepReplaceVData = (target: any, vDataResponse: Record<string, any>) => {
  // Search for a single value and replace a dummy data object or dummy data id with an actual value
  const replaceVData = (value: any) => {
    const vData = stringifyVData(value);
    // If directly a dummy data object and in a vDataResponse, replace the Map with the value in the vDataResponse
    // If it is a string, it may contain virtual data id and in vDataResponse, it also needs to be replaced with the actual value Map
    // The virtual data not in this vDataResponse will remain unchanged. It may be the virtual data Map requested next time.
    if (vData in vDataResponse) {
      return vDataResponse[vData];
    }
    if (isString(value)) {
      return value.replace(newInstance(RegExpCls, regVDataId.source, 'g'), mat =>
        mat in vDataResponse ? vDataResponse[mat] : mat
      );
    }
    return value;
  };
  if (isObject(target) && !stringifyVData(target, falseValue)) {
    walkObject(target, replaceVData);
  } else {
    target = replaceVData(target);
  }
  return target;
};

/**
 * Update the method instance in the queue and replace the dummy data with actual data
 * @param vDataResponse A collection of virtual IDs and corresponding real data
 * @param targetQueue target queue
 */
const updateQueueMethodEntities = (vDataResponse: Record<string, any>, targetQueue: SilentQueueMap[string]) =>
  PromiseCls.all(
    mapItem(targetQueue, async silentMethodItem => {
      // Traverse the entity object deeply. If virtual data or virtual data ID is found, replace it with actual data.
      deepReplaceVData(silentMethodItem.entity, vDataResponse);
      // If the method instance is updated, re-persist this silent method instance
      silentMethodItem.cache && (await persistSilentMethod(silentMethodItem));
    })
  );

/**
 * Replace dummy data with response data
 * @param response real response data
 * @param virtualResponse dummy response data
 * @returns The corresponding real data set composed of virtual data id
 */
const replaceVirtualResponseWithResponse = (virtualResponse: any, response: any) => {
  let vDataResponse = {} as Record<string, any>;
  const vDataId = stringifyVData(virtualResponse, falseValue);
  vDataId && (vDataResponse[vDataId] = response);

  if (isObject(virtualResponse)) {
    for (const i in virtualResponse) {
      vDataResponse = {
        ...vDataResponse,
        ...replaceVirtualResponseWithResponse(virtualResponse[i], response?.[i])
      };
    }
  }
  return vDataResponse;
};

/**
 * Start the SilentMethod queue
 * 1. Silent submission will be put into the queue and requests will be sent in order. Only after the previous request responds will it continue to send subsequent requests.
 * 2. The number of retries is only triggered when there is no response. If the server responds incorrectly or is disconnected, it will not retry.
 * 3. When the number of retries is reached and still fails, when nextRound (next round) is set, delay the time specified by nextRound and then request again, otherwise it will try again after refreshing.
 * 4. If there is resolveHandler and rejectHandler, they will be called after the request is completed (whether successful or failed) to notify the corresponding request to continue responding.
 *
 * @param queue SilentMethodqueue
 */
const setSilentMethodActive = <AG extends AlovaGenerics>(silentMethodInstance: SilentMethod<AG>, active: boolean) => {
  if (active) {
    silentMethodInstance.active = active;
  } else {
    delete silentMethodInstance.active;
  }
};

const defaultBackoffDelay = 1000;
export const bootSilentQueue = (queue: SilentQueueMap[string], queueName: string) => {
  /**
   * The callback function is controlled by waiting parameters according to the request. If it is not set or is less than or equal to 0, it will be triggered immediately.
   * @param queueName queue name
   * @param callback callback function
   */
  const emitWithRequestDelay = (queueName: string) => {
    const nextSilentMethod = queue[0];
    if (nextSilentMethod) {
      const targetSetting = queueRequestWaitSetting.find(({ queue }) =>
        instanceOf(queue, RegExpCls) ? regexpTest(queue, queueName) : queue === queueName
      );
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const callback = () => queue[0] && silentMethodRequest(queue[0]);
      const delay = targetSetting?.wait ? sloughConfig(targetSetting.wait, [nextSilentMethod, queueName]) : 0;
      delay && delay > 0 ? setTimeoutFn(callback, delay) : callback();
    }
  };

  /**
   * Run a single silentMethod instance
   * @param silentMethodInstance silentMethod instance
   * @param retryTimes Number of retries
   */
  const silentMethodRequest = <AG extends AlovaGenerics>(silentMethodInstance: SilentMethod<AG>, retryTimes = 0) => {
    // Set the current silent method instance to active status
    setSilentMethodActive(silentMethodInstance, trueValue);
    const {
      cache,
      id,
      behavior,
      entity,
      retryError = /.*/,
      maxRetryTimes = 0,
      backoff = { delay: defaultBackoffDelay },
      resolveHandler = noop,
      rejectHandler = noop,
      emitter: methodEmitter,
      handlerArgs = [],
      virtualResponse,
      force
    } = silentMethodInstance;

    // Trigger pre-request event
    globalSQEventManager.emit(
      BeforeEventKey,
      newInstance(GlobalSQEvent<AG>, behavior, entity, silentMethodInstance, queueName, retryTimes)
    );
    promiseThen(
      entity.send(force),
      async data => {
        // The request is successful, remove the successful silent method, and continue with the next request
        shift(queue);
        // If the request is successful, remove the successful silent method instance from storage and continue with the next request.
        cache && (await spliceStorageSilentMethod(queueName, id));
        // If there is a resolve handler, call it to notify the outside
        resolveHandler(data);

        // Only when there is a virtualResponse, virtual data is traversed and replaced, and global events are triggered.
        // Generally, it is silent behavior, but queue behavior is not required.
        if (behavior === BEHAVIOR_SILENT) {
          // Replace dummy data in subsequent method instances in the queue with real data
          // Only after unlocking can you access the hierarchical structure of virtualResponse normally.
          const vDataResponse = replaceVirtualResponseWithResponse(virtualResponse, data);
          const { targetRefMethod, updateStates } = silentMethodInstance; // It is accurate to obtain it in real time
          // If this silentMethod has targetRefMethod, call updateState again to update the data
          // This is an implementation of delayed data updates
          if (instanceOf(targetRefMethod, Method) && updateStates && len(updateStates) > 0) {
            const updateStateCollection: UpdateStateCollection<any> = {};
            forEach(updateStates, stateName => {
              // After the request is successful, replace the data with dummy data with real data
              updateStateCollection[stateName] = dataRaw => deepReplaceVData(dataRaw, vDataResponse);
            });
            const updated = updateState(targetRefMethod, updateStateCollection);

            // If the status modification is unsuccessful, modify the cached data.
            if (!updated) {
              await setCache(targetRefMethod, (dataRaw: any) => deepReplaceVData(dataRaw, vDataResponse));
            }
          }

          // Perform dummy data replacement on subsequent silent method instances of the current queue
          await updateQueueMethodEntities(vDataResponse, queue);

          // Trigger global success event
          globalSQEventManager.emit(
            SuccessEventKey,
            newInstance(
              GlobalSQSuccessEvent<AG>,
              behavior,
              entity,
              silentMethodInstance,
              queueName,
              retryTimes,
              data,
              vDataResponse
            )
          );
        }

        // Set to inactive state
        setSilentMethodActive(silentMethodInstance, falseValue);

        // Continue to the next silent method processing
        emitWithRequestDelay(queueName);
      },
      reason => {
        if (behavior !== BEHAVIOR_SILENT) {
          // When the behavior is not silent and the request fails, rejectHandler is triggered.
          // and removed from the queue and will not be retried.
          shift(queue);
          rejectHandler(reason);
        } else {
          // Each request error will trigger an error callback
          const runGlobalErrorEvent = (retryDelay?: number) =>
            globalSQEventManager.emit(
              ErrorEventKey,
              newInstance(
                GlobalSQErrorEvent<AG>,
                behavior,
                entity,
                silentMethodInstance,
                queueName,
                retryTimes,
                reason,
                retryDelay
              )
            );

          // In silent behavior mode, determine whether retry is needed
          // Retry is only effective when the response error matches the retryError regular match
          const { name: errorName = '', message: errorMsg = '' } = reason || {};
          let regRetryErrorName: RegExp | undefined;
          let regRetryErrorMsg: RegExp | undefined;
          if (instanceOf(retryError, RegExp)) {
            regRetryErrorMsg = retryError;
          } else if (isObject(retryError)) {
            regRetryErrorName = (retryError as RetryErrorDetailed).name;
            regRetryErrorMsg = (retryError as RetryErrorDetailed).message;
          }

          const matchRetryError =
            (regRetryErrorName && regexpTest(regRetryErrorName, errorName)) ||
            (regRetryErrorMsg && regexpTest(regRetryErrorMsg, errorMsg));
          // If there are still retry times, try again
          if (retryTimes < maxRetryTimes && matchRetryError) {
            // The next retry times need to be used to calculate the delay time, so +1 is needed here.
            const retryDelay = delayWithBackoff(backoff, retryTimes + 1);
            runGlobalErrorEvent(retryDelay);
            setTimeoutFn(
              () => {
                retryTimes += 1;
                silentMethodRequest(silentMethodInstance, retryTimes);

                methodEmitter.emit(
                  'retry',
                  newInstance(
                    ScopedSQRetryEvent<AG>,
                    behavior,
                    entity,
                    silentMethodInstance,
                    handlerArgs,
                    retryTimes,
                    retryDelay
                  )
                );
              },
              // When there are still retry times, use timeout as the next request time.
              retryDelay
            );
          } else {
            setSilentFactoryStatus(2);
            runGlobalErrorEvent();
            // When the number of failures is reached, or the error message does not match the retry, the failure callback is triggered.
            methodEmitter.emit(
              'fallback',
              newInstance(ScopedSQErrorEvent<AG, any[]>, behavior, entity, silentMethodInstance, handlerArgs, reason)
            );
            globalSQEventManager.emit(
              FailEventKey,
              newInstance(GlobalSQFailEvent<AG>, behavior, entity, silentMethodInstance, queueName, retryTimes, reason)
            );
          }
        }
        // Set to inactive state
        setSilentMethodActive(silentMethodInstance, falseValue);
      }
    );
  };
  emitWithRequestDelay(queueName);
};

/**
 * Put a new silentMethod instance into the queue
 * @param silentMethodInstance silentMethod instance
 * @param cache Does silentMethod have cache?
 * @param targetQueueName target queue name
 * @param onBeforePush Events before silentMethod instance push
 */
export const pushNewSilentMethod2Queue = async <AG extends AlovaGenerics>(
  silentMethodInstance: SilentMethod<AG>,
  cache: boolean,
  targetQueueName = DEFAULT_QUEUE_NAME,
  onBeforePush: () => any[] | Promise<any>[] = () => []
) => {
  silentMethodInstance.cache = cache;
  const currentQueue = (silentQueueMap[targetQueueName] =
    silentQueueMap[targetQueueName] || []) as unknown as SilentMethod<AG>[];
  const isNewQueue = len(currentQueue) <= 0;
  const beforePushReturns = await Promise.all(onBeforePush());
  const isPush2Queue = !beforePushReturns.some(returns => returns === falseValue);

  // Under silent behavior, if there is no fallback event callback bound, it will be persisted.
  // If false is returned in onBeforePushQueue, it will no longer be placed in the queue.
  if (isPush2Queue) {
    cache && (await push2PersistentSilentQueue(silentMethodInstance, targetQueueName));
    pushItem(currentQueue, silentMethodInstance);
    // If it is a new queue and the status is started, execute it
    isNewQueue && silentFactoryStatus === 1 && bootSilentQueue(currentQueue, targetQueueName);
  }
  return isPush2Queue;
};
