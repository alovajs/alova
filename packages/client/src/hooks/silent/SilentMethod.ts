import { EventManager } from '@alova/shared/createEventManager';
import { getContext, instanceOf, uuid } from '@alova/shared/function';
import { falseValue, isArray, splice, undefinedValue } from '@alova/shared/vars';
import { AlovaGenerics, Method } from 'alova';
import type {
  BackoffPolicy,
  SQHookBehavior,
  ScopedSQEvents,
  SilentMethod as SilentMethodInterface,
  SilentQueueMap
} from '~/typings/general';
import { silentAssert } from './globalVariables';
import { silentQueueMap } from './silentQueue';
import { persistSilentMethod, spliceStorageSilentMethod } from './storage/silentMethodStorage';

export type PromiseExecuteParameter = Parameters<ConstructorParameters<typeof Promise<any>>['0']>;
export type MethodHandler<AG extends AlovaGenerics> = (...args: any[]) => Method<AG>;
export type MaxRetryTimes = NonNullable<SilentMethodInterface['maxRetryTimes']>;
export type RetryError = NonNullable<SilentMethodInterface['retryError']>;

/**
 * 定位silentMethod实例所在的位置
 * @param silentMethodInstance silentMethod实例
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
 * silentMethod实例
 * 需要进入silentQueue的请求都将被包装成silentMethod实例，它将带有请求策略的各项参数
 */
export class SilentMethod<AG extends AlovaGenerics> {
  public id: string;

  /** 是否为持久化实例 */
  public cache: boolean;

  /** 实例的行为，queue或silent */
  public behavior: SQHookBehavior;

  /** method实例 */
  public entity: Method<AG>;

  /** 重试错误规则 */
  public retryError?: RetryError;

  /** 重试次数 */
  public maxRetryTimes?: MaxRetryTimes;

  /** 避让策略 */
  public backoff?: BackoffPolicy;

  /** Promise的resolve函数，调用将通过对应的promise对象 */
  public resolveHandler?: PromiseExecuteParameter['0'];

  /** Promise的reject函数，调用将失败对应的promise对象 */
  public rejectHandler?: PromiseExecuteParameter['1'];

  /** 虚拟响应数据，通过updateStateEffect保存到此 */
  public virtualResponse?: any;

  /**
   * methodHandler的调用参数
   * 如果其中有虚拟数据也将在请求被响应后被实际数据替换
   */
  public handlerArgs?: any[];

  /** method创建时所使用的虚拟数据id */
  public vDatas?: string[];

  /**
   * 状态更新所指向的method实例
   * 当调用updateStateEffect时将会更新状态的目标method实例保存在此
   * 目的是为了让刷新页面后，提交数据也还能找到需要更新的状态
   */
  public targetRefMethod?: Method<AG>;

  /** 调用updateStateEffect更新了哪些状态 */
  public updateStates?: string[];

  /** 事件管理器 */
  public emitter: EventManager<ScopedSQEvents<AG>>;

  /** 当前是否正在请求中 */
  public active?: boolean;

  /** 是否强制 */
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
   * 允许缓存时持久化更新当前实例
   */
  public async save() {
    this.cache && (await persistSilentMethod(this));
  }

  /**
   * 在队列中使用一个新的silentMethod实例替换当前实例
   * 如果有持久化缓存也将会更新缓存
   * @param newSilentMethod 新的silentMethod实例
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
   * 移除当前实例，如果有持久化数据，也会同步移除
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
   * // TODO: 检查matcher参数
   * 设置延迟更新状态对应的method实例以及对应的状态名
   * 它将在此silentMethod响应后，找到对应的状态数据并将vData更新为实际数据
   *
   * @param matcher method实例匹配器
   * @param updateStateName 更新的状态名，默认为data，也可以设置多个
   */
  public setUpdateState(matcher: Method<AG>, updateStateName: string | string[] = 'data') {
    const methodInstance = instanceOf(matcher, Method<AG>)
      ? matcher
      : getContext(this.entity).snapshots.match(matcher, falseValue);
    if (methodInstance) {
      this.targetRefMethod = methodInstance;
      this.updateStates = isArray(updateStateName) ? (updateStateName as string[]) : [updateStateName as string];
    }
  }
}

type MethodEntityPayload = Omit<Method, 'context' | 'response' | 'send'>;
export type SerializedSilentMethod = SilentMethodInterface & {
  entity: MethodEntityPayload;
  targetRefMethod?: MethodEntityPayload;
};
