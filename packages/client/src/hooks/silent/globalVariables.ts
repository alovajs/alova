import { createAssert, createEventManager, isArray } from '@alova/shared';
import { Alova, AlovaGenerics } from 'alova';
import {
  DataSerializer,
  GlobalSQErrorEvent,
  GlobalSQEvent,
  GlobalSQFailEvent,
  GlobalSQSuccessEvent,
  QueueRequestWaitSetting
} from '~/typings/clienthook';

export const STR_VALUE_OF = 'valueOf';
export const STR_TO_STRING = 'toString';
export const DEFAULT_QUEUE_NAME = 'default';
export const BEHAVIOR_SILENT = 'silent';
export const BEHAVIOR_QUEUE = 'queue';
export const BEHAVIOR_STATIC = 'static';
/**
 * Global virtual data collection array
 * It will only be an array when the method is created, and undefined at other times
 *
 * Explanation: The purpose of collecting virtual data is to determine whether virtual data is used in a method instance.
 * Includes the following forms:
 * useSQRequest((vDataId) => createMethod({ vDataId }) //Reference function parameters
 * useSQRequest(() => createMethod({ vDataId }) //Directly reference scope parameters
 *
 * Or even:
 * function createMethod(obj) {
 *   return alovaInst.Get('/list', {
 *     params: { status: obj.vDataId ? 1 : 0 }
 *   })
 * }
 * useSQRequest(() => createMethod(obj) //Directly reference scope parameters
 *
 * Ways to use dummy data include:
 * 1. Directly assign values as parameters
 * 2. Use dummy data id
 * 3. Indirect use of virtual data, such as
 *    vData ? 1 : 0
 *    !!vData
 *    vData+1
 *    etc. as calculation parameters.
 */
export let vDataIdCollectBasket: Record<string, undefined> | undefined;
export const setVDataIdCollectBasket = (value: typeof vDataIdCollectBasket) => {
  vDataIdCollectBasket = value;
};

/**
 * The dependent alova instance, its storage adapter, request adapter, etc. will be used to access the SilentMethod instance and send silent submissions
 */
export let dependentAlovaInstance: Alova<AlovaGenerics>;
export const setDependentAlova = (alovaInst: Alova<AlovaGenerics>) => {
  dependentAlovaInstance = alovaInst;
};

/**
 * Set up a custom serializer
 */
export let customSerializers: Record<string | number, DataSerializer> = {};
export const setCustomSerializers = (serializers: typeof customSerializers = {}) => {
  customSerializers = serializers;
};

/**
 * silentFactory status
 * 0 means not started
 * 1 means in progress, changed after calling bootSilentFactory
 * 2 indicates that the request failed, that is, when the maximum number of requests is reached according to the retry rules, or when the retry rules are not matched, the request is changed.
 */
export let silentFactoryStatus = 0;
export const setSilentFactoryStatus = (status: 0 | 1 | 2) => {
  silentFactoryStatus = status;
};

/**
 * The request waiting time in silentQueue, in milliseconds (ms)
 * It indicates the waiting time of the silentMethod that is about to send the request
 * If not set, or set to 0, the silentMethod request is triggered immediately
 *
 * Tips:
 * 1. When set directly, it is effective for the default queue by default.
 * 2. If you need to set other queue settings, you can specify them as objects, such as:
 * [
 *   Indicates waiting 5000ms for the queue setting request named customName
 *   { name: 'customName', wait: 5000 },
 *
 *   //Indicates that in all queues with the prefix prefix, the request setting with method instance name xxx is set to wait 5000ms
 *   { name: /^prefix/, wait: silentMethod => silentMethod.entity.config.name === 'xxx' ? 5000 : 0 },
 * ]
 *
 * >>> It only works if the request succeeds, if it fails it will use the retry policy parameters
 */
export let queueRequestWaitSetting: QueueRequestWaitSetting[] = [];
export const setQueueRequestWaitSetting = (
  requestWaitSetting: QueueRequestWaitSetting[] | QueueRequestWaitSetting['wait'] = 0
) => {
  queueRequestWaitSetting = isArray(requestWaitSetting)
    ? (requestWaitSetting as QueueRequestWaitSetting[])
    : [
        {
          queue: DEFAULT_QUEUE_NAME,
          wait: requestWaitSetting as QueueRequestWaitSetting['wait']
        }
      ];
};

export const BootEventKey = Symbol('GlobalSQBoot');
export const BeforeEventKey = Symbol('GlobalSQBefore');
export const SuccessEventKey = Symbol('GlobalSQSuccess');
export const ErrorEventKey = Symbol('GlobalSQError');
export const FailEventKey = Symbol('GlobalSQFail');

export type GlobalSQEvents = {
  [BootEventKey]: void;
  [BeforeEventKey]: GlobalSQEvent<any>;
  [SuccessEventKey]: GlobalSQSuccessEvent<any>;
  [ErrorEventKey]: GlobalSQErrorEvent<any>;
  [FailEventKey]: GlobalSQFailEvent<any>;
};

/** Global silent event management object */
export const globalSQEventManager = createEventManager<GlobalSQEvents>();

/** Silent assert */
export const silentAssert: ReturnType<typeof createAssert> = createAssert('useSQRequest');
