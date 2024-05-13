/* eslint-disable import/no-cycle */
import { uuid } from '@/util/helper';
import { getContext, instanceOf } from '@alova/shared/function';
import { falseValue, isArray, splice, undefinedValue } from '@alova/shared/vars';
import { Method } from 'alova';
import type {
  BackoffPolicy,
  FallbackHandler,
  RetryHandler,
  SQHookBehavior,
  SilentMethod as SilentMethodInterface,
  SilentQueueMap
} from '~/typings/general';
import { silentAssert } from './globalVariables';
import { silentQueueMap } from './silentQueue';
import { persistSilentMethod, spliceStorageSilentMethod } from './storage/silentMethodStorage';

export type PromiseExecuteParameter = Parameters<ConstructorParameters<typeof Promise<any>>['0']>;
export type MethodHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> = (
  ...args: any[]
) => Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>;
export type MaxRetryTimes = NonNullable<SilentMethodInterface['maxRetryTimes']>;
export type RetryError = NonNullable<SilentMethodInterface['retryError']>;

/**
 * 定位silentMethod实例所在的位置
 * @param silentMethodInstance silentMethod实例
 */
const getBelongQueuePosition = <State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>(
  silentMethodInstance: SilentMethod<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
) => {
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
export class SilentMethod<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> {
  public id: string;

  /** 是否为持久化实例 */
  public cache: boolean;

  /** 实例的行为，queue或silent */
  public behavior: SQHookBehavior;

  /** method实例 */
  public entity: Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>;

  /** 重试错误规则 */
  public retryError?: RetryError;

  /** 重试次数 */
  public maxRetryTimes?: MaxRetryTimes;

  /** 避让策略 */
  public backoff?: BackoffPolicy;

  /** 回退事件回调，当重试次数达到上限但仍然失败时，此回调将被调用 */
  public fallbackHandlers?: FallbackHandler<
    State,
    Computed,
    Watched,
    Export,
    Responded,
    Transformed,
    RequestConfig,
    Response,
    ResponseHeader
  >[];

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
  public targetRefMethod?: Method;

  /** 调用updateStateEffect更新了哪些状态 */
  public updateStates?: string[];

  /** 重试回调函数 */
  public retryHandlers?: RetryHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>[];

  /** 当前是否正在请求中 */
  public active?: boolean;

  /** 是否强制 */
  public force: boolean;

  constructor(
    entity: Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
    behavior: SQHookBehavior,
    id = uuid(),
    force?: boolean,
    retryError?: RetryError,
    maxRetryTimes?: MaxRetryTimes,
    backoff?: BackoffPolicy,
    fallbackHandlers?: FallbackHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>[],
    resolveHandler?: PromiseExecuteParameter['0'],
    rejectHandler?: PromiseExecuteParameter['1'],
    handlerArgs?: any[],
    vDatas?: string[],
    retryHandlers?: RetryHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>[]
  ) {
    const thisObj = this;
    thisObj.entity = entity;
    thisObj.behavior = behavior;
    thisObj.id = id;
    thisObj.force = !!force;
    thisObj.retryError = retryError;
    thisObj.maxRetryTimes = maxRetryTimes;
    thisObj.backoff = backoff;
    thisObj.fallbackHandlers = fallbackHandlers;
    thisObj.resolveHandler = resolveHandler;
    thisObj.rejectHandler = rejectHandler;
    thisObj.handlerArgs = handlerArgs;
    thisObj.vDatas = vDatas;
    thisObj.retryHandlers = retryHandlers;
  }

  /**
   * 允许缓存时持久化更新当前实例
   */
  public save() {
    this.cache && persistSilentMethod(this);
  }

  /**
   * 在队列中使用一个新的silentMethod实例替换当前实例
   * 如果有持久化缓存也将会更新缓存
   * @param newSilentMethod 新的silentMethod实例
   */
  public replace(
    newSilentMethod: SilentMethod<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
  ) {
    const targetSilentMethod = this;
    silentAssert(newSilentMethod.cache === targetSilentMethod.cache, 'the cache of new silentMethod must equal with this silentMethod');
    const [queue, queueName, position] = getBelongQueuePosition(targetSilentMethod);
    if (queue) {
      splice(queue, position, 1, newSilentMethod);
      targetSilentMethod.cache && spliceStorageSilentMethod(queueName, targetSilentMethod.id, newSilentMethod);
    }
  }

  /**
   * 移除当前实例，如果有持久化数据，也会同步移除
   */
  public remove() {
    const targetSilentMethod = this;
    const [queue, queueName, position] = getBelongQueuePosition(targetSilentMethod);
    if (queue) {
      splice(queue, position, 1);
      targetSilentMethod.cache && spliceStorageSilentMethod(queueName, targetSilentMethod.id);
    }
  }

  /**
   * 设置延迟更新状态对应的method实例以及对应的状态名
   * 它将在此silentMethod响应后，找到对应的状态数据并将vData更新为实际数据
   *
   * @param matcher method实例匹配器
   * @param updateStateName 更新的状态名，默认为data，也可以设置多个
   */
  public setUpdateState(matcher: Method, updateStateName: string | string[] = 'data') {
    const methodInstance = instanceOf(matcher, Method) ? matcher : getContext(this.entity).snapshots.match(matcher, falseValue);
    if (methodInstance) {
      this.targetRefMethod = methodInstance;
      this.updateStates = isArray(updateStateName) ? (updateStateName as string[]) : [updateStateName as string];
    }
  }
}

type MethodEntityPayload = Omit<Method<any, any, any, any, any, any, any>, 'context' | 'response' | 'send'>;
export type SerializedSilentMethod = SilentMethodInterface & {
  entity: MethodEntityPayload;
  targetRefMethod?: MethodEntityPayload;
};
