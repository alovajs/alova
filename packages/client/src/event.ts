import { AlovaGenerics, Method } from 'alova';
import {
  AlovaEvent,
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
} from '~/typings/clienthook';

// base event
export class AlovaEventBase<AG extends AlovaGenerics, Args extends any[]> implements AlovaEvent<AG, Args> {
  readonly args: [...Args, ...any[]];

  readonly method: Method<AG>;

  constructor(method: Method<AG>, args: [...Args, ...any[]]) {
    this.method = method;
    this.args = args;
  }

  clone() {
    return { ...this };
  }

  static spawn<AG extends AlovaGenerics, Args extends any[]>(method: Method<AG>, args: [...Args, ...any[]]) {
    return new AlovaEventBase<AG, Args>(method, args);
  }
}

export class AlovaSuccessEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaEventBase<AG, Args> {
  readonly fromCache: boolean;

  readonly data: AG['Responded'];

  constructor(base: AlovaEventBase<AG, Args>, data: AG['Responded'], fromCache: boolean) {
    super(base.method, base.args);
    this.data = data;
    this.fromCache = fromCache;
  }
}

export class AlovaErrorEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaEventBase<AG, Args> {
  readonly error: any;

  constructor(base: AlovaEventBase<AG, Args>, error: any) {
    super(base.method, base.args);
    this.error = error;
  }
}

export class AlovaCompleteEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaEventBase<AG, Args> {
  /** response status */
  status: 'success' | 'error';

  /** Whether the Data data comes from the cache, when the status is error, from cache is always false */
  readonly fromCache: boolean;

  readonly data: AG['Responded'];

  readonly error: any;

  constructor(
    base: AlovaEventBase<AG, Args>,
    status: 'success' | 'error',
    data: AG['Responded'],
    fromCache: boolean,
    error: any
  ) {
    super(base.method, base.args);
    this.status = status;
    this.data = data;
    this.fromCache = status === 'error' ? false : fromCache;
    this.error = error;
  }
}

// extend event
export class AlovaSSEEvent<AG extends AlovaGenerics, Args extends any[] = any[]> extends AlovaEventBase<AG, Args> {
  eventSource: EventSource; // EventSource instance

  constructor(base: AlovaEventBase<AG, Args>, eventSource: EventSource) {
    super(base.method, base.args);
    this.eventSource = eventSource;
  }
}

export class AlovaSSEErrorEvent<AG extends AlovaGenerics, Args extends any[] = any[]> extends AlovaSSEEvent<AG, Args> {
  error: Error; // error object

  constructor(base: AlovaSSEEvent<AG, Args>, error: Error) {
    super(base, base.eventSource);
    this.error = error;
  }
}

export class AlovaSSEMessageEvent<AG extends AlovaGenerics, Data, Args extends any[] = any[]> extends AlovaSSEEvent<
  AG,
  Args
> {
  data: Data; // Data converted by the interceptor for each response

  constructor(base: AlovaSSEEvent<AG, Args>, data: Data) {
    super(base, base.eventSource);
    this.data = data;
  }
}

/** Sq top level events */
export class SQEvent<AG extends AlovaGenerics> implements ISQEvent<AG> {
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

  constructor(behavior: SQHookBehavior, method: Method<AG>, silentMethod?: SilentMethod<AG>) {
    this.behavior = behavior;
    this.method = method;
    this.silentMethod = silentMethod;
  }
}

/** Sq global events */
export class GlobalSQEvent<AG extends AlovaGenerics> extends SQEvent<AG> implements IGlobalSQEvent<AG> {
  // entity, behavior, silentMethodInstance, queueName, retryTimes
  /**
   * Number of retries, no value in beforePush and pushed events
   */
  retryTimes: number;

  /**
   * The queue name where silentMethod is located
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
   * response data
   */
  data: any;

  /**
   * A collection of dummy data and actual values
   * It only contains the actual values of the dummy data you have used.
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
   * Error thrown on failure
   */
  error: any;

  /**
   * Next retry interval (milliseconds)
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
   * Error thrown on failure
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

/** Sq event */
export class ScopedSQEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends SQEvent<AG>
  implements IScopedSQEvent<AG, Args>
{
  /**
   * The parameters passed in when triggering the request through send
   */
  args: [...Args, ...any[]];

  constructor(behavior: SQHookBehavior, method: Method<AG>, silentMethod: SilentMethod<AG>, args: [...Args, ...any[]]) {
    super(behavior, method, silentMethod);
    this.args = args;
  }
}

export class ScopedSQSuccessEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends ScopedSQEvent<AG, Args>
  implements IScopedSQSuccessEvent<AG, Args>
{
  /**
   * response data
   */
  data: AG['Responded'];

  constructor(
    behavior: SQHookBehavior,
    method: Method<AG>,
    silentMethod: SilentMethod<AG>,
    args: [...Args, ...any[]],
    data: AG['Responded']
  ) {
    super(behavior, method, silentMethod, args);
    this.data = data;
  }
}

export class ScopedSQErrorEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends ScopedSQEvent<AG, Args>
  implements IScopedSQErrorEvent<AG, Args>
{
  /**
   * Error thrown on failure
   */
  error: any;

  constructor(
    behavior: SQHookBehavior,
    method: Method<AG>,
    silentMethod: SilentMethod<AG>,
    args: [...Args, ...any[]],
    error: any
  ) {
    super(behavior, method, silentMethod, args);
    this.error = error;
  }
}

export class ScopedSQRetryEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends ScopedSQEvent<AG, Args>
  implements IScopedSQRetryEvent<AG, Args>
{
  /**
   * Number of retries
   */
  retryTimes: number;

  /**
   * Retry interval (milliseconds)
   */
  retryDelay: number;

  constructor(
    behavior: SQHookBehavior,
    method: Method<AG>,
    silentMethod: SilentMethod<AG>,
    args: [...Args, ...any[]],
    retryTimes: number,
    retryDelay: number
  ) {
    super(behavior, method, silentMethod, args);
    this.retryTimes = retryTimes;
    this.retryDelay = retryDelay;
  }
}

export class ScopedSQCompleteEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends ScopedSQEvent<AG, Args>
  implements IScopedSQCompleteEvent<AG, Args>
{
  /**
   * response status
   */
  status: AlovaCompleteEvent<AG, any>['status'];

  /**
   * response data
   */
  data?: AG['Responded'];

  /**
   * Error thrown on failure
   */
  error?: any;

  constructor(
    behavior: SQHookBehavior,
    method: Method<AG>,
    silentMethod: SilentMethod<AG>,
    args: [...Args, ...any[]],
    status: AlovaCompleteEvent<AG, any[]>['status'],
    data?: AG['Responded'],
    error?: any
  ) {
    super(behavior, method, silentMethod, args);
    this.status = status;
    this.data = data;
    this.error = error;
  }
}

export class RetriableRetryEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends AlovaEventBase<AG, Args>
  implements IRetriableRetryEvent<AG, Args>
{
  /**
   * Current number of retries
   */
  retryTimes: number;

  /**
   * Delay time for this retry
   */
  retryDelay: number;

  constructor(base: AlovaEventBase<AG, Args>, retryTimes: number, retryDelay: number) {
    super(base.method, base.args);
    this.retryTimes = retryTimes;
    this.retryDelay = retryDelay;
  }
}

export class RetriableFailEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends AlovaErrorEvent<AG, Args>
  implements IRetriableFailEvent<AG, Args>
{
  /**
   * Number of retries on failure
   */
  retryTimes: number;

  constructor(base: AlovaEventBase<AG, Args>, error: any, retryTimes: number) {
    super(base, error);
    this.retryTimes = retryTimes;
  }
}
