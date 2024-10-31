import { EventManager, isArray, splice, undefinedValue, uuid } from '@alova/shared';
import { AlovaGenerics, Method } from 'alova';
import type {
  BackoffPolicy,
  SQHookBehavior,
  ScopedSQEvents,
  SilentMethod as SilentMethodInterface,
  SilentQueueMap
} from '~/typings/clienthook';
import { silentAssert } from './globalVariables';
import { silentQueueMap } from './silentQueue';
import { persistSilentMethod, spliceStorageSilentMethod } from './storage/silentMethodStorage';

export type PromiseExecuteParameter = Parameters<ConstructorParameters<typeof Promise<any>>['0']>;
export type MethodHandler<AG extends AlovaGenerics> = (...args: any[]) => Method<AG>;
export type MaxRetryTimes = NonNullable<SilentMethodInterface['maxRetryTimes']>;
export type RetryError = NonNullable<SilentMethodInterface['retryError']>;

/**
 * Locate the location of the silentMethod instance
 * @param silentMethodInstance silentMethod instance
 */
const getBelongQueuePosition = <AG extends AlovaGenerics>(silentMethodInstance: SilentMethod<AG>) => {
  let queue: SilentQueueMap[string] | undefined = undefinedValue;
  let queueName = '';
  let position = 0;
  for (const queueNameLoop in silentQueueMap) {
    position = silentQueueMap[queueNameLoop].indexOf(silentMethodInstance);
    if (position >= 0) {
      queue = silentQueueMap[queueNameLoop];
      queueName = queueNameLoop;
      break;
    }
  }
  return [queue, queueName, position] as const;
};

/**
 * silentMethod instance
 * Requests that need to enter silentQueue will be packaged into silentMethod instances, which will carry various parameters of the request strategy.
 */
export class SilentMethod<AG extends AlovaGenerics> {
  public id: string;

  /** Whether it is a persistent instance */
  public cache: boolean;

  /** The behavior of the instance, queue or silent */
  public behavior: SQHookBehavior;

  /** Method instance */
  public entity: Method<AG>;

  /** Retry error rules */
  public retryError?: RetryError;

  /** Number of retries */
  public maxRetryTimes?: MaxRetryTimes;

  /** avoidance strategy */
  public backoff?: BackoffPolicy;

  /** Promise's resolve function, the call will pass the corresponding promise object */
  public resolveHandler?: PromiseExecuteParameter['0'];

  /** Promise's reject function, calling the corresponding promise object will fail */
  public rejectHandler?: PromiseExecuteParameter['1'];

  /** Virtual response data is saved here through update state effect */
  public virtualResponse?: any;

  /**
   * methodHandler call parameters
   * If there is dummy data, it will be replaced by actual data after the request is responded to.
   */
  public handlerArgs?: any[];

  /** The virtual data id used when creating Method */
  public vDatas?: string[];

  /**
   * The method instance pointed to by the status update
   * The target method instance that will update the state when calling updateStateEffect is stored here.
   * The purpose is to allow the submitted data to still find the status that needs to be updated after refreshing the page.
   */
  public targetRefMethod?: Method<AG>;

  /** Which states are updated by calling update state effect? */
  public updateStates?: string[];

  /** event manager */
  public emitter: EventManager<ScopedSQEvents<AG>>;

  /** Is it currently being requested? */
  public active?: boolean;

  /** Is it mandatory? */
  public force: boolean;

  constructor(
    entity: Method<AG>,
    behavior: SQHookBehavior,
    emitter: EventManager<ScopedSQEvents<AG>>,
    id = uuid(),
    force?: boolean,
    retryError?: RetryError,
    maxRetryTimes?: MaxRetryTimes,
    backoff?: BackoffPolicy,
    resolveHandler?: PromiseExecuteParameter['0'],
    rejectHandler?: PromiseExecuteParameter['1'],
    handlerArgs?: any[],
    vDatas?: string[]
  ) {
    const thisObj = this;
    thisObj.entity = entity;
    thisObj.behavior = behavior;
    thisObj.id = id;
    thisObj.emitter = emitter;
    thisObj.force = !!force;
    thisObj.retryError = retryError;
    thisObj.maxRetryTimes = maxRetryTimes;
    thisObj.backoff = backoff;
    thisObj.resolveHandler = resolveHandler;
    thisObj.rejectHandler = rejectHandler;
    thisObj.handlerArgs = handlerArgs;
    thisObj.vDatas = vDatas;
  }

  /**
   * Allow cache-time persistent updates to the current instance
   */
  public async save() {
    this.cache && (await persistSilentMethod(this));
  }

  /**
   * Replace the current instance with a new silentMethod instance in the queue
   * If there is a persistent cache, the cache will also be updated.
   * @param newSilentMethod new silentMethod instance
   */
  public async replace(newSilentMethod: SilentMethod<AG>) {
    const targetSilentMethod = this;
    silentAssert(
      newSilentMethod.cache === targetSilentMethod.cache,
      'the cache of new silentMethod must equal with this silentMethod'
    );
    const [queue, queueName, position] = getBelongQueuePosition(targetSilentMethod);
    if (queue) {
      splice(queue, position, 1, newSilentMethod);
      targetSilentMethod.cache && (await spliceStorageSilentMethod(queueName, targetSilentMethod.id, newSilentMethod));
    }
  }

  /**
   * Remove the current instance. If there is persistent data, it will also be removed synchronously.
   */
  public async remove() {
    const targetSilentMethod = this;
    const [queue, queueName, position] = getBelongQueuePosition(targetSilentMethod);
    if (queue) {
      splice(queue, position, 1);
      targetSilentMethod.cache && (await spliceStorageSilentMethod(queueName, targetSilentMethod.id));
    }
  }

  /**
   * Set the method instance corresponding to the delayed update status and the corresponding status name
   * It will find the corresponding status data and update vData to the actual data after responding to this silentMethod
   *
   * @param method method instance
   * @param updateStateName Updated status name, the default is data, you can also set multiple
   */
  public setUpdateState(method: Method<AG>, updateStateName: string | string[] = 'data') {
    if (method) {
      this.targetRefMethod = method;
      this.updateStates = isArray(updateStateName) ? (updateStateName as string[]) : [updateStateName as string];
    }
  }
}

type MethodEntityPayload = Omit<Method, 'context' | 'response' | 'send'>;
export type SerializedSilentMethod = SilentMethodInterface & {
  entity: MethodEntityPayload;
  targetRefMethod?: MethodEntityPayload;
};
