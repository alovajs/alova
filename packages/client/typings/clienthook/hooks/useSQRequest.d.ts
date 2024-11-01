import type { EventManager } from '@alova/shared';
import { Alova, AlovaGenerics, Method } from 'alova';
import { AlovaCompleteEvent, AlovaEvent, AlovaMethodHandler, UseHookExposure } from '../general';
import { updateState } from './updateState';
import { RequestHookConfig } from './useRequest';

// =========================
/** Silently commit events */
// event:
// Globally:
//  [GlobalSQEvent] Request events: behavior, silentMethod instance, method instance, retryTimes
//  [GlobalSQSuccessEvent] Success events: collection of behavior, silentMethod instance, method instance, retryTimes, response data, virtual data and actual values
//  [GlobalSQErrorEvent] Error events: behavior, silentMethod instance, method instance, retryTimes, error object, [?] next retry interval
//  [GlobalSQFailEvent] Failure event: behavior, silentMethod instance, method instance, retryTimes, error object

// Local:
//  [ScopedSQSuccessEvent] Success events: behavior, silentMethod instance, method instance, retryTimes, send parameter, response data
//  [ScopedSQErrorEvent] Failure events: behavior, silentMethod instance, method instance, retryTimes, send parameter, error object
//  [ScopedSQErrorEvent] Fallback events: behavior, silentMethod instance, method instance, retryTimes, send parameter, error object
//  [ScopedSQSuccessEvent | ScopedSQErrorEvent] Completion event: behavior, silentMethod instance, method instance, retryTimes, send parameter, [?] error object
//  [ScopedSQEvent] Before entering the queue: behavior, silentMethod instance, method instance, send parameter
//  [ScopedSQEvent] After entering the queue: behavior, silentMethod instance, method instance, send parameter
/** SQ top level events */
export interface SQEvent<AG extends AlovaGenerics> {
  /**
   * Request behavior corresponding to the event
   */
  behavior: SQHookBehavior;
  /**
   * the current method instance
   */
  method: Method<AG>;
  /**
   * The current silentMethod instance has no value when the behavior is static
   */
  silentMethod?: SilentMethod<AG>;
}
/** Sq global events */
export interface GlobalSQEvent<AG extends AlovaGenerics> extends SQEvent<AG> {
  /**
   * Number of retries, no value in beforePush and pushed events
   */
  retryTimes: number;

  /**
   * The queue name where silentMethod is located
   */
  queueName: string;
}
/** Sq global success event */
export interface GlobalSQSuccessEvent<AG extends AlovaGenerics> extends GlobalSQEvent<AG> {
  /**
   * response data
   */
  data: any;
  /**
   * A collection of dummy data and actual values
   * It only contains the actual values of the dummy data you have used.
   */
  vDataResponse: Record<string, any>;
}
/** Sq global failure event */
export interface GlobalSQErrorEvent<AG extends AlovaGenerics> extends GlobalSQEvent<AG> {
  /**
   * Error thrown on failure
   */
  error: any;

  /**
   * Next retry interval (milliseconds)
   */
  retryDelay?: number;
}
/** Sq global failure event */
export interface GlobalSQFailEvent<AG extends AlovaGenerics> extends GlobalSQEvent<AG> {
  /** Error thrown on failure */
  error: any;
}

/** Sq local event */
export interface ScopedSQEvent<AG extends AlovaGenerics, Args extends any[] = any[]> extends SQEvent<AG> {
  /**
   * The parameters passed in when triggering the request through send
   */
  args: [...Args, ...any[]];
}
/** partial success event */
export interface ScopedSQSuccessEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends ScopedSQEvent<AG, Args> {
  /**
   * response data
   */
  data: AG['Responded'];
}
/** local failure event */
export interface ScopedSQErrorEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends ScopedSQEvent<AG, Args> {
  /**
   * Error thrown on failure
   */
  error: any;
}
/** local failure event */
export interface ScopedSQRetryEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends ScopedSQEvent<AG, Args> {
  /**
   * Number of retries
   */
  retryTimes: number;
  /**
   * Retry interval (milliseconds)
   */
  retryDelay: number;
}
/** partial completion event */
export interface ScopedSQCompleteEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends ScopedSQEvent<AG, Args> {
  /**
   * response status
   */
  status: AlovaCompleteEvent<AG, Args>['status'];
  /**
   * response data
   */
  data?: AG['Responded'];
  /**
   * Error thrown on failure
   */
  error?: any;
}

export interface RetryErrorDetailed {
  name?: RegExp;
  message?: RegExp;
}

export interface BackoffPolicy {
  /**
   * Delay time for requesting again, in milliseconds
   * @default 1000
   */
  delay?: number;
  /**
   * Specify the delay multiplier. For example, if the multiplier is set to 1.5 and the delay is 2 seconds, the first retry will be 2 seconds, the second retry will be 3 seconds, and the third retry will be 4.5 seconds.
   * @default 0
   */
  multiplier?: number;

  /**
   * Jitter starting percentage value for delayed requests, ranging from 0-1
   * When only startQuiver is set, endQuiver defaults to 1
   * For example, set to 0.5, it will add 50% to 100% random time to the current delay time
   * If endQuiver has a value, the delay time will be increased by a random value in the range of startQuiver and endQuiver
   */
  startQuiver?: number;

  /**
   * Jitter end percentage value for delayed requests, ranging from 0-1
   * When only endQuiver is set, startQuiver defaults to 0
   * For example, set to 0.5, it will add a random time of 0% to 50% to the current delay time
   * If startQuiver has a value, the delay time will be increased by a random value in the range of startQuiver and endQuiver
   */
  endQuiver?: number;
}

export type ScopedSQEvents<AG extends AlovaGenerics> = {
  fallback: ScopedSQEvent<AG>;
  retry: ScopedSQRetryEvent<AG>;
  beforePushQueue: ScopedSQEvent<AG>;
  pushedQueue: ScopedSQEvent<AG>;
};

/**
 * silentMethod instance
 * Requests that need to enter silentQueue will be packaged into silentMethod instances, which will carry various parameters of the request strategy.
 */
export interface SilentMethod<AG extends AlovaGenerics = AlovaGenerics> {
  /**
   * silentMethod instance id
   */
  readonly id: string;
  /**
   * The behavior of the instance, queue or silent
   */
  readonly behavior: SQHookBehavior;
  /**
   * method instance
   */
  readonly entity: Method<AG>;

  /**
   * Whether it is a persistent instance
   */
  cache: boolean;

  /**
   * Retry error rules
   * Retries only when the error matches the following expression
   * When the value is a regular expression, it will match the message of the error object
   * When the value is an object, it can be set to match the name or message of the error object. If both are set, it will be matched in the form of or
   *
   * When not set, all errors will be retried by default.
   */
  readonly retryError?: RegExp | RetryErrorDetailed;
  /**
   * Number of retries
   */
  readonly maxRetryTimes?: number;
  /**
   * avoidance strategy
   */
  readonly backoff?: BackoffPolicy;

  /**
   * Fallback event callback, this callback will be called when the number of retries reaches the upper limit but still fails.
   */
  readonly emitter: EventManager<ScopedSQEvents<AG>>;

  /**
   * Promise's resolve function, the call will pass the corresponding promise object
   */
  readonly resolveHandler?: Parameters<ConstructorParameters<typeof Promise<any>>['0']>['0'];

  /**
   * Promise's reject function, calling the corresponding promise object will fail
   */
  readonly rejectHandler?: Parameters<ConstructorParameters<typeof Promise<any>>['0']>['1'];

  /**
   * methodHandler call parameters
   * If there is dummy data, it will be replaced by actual data after the request is responded to.
   */
  readonly handlerArgs?: any[];

  /**
   * The virtual data id used when creating the method
   */
  readonly vDatas?: string[];

  /**
   * Virtual response data is saved here through delayUpdateState
   */
  virtualResponse?: any;

  /**
   * Which states are updated by calling updateStateEffect
   */
  updateStates?: string[];

  /**
   * Submitting status update data silently
   * When the data is submitted silently, we also need to manually update the submitted data to other states to achieve the purpose of immediately displaying the submitted information.
   * In order to make the updated data available after reloading the page, we can use this field to save and persist it with the silentMethod.
   * You can obtain this data again wherever you need to use it and display it on the interface.
   *
   * Note: Generally speaking, you can save persistent data with any attribute name, but an error will be reported in typescript, so reviewData is specified for you as the saving attribute of silent submission status data.
   */
  reviewData?: any;

  /**
   * Additional persistent data during silent commit
   * When the data is actually submitted after silent submission, we may need to access this new data
   * When the submitted data does not meet the data required for interface rendering, we can save the additional data to the extraData field when submitting to ensure that it can be obtained next time
   *
   * Note: Generally speaking, you can save persistent data with any attribute name, but an error will be reported in typescript, so extraData is specified for you as the field for the above function.
   */
  extraData?: any;

  /**
   * The method instance pointed to by the status update
   * The target method instance that will update the state when calling updateStateEffect is stored here.
   * The purpose is to allow the submitted data to still find the status that needs to be updated after refreshing the page.
   */
  targetRefMethod?: Method<AG>;

  /** Is it currently being requested? */
  active?: boolean;

  /** Whether to force the request */
  force: boolean;

  /**
   * Allow cache-time persistent updates to the current instance
   */
  save(): Promise<void>;

  /**
   * Replace the current instance with a new silentMethod instance in the queue
   * If there is a persistent cache, the cache will also be updated.
   * @param newSilentMethod new silentMethod instance
   */
  replace(newSilentMethod: SilentMethod<AG>): Promise<void>;

  /**
   * Remove the current instance, it will be removed synchronously in the persistent storage
   */
  remove(): Promise<void>;

  /**
   * Set the method instance corresponding to the delayed update status and the corresponding status name
   * It will find the corresponding status data and update vData to the actual data after responding to this silentMethod
   *
   * @param matcher method instance matcher
   * @param updateStateName Updated status name, the default is data, you can also set multiple
   */
  setUpdateState(matcher: Method<AG>, updateStateName?: string | string[]): void;
}

// Silent queue hooks related
export type SQHookBehavior = 'static' | 'queue' | 'silent';
export interface SQHookConfig<AG extends AlovaGenerics> {
  /**
   * Hook behavior, optional values are silent, queue, static, default is queue
   * Can be set to an optional value, or a callback function that returns an optional value
   * silent: Submit silently, the method instance will enter the queue and be persisted, and then trigger onSuccess immediately
   * queue: Queue request, the method instance will enter the queue but will not be persisted, onSuccess and onError are triggered normally
   * static: static request, the same as ordinary useRequest
   *
   * Scenario 1. Manual switch
   * Scenario 2. When the network status is not good, fall back to static and determine the network status by yourself.
   */
  behavior?: SQHookBehavior | ((event: AlovaEvent<AG, any[]>) => SQHookBehavior);

  /** Retry error rules
   * Retry only when the error matches the following expression
   * When the value is a regular expression, it will match the message of the error object
   * When the value is an object, it can be set to match the name or message of the error object. If both are set, it will be matched in the form of or
   */
  retryError?: NonNullable<SilentMethod['retryError']>;

  /** Maximum number of retries */
  maxRetryTimes?: NonNullable<SilentMethod['maxRetryTimes']>;

  /** avoidance strategy */
  backoff?: NonNullable<SilentMethod['backoff']>;

  /**
   * Queue name. If not passed, the default queue will be selected.
   * If you need to dynamically allocate the queue for each request, you can set it to a function and return the queue name.
   */
  queue?: string | ((event: AlovaEvent<AG, any[]>) => string);

  /** Default response data when submitting silently */
  silentDefaultResponse?: () => any;

  /**
   * It will be called when capturing with dummy data in method
   * When this capture callback returns data, this data will be processed as response data instead of sending a request.
   * @param {Method} method method instance
   * @returns {R} Data in the same format as the response data
   */
  vDataCaptured?: (method: Method<AG>) => AG['Responded'] | undefined | void;
}

export type SQRequestHookConfig<AG extends AlovaGenerics, Args extends any[] = any[]> = SQHookConfig<AG> &
  RequestHookConfig<AG, Args>;
export type FallbackHandler<AG extends AlovaGenerics, Args extends any[] = any[]> = (
  event: ScopedSQEvent<AG, Args>
) => void;
export type RetryHandler<AG extends AlovaGenerics, Args extends any[] = any[]> = (
  event: ScopedSQRetryEvent<AG, Args>
) => void;
export type BeforePushQueueHandler<AG extends AlovaGenerics, Args extends any[] = any[]> = (
  event: ScopedSQEvent<AG, Args>
) => void | boolean | Promise<void | boolean>;
export type PushedQueueHandler<AG extends AlovaGenerics, Args extends any[] = any[]> = (
  event: ScopedSQEvent<AG, Args>
) => void;
export type SQHookExposure<AG extends AlovaGenerics, Args extends any[] = any[]> = Omit<
  UseHookExposure<AG, Args>,
  'onSuccess' | 'onError' | 'onComplete'
> & {
  /**
   * Fallback event binding function, which will be triggered in the following situations:
   * 1. After retrying the specified number of times without response and stopping continuing the request
   * 2. After stopping the request due to network disconnection or corresponding error on the server side
   *
   * After binding this event, request persistence will be invalid, which means that silently submitted items will be lost on refresh
   * It only works under silent behavior
   *
   * Compare with onComplete event:
   * 1. Only triggered when the number of retries is reached and the failure still occurs.
   * 2. Triggered before onComplete
   */
  onFallback(handler: FallbackHandler<AG, Args>): SQHookExposure<AG>;

  /** Called before entering the queue, you can filter duplicate silent methods in the queue. It is invalid under static behavior. */
  onBeforePushQueue(handler: BeforePushQueueHandler<AG, Args>): SQHookExposure<AG>;

  /** Called after being queued, invalid under static behavior */
  onPushedQueue(handler: PushedQueueHandler<AG, Args>): SQHookExposure<AG>;

  /** Retry event binding */
  onRetry(handler: RetryHandler<AG, Args>): SQHookExposure<AG>;

  /** @override Rewrite alova's on success event */
  onSuccess(handler: (event: ScopedSQSuccessEvent<AG, Args>) => void): SQHookExposure<AG>;

  /** @override Rewrite alova's on error event */
  onError(handler: (event: ScopedSQErrorEvent<AG, Args>) => void): SQHookExposure<AG>;

  /** @override Override alova's on complete event */
  onComplete(handler: (event: ScopedSQCompleteEvent<AG, Args>) => void): SQHookExposure<AG>;
};

export interface DataSerializer {
  forward(data: any): any | undefined | void;
  backward(data: any): any | undefined | void;
}

export interface QueueRequestWaitSetting {
  queue: string | RegExp;
  wait: number | ((silentMethod: SilentMethod, queueName: string) => number | undefined);
}
/** Silent factory startup options */
export interface SilentFactoryBootOptions {
  /**
   * alova instance that silentMethod depends on
   * The storage adapter, request adapter, etc. of the alova instance will be used to access the SilentMethod instance and send silent commits
   */
  alova: Alova<AlovaGenerics>;

  /** Delay in milliseconds, default delay is 2000ms when not transmitting */
  delay?: number;

  /**
   * Serializer collection, used to customize certain data that cannot be converted directly when converted to serialization
   * The key of the collection is serialized as its name. When deserializing, the value of the corresponding name will be passed into the backward function.
   * Therefore, when serializing in forward, it is necessary to determine whether it is the specified data and return the converted data, otherwise it will return undefined or not return
   * In backward, it can be identified by name, so you only need to deserialize it directly.
   * Built-in serializer:
   * 1. Date serializer is used to convert dates
   * 2. The regexp serializer is used to convert regular expressions
   *
   * >>> You can override the built-in serializer by setting a serializer with the same name
   */
  serializers?: Record<string | number, DataSerializer>;

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
   *   { queue: 'customName', wait: 5000 },
   *
   *   //Indicates that in all queues with the prefix prefix, the request setting with method instance name xxx is set to wait 5000ms
   *   { queue: /^prefix/, wait: silentMethod => silentMethod.entity.config.name === 'xxx' ? 5000 : 0 },
   * ]
   *
   * >>> It only works if the request succeeds, if it fails it will use the retry policy parameters
   */
  requestWait?: QueueRequestWaitSetting[] | QueueRequestWaitSetting['wait'];
}

export type SilentSubmitBootHandler = () => void;
export type BeforeSilentSubmitHandler = (event: GlobalSQEvent<AlovaGenerics>) => void;
export type SilentSubmitSuccessHandler = (event: GlobalSQSuccessEvent<AlovaGenerics>) => void;
export type SilentSubmitErrorHandler = (event: GlobalSQErrorEvent<AlovaGenerics>) => void;
export type SilentSubmitFailHandler = (event: GlobalSQFailEvent<AlovaGenerics>) => void;
export type OffEventCallback = () => void;
export type SilentQueueMap = Record<string, SilentMethod<any>[]>;

/**
 * request hook with silentQueue
 * silentQueue is the core component to implement silent submission, which will be used to store silentMethod instances, and they will send submissions serially in order
 */
export declare function useSQRequest<AG extends AlovaGenerics, Args extends any[] = any[]>(
  handler: AlovaMethodHandler<AG, Args>,
  config?: SQRequestHookConfig<AG, Args>
): SQHookExposure<AG, Args>;
export declare function bootSilentFactory(options: SilentFactoryBootOptions): void;
export declare function onSilentSubmitBoot(handler: SilentSubmitBootHandler): OffEventCallback;
export declare function onSilentSubmitSuccess(handler: SilentSubmitSuccessHandler): OffEventCallback;
export declare function onSilentSubmitError(handler: SilentSubmitErrorHandler): OffEventCallback;
export declare function onSilentSubmitFail(handler: SilentSubmitFailHandler): OffEventCallback;
export declare function onBeforeSilentSubmit(handler: BeforeSilentSubmitHandler): OffEventCallback;
export declare function dehydrateVData<T>(target: T): T;
export declare function stringifyVData(target: any, returnOriginalIfNotVData?: boolean): any;
export declare function isVData(target: any): boolean;
export declare function equals(prevValue: any, nextValue: any): boolean;
export declare function filterSilentMethods(
  methodNameMatcher?: string | number | RegExp,
  queueName?: string,
  filterActive?: boolean
): Promise<SilentMethod[]>;
export declare function getSilentMethod(
  methodNameMatcher?: string | number | RegExp,
  queueName?: string,
  filterActive?: boolean
): Promise<SilentMethod | undefined>;
export declare const updateStateEffect: typeof updateState;
export declare const silentQueueMap: SilentQueueMap;
