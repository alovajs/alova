import { AlovaCompleteEvent, AlovaErrorEvent, AlovaEventBase } from '@alova/shared/event';
import { AlovaGenerics, Method } from 'alova';
import {
  GlobalSQErrorEvent as IGlobalSQErrorEvent,
  GlobalSQEvent as IGlobalSQEvent,
  GlobalSQFailEvent as IGlobalSQFailEvent,
  GlobalSQSuccessEvent as IGlobalSQSuccessEvent,
  RetriableFailEvent as IRetriableFailEvent,
  RetriableRetryEvent as IRetriableRetryEvent,
  SQEvent as ISQEvent,
  ScopedSQCompleteEvent as IScopedSQCompleteEvent,
  ScopedSQErrorEvent as IScopedSQErrorEvent,
  ScopedSQEvent as IScopedSQEvent,
  ScopedSQRetryEvent as IScopedSQRetryEvent,
  ScopedSQSuccessEvent as IScopedSQSuccessEvent,
  SQHookBehavior,
  SilentMethod
} from '~/typings/general';

export class AlovaSSEEvent<AG extends AlovaGenerics> extends AlovaEventBase<AG> {
  eventSource: EventSource; // eventSource实例

  constructor(base: AlovaEventBase<AG>, eventSource: EventSource) {
    super(base.method, base.sendArgs);
    this.eventSource = eventSource;
  }
}

export class AlovaSSEErrorEvent<AG extends AlovaGenerics> extends AlovaSSEEvent<AG> {
  error: Error; // 错误对象

  constructor(base: AlovaSSEEvent<AG>, error: Error) {
    super(base, base.eventSource);
    this.error = error;
  }
}

export class AlovaSSEMessageEvent<AG extends AlovaGenerics, Data> extends AlovaSSEEvent<AG> {
  data: Data; // 每次响应的，经过拦截器转换后的数据

  constructor(base: AlovaSSEEvent<AG>, data: Data) {
    super(base, base.eventSource);
    this.data = data;
  }
}

/** SQ顶层事件 */
export class SQEvent<AG extends AlovaGenerics> implements ISQEvent<AG> {
  /**
   * 事件对应的请求行为
   */
  behavior: SQHookBehavior;

  /**
   * 当前的method实例
   */
  method: Method<AG>;

  /**
   * 当前的silentMethod实例，当behavior为static时没有值
   */
  silentMethod?: SilentMethod<AG>;

  constructor(behavior: SQHookBehavior, method: Method<AG>, silentMethod?: SilentMethod<AG>) {
    this.behavior = behavior;
    this.method = method;
    this.silentMethod = silentMethod;
  }
}

/** SQ全局事件 */
export class GlobalSQEvent<AG extends AlovaGenerics> extends SQEvent<AG> implements IGlobalSQEvent<AG> {
  // entity, behavior, silentMethodInstance, queueName, retryTimes
  /**
   * 重试次数，在beforePush和pushed事件中没有值
   */
  retryTimes: number;

  /**
   * silentMethod所在的队列名
   */
  queueName: string;

  constructor(
    behavior: SQHookBehavior,
    method: Method<AG>,
    silentMethod: SilentMethod<AG>,
    queueName: string,
    retryTimes: number
  ) {
    super(behavior, method, silentMethod);
    this.queueName = queueName;
    this.retryTimes = retryTimes;
  }
}

export class GlobalSQSuccessEvent<AG extends AlovaGenerics>
  extends GlobalSQEvent<AG>
  implements IGlobalSQSuccessEvent<AG>
{
  /**
   * 响应数据
   */
  data: any;

  /**
   * 虚拟数据和实际值的集合
   * 里面只包含你已用到的虚拟数据的实际值
   */
  vDataResponse: Record<string, any>;

  constructor(
    behavior: SQHookBehavior,
    method: Method<AG>,
    silentMethod: SilentMethod<AG>,
    queueName: string,
    retryTimes: number,
    data: any,
    vDataResponse: Record<string, any>
  ) {
    super(behavior, method, silentMethod, queueName, retryTimes);
    this.data = data;
    this.vDataResponse = vDataResponse;
  }
}

export class GlobalSQErrorEvent<AG extends AlovaGenerics> extends GlobalSQEvent<AG> implements IGlobalSQErrorEvent<AG> {
  /**
   * 失败时抛出的错误
   */
  error: any;

  /**
   * 下次重试间隔时间（毫秒）
   */
  retryDelay?: number;

  constructor(
    behavior: SQHookBehavior,
    method: Method<AG>,
    silentMethod: SilentMethod<AG>,
    queueName: string,
    retryTimes: number,
    error: any,
    retryDelay?: number
  ) {
    super(behavior, method, silentMethod, queueName, retryTimes);
    this.error = error;
    this.retryDelay = retryDelay;
  }
}

export class GlobalSQFailEvent<AG extends AlovaGenerics> extends GlobalSQEvent<AG> implements IGlobalSQFailEvent<AG> {
  /**
   * 失败时抛出的错误
   */
  error: any;

  constructor(
    behavior: SQHookBehavior,
    method: Method<AG>,
    silentMethod: SilentMethod<AG>,
    queueName: string,
    retryTimes: number,
    error: any
  ) {
    super(behavior, method, silentMethod, queueName, retryTimes);
    this.error = error;
  }
}

/** SQ事件 */
export class ScopedSQEvent<AG extends AlovaGenerics> extends SQEvent<AG> implements IScopedSQEvent<AG> {
  /**
   * 通过send触发请求时传入的参数
   */
  sendArgs: any[];

  constructor(behavior: SQHookBehavior, method: Method<AG>, silentMethod: SilentMethod<AG>, sendArgs: any[]) {
    super(behavior, method, silentMethod);
    this.sendArgs = sendArgs;
  }
}

export class ScopedSQSuccessEvent<AG extends AlovaGenerics>
  extends ScopedSQEvent<AG>
  implements IScopedSQSuccessEvent<AG>
{
  /**
   * 响应数据
   */
  data: AG['Responded'];

  constructor(
    behavior: SQHookBehavior,
    method: Method<AG>,
    silentMethod: SilentMethod<AG>,
    sendArgs: any[],
    data: AG['Responded']
  ) {
    super(behavior, method, silentMethod, sendArgs);
    this.data = data;
  }
}

export class ScopedSQErrorEvent<AG extends AlovaGenerics> extends ScopedSQEvent<AG> implements IScopedSQErrorEvent<AG> {
  /**
   * 失败时抛出的错误
   */
  error: any;

  constructor(
    behavior: SQHookBehavior,
    method: Method<AG>,
    silentMethod: SilentMethod<AG>,
    sendArgs: any[],
    error: any
  ) {
    super(behavior, method, silentMethod, sendArgs);
    this.error = error;
  }
}

export class ScopedSQRetryEvent<AG extends AlovaGenerics> extends ScopedSQEvent<AG> implements IScopedSQRetryEvent<AG> {
  /**
   * 重试次数
   */
  retryTimes: number;

  /**
   * 重试间隔时间（毫秒）
   */
  retryDelay: number;

  constructor(
    behavior: SQHookBehavior,
    method: Method<AG>,
    silentMethod: SilentMethod<AG>,
    sendArgs: any[],
    retryTimes: number,
    retryDelay: number
  ) {
    super(behavior, method, silentMethod, sendArgs);
    this.retryTimes = retryTimes;
    this.retryDelay = retryDelay;
  }
}

export class ScopedSQCompleteEvent<AG extends AlovaGenerics>
  extends ScopedSQEvent<AG>
  implements IScopedSQCompleteEvent<AG>
{
  /**
   * 响应状态
   */
  status: AlovaCompleteEvent<AG>['status'];

  /**
   * 响应数据
   */
  data?: AG['Responded'];

  /**
   * 失败时抛出的错误
   */
  error?: any;

  constructor(
    behavior: SQHookBehavior,
    method: Method<AG>,
    silentMethod: SilentMethod<AG>,
    sendArgs: any[],
    status: AlovaCompleteEvent<AG>['status'],
    data?: AG['Responded'],
    error?: any
  ) {
    super(behavior, method, silentMethod, sendArgs);
    this.status = status;
    this.data = data;
    this.error = error;
  }
}

export class RetriableRetryEvent<AG extends AlovaGenerics>
  extends AlovaEventBase<AG>
  implements IRetriableRetryEvent<AG>
{
  /**
   * 当前的重试次数
   */
  retryTimes: number;

  /**
   * 本次重试的延迟时间
   */
  retryDelay: number;

  constructor(base: AlovaEventBase<AG>, retryTimes: number, retryDelay: number) {
    super(base.method, base.sendArgs);
    this.retryTimes = retryTimes;
    this.retryDelay = retryDelay;
  }
}

export class RetriableFailEvent<AG extends AlovaGenerics>
  extends AlovaErrorEvent<AG>
  implements IRetriableFailEvent<AG>
{
  /**
   * 失败时的重试次数
   */
  retryTimes: number;

  constructor(base: AlovaEventBase<AG>, error: any, retryTimes: number) {
    super(base, error);
    this.retryTimes = retryTimes;
  }
}
