/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventManager } from '@alova/shared/createEventManager';
import { AlovaCompleteEvent } from '@alova/shared/event';
import { AlovaGenerics, AlovaOptions, AlovaRequestAdapter, Method, StatesHook } from 'alova';
import { AlovaEvent, UseHookExposure } from '.';

/** 判断是否为any */
export type IsAny<T, P, N> = 0 extends 1 & T ? P : N;

/** 判断是否为unknown */
export type IsUnknown<T, P, N> = IsAny<T, P, N> extends P ? N : unknown extends T ? P : N;

// =========================
/** 静默提交事件 */
// 事件：
// 全局的：
//  [GlobalSQEvent]请求事件：behavior、silentMethod实例、method实例、retryTimes
//  [GlobalSQSuccessEvent]成功：behavior、silentMethod实例、method实例、retryTimes、响应数据、虚拟数据和实际值的集合
//  [GlobalSQErrorEvent]错误：behavior、silentMethod实例、method实例、retryTimes、错误对象、[?]下次重试间隔时间
//  [GlobalSQFailEvent]失败事件：behavior、silentMethod实例、method实例、retryTimes、错误对象

// 局部的：
//  [ScopedSQSuccessEvent]成功：behavior、silentMethod实例、method实例、retryTimes、send参数、响应数据
//  [ScopedSQErrorEvent]失败：behavior、silentMethod实例、method实例、retryTimes、send参数、错误对象
//  [ScopedSQErrorEvent]回退：behavior、silentMethod实例、method实例、retryTimes、send参数、错误对象
//  [ScopedSQSuccessEvent | ScopedSQErrorEvent]完成事件：behavior、silentMethod实例、method实例、retryTimes、send参数、[?]错误对象
//  [ScopedSQEvent]入队列前：behavior、silentMethod实例、method实例、send参数
//  [ScopedSQEvent]入队列后：behavior、silentMethod实例、method实例、send参数
/** SQ顶层事件 */
export interface SQEvent<AG extends AlovaGenerics> {
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
}
/** SQ全局事件 */
export interface GlobalSQEvent<AG extends AlovaGenerics> extends SQEvent<AG> {
  /**
   * 重试次数，在beforePush和pushed事件中没有值
   */
  retryTimes: number;

  /**
   * silentMethod所在的队列名
   */
  queueName: string;
}
/** SQ全局成功事件 */
export interface GlobalSQSuccessEvent<AG extends AlovaGenerics> extends GlobalSQEvent<AG> {
  /**
   * 响应数据
   */
  data: any;
  /**
   * 虚拟数据和实际值的集合
   * 里面只包含你已用到的虚拟数据的实际值
   */
  vDataResponse: Record<string, any>;
}
/** SQ全局失败事件 */
export interface GlobalSQErrorEvent<AG extends AlovaGenerics> extends GlobalSQEvent<AG> {
  /**
   * 失败时抛出的错误
   */
  error: any;

  /**
   * 下次重试间隔时间（毫秒）
   */
  retryDelay?: number;
}
/** SQ全局失败事件 */
export interface GlobalSQFailEvent<AG extends AlovaGenerics> extends GlobalSQEvent<AG> {
  /** 失败时抛出的错误 */
  error: any;
}

/** SQ局部事件 */
export interface ScopedSQEvent<AG extends AlovaGenerics> extends SQEvent<AG> {
  /**
   * 通过send触发请求时传入的参数
   */
  sendArgs: any[];
}
/** 局部成功事件 */
export interface ScopedSQSuccessEvent<AG extends AlovaGenerics> extends ScopedSQEvent<AG> {
  /**
   * 响应数据
   */
  data: AG['Responded'];
}
/** 局部失败事件 */
export interface ScopedSQErrorEvent<AG extends AlovaGenerics> extends ScopedSQEvent<AG> {
  /**
   * 失败时抛出的错误
   */
  error: any;
}
/** 局部失败事件 */
export interface ScopedSQRetryEvent<AG extends AlovaGenerics> extends ScopedSQEvent<AG> {
  /**
   * 重试次数
   */
  retryTimes: number;
  /**
   * 重试间隔时间（毫秒）
   */
  retryDelay: number;
}
/** 局部完成事件 */
export interface ScopedSQCompleteEvent<AG extends AlovaGenerics> extends ScopedSQEvent<AG> {
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
}

export interface RetryErrorDetailed {
  name?: RegExp;
  message?: RegExp;
}

export interface BackoffPolicy {
  /**
   * 再次请求的延迟时间，单位毫秒
   * @default 1000
   */
  delay?: number;
  /**
   * 指定延迟倍数，例如把multiplier设置为1.5，delay为2秒，则第一次重试为2秒，第二次为3秒，第三次为4.5秒
   * @default 0
   */
  multiplier?: number;

  /**
   * 延迟请求的抖动起始百分比值，范围为0-1
   * 当只设置了startQuiver时，endQuiver默认为1
   * 例如设置为0.5，它将在当前延迟时间上增加50%到100%的随机时间
   * 如果endQuiver有值，则延迟时间将增加startQuiver和endQuiver范围的随机值
   */
  startQuiver?: number;

  /**
   * 延迟请求的抖动结束百分比值，范围为0-1
   * 当只设置了endQuiver时，startQuiver默认为0
   * 例如设置为0.5，它将在当前延迟时间上增加0%到50%的随机时间
   * 如果startQuiver有值，则延迟时间将增加startQuiver和endQuiver范围的随机值
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
 * silentMethod实例
 * 需要进入silentQueue的请求都将被包装成silentMethod实例，它将带有请求策略的各项参数
 */
export interface SilentMethod<AG extends AlovaGenerics = AlovaGenerics> {
  /**
   * silentMethod实例id
   */
  readonly id: string;
  /**
   * 实例的行为，queue或silent
   */
  readonly behavior: SQHookBehavior;
  /**
   * method实例
   */
  readonly entity: Method<AG>;

  /**
   * 是否为持久化实例
   */
  cache: boolean;

  /**
   * 重试错误规则
   * 当错误符合以下表达式时才进行重试
   * 当值为正则表达式时，它将匹配错误对象的message
   * 当值为对象时，可设定匹配的是错误对象的name、或者message，如果两者都有设定，将以或的形式匹配
   *
   * 未设置时，默认所有错误都进行重试
   */
  readonly retryError?: RegExp | RetryErrorDetailed;
  /**
   * 重试次数
   */
  readonly maxRetryTimes?: number;
  /**
   * 避让策略
   */
  readonly backoff?: BackoffPolicy;

  /**
   * 回退事件回调，当重试次数达到上限但仍然失败时，此回调将被调用
   */
  readonly emitter: EventManager<ScopedSQEvents<AG>>;

  /**
   * Promise的resolve函数，调用将通过对应的promise对象
   */
  readonly resolveHandler?: Parameters<ConstructorParameters<typeof Promise<any>>['0']>['0'];

  /**
   * Promise的reject函数，调用将失败对应的promise对象
   */
  readonly rejectHandler?: Parameters<ConstructorParameters<typeof Promise<any>>['0']>['1'];

  /**
   * methodHandler的调用参数
   * 如果其中有虚拟数据也将在请求被响应后被实际数据替换
   */
  readonly handlerArgs?: any[];

  /**
   * method创建时所使用的虚拟数据id
   */
  readonly vDatas?: string[];

  /**
   * 虚拟响应数据，通过delayUpdateState保存到此
   */
  virtualResponse?: any;

  /**
   * 调用updateStateEffect更新了哪些状态
   */
  updateStates?: string[];

  /**
   * 静默提交状态更新数据
   * 当静默提交数据后，我们还需要将提交数据手动更新到其他状态中以达到立即展示提交信息的目的
   * 为了让更新的数据在重新加载页面后还能获取到，我们可以用此字段保存并随着silentMethod一同持久化
   * 你可以在需要使用到这些数据的地方再次获取到并展示到界面上
   *
   * 注意：一般而言，你可以以任意属性名保存持久化数据，但在typescript中会报错，因此为你指定了reviewData作为静默提交状态数据的保存属性
   */
  reviewData?: any;

  /**
   * 静默提交时的额外持久化数据
   * 当静默提交后数据真正提交前，我们可能需要访问这条新数据
   * 当提交的数据不满足界面渲染所需的数据时，我们可以在提交时将额外的数据保存到extraData字段中，保证下次可以获取到它
   *
   * 注意：一般而言，你可以以任意属性名保存持久化数据，但在typescript中会报错，因此为你指定了extraData作为以上作用的字段
   */
  extraData?: any;

  /**
   * 状态更新所指向的method实例
   * 当调用updateStateEffect时将会更新状态的目标method实例保存在此
   * 目的是为了让刷新页面后，提交数据也还能找到需要更新的状态
   */
  targetRefMethod?: Method<AG>;

  /** 当前是否正在请求中 */
  active?: boolean;

  /** 是否强制请求 */
  force: boolean;

  /**
   * 允许缓存时持久化更新当前实例
   */
  save(): Promise<void>;

  /**
   * 在队列中使用一个新的silentMethod实例替换当前实例
   * 如果有持久化缓存也将会更新缓存
   * @param newSilentMethod 新的silentMethod实例
   */
  replace(newSilentMethod: SilentMethod<AG>): Promise<void>;

  /**
   * 移除当前实例，它将在持久化存储中同步移除
   */
  remove(): Promise<void>;

  /**
   * 设置延迟更新状态对应的method实例以及对应的状态名
   * 它将在此silentMethod响应后，找到对应的状态数据并将vData更新为实际数据
   *
   * @param matcher method实例匹配器
   * @param updateStateName 更新的状态名，默认为data，也可以设置多个
   */
  setUpdateState(matcher: Method<AG>, updateStateName?: string | string[]): void;
}

// 静默队列hooks相关
export type SQHookBehavior = 'static' | 'queue' | 'silent';
export interface SQHookConfig<AG extends AlovaGenerics> {
  /**
   * hook行为，可选值为silent、queue、static，默认为queue
   * 可以设置为可选值，或一个带返回可选值的回调函数
   * silent：静默提交，方法实例会进入队列并持久化，然后立即触发onSuccess
   * queue: 队列请求，方法实例会进入队列但不持久化，onSuccess、onError正常触发
   * static：静态请求，和普通的useRequest一样
   *
   * 场景1. 手动开关
   * 场景2. 网络状态不好时回退到static，网络状态自行判断
   */
  behavior?: SQHookBehavior | ((event: AlovaEvent<AG>) => SQHookBehavior);

  /** 重试错误规则
   * 当错误符合以下表达式时才进行重试
   * 当值为正则表达式时，它将匹配错误对象的message
   * 当值为对象时，可设定匹配的是错误对象的name、或者message，如果两者都有设定，将以或的形式匹配
   */
  retryError?: NonNullable<SilentMethod['retryError']>;

  /** 重试最大次数 */
  maxRetryTimes?: NonNullable<SilentMethod['maxRetryTimes']>;

  /** 避让策略 */
  backoff?: NonNullable<SilentMethod['backoff']>;

  /**
   * 队列名，不传时选择默认队列
   * 如需每次请求动态分配队列，可设为函数并返回队列名称
   */
  queue?: string | ((event: AlovaEvent<AG>) => string);

  /** 静默提交时默认的响应数据 */
  silentDefaultResponse?: () => any;

  /**
   * 它将在捕获到method中带有虚拟数据时调用
   * 当此捕获回调返回了数据时将会以此数据作为响应数据处理，而不再发送请求
   * @param {Method} method method实例
   * @returns {R} 与响应数据相同格式的数据
   */
  vDataCaptured?: (method: Method<AG>) => AG['Response'] | undefined | void;
}

export type FallbackHandler<AG extends AlovaGenerics> = (event: ScopedSQEvent<AG>) => void;
export type RetryHandler<AG extends AlovaGenerics> = (event: ScopedSQRetryEvent<AG>) => void;
export type BeforePushQueueHandler<AG extends AlovaGenerics> = (event: ScopedSQEvent<AG>) => void;
export type PushedQueueHandler<AG extends AlovaGenerics> = (event: ScopedSQEvent<AG>) => void;
export type SQHookExposure<AG extends AlovaGenerics> = Pick<
  UseHookExposure<AG>,
  'loading' | 'data' | 'error' | 'downloading' | 'uploading' | 'abort' | 'update' | 'send'
> & {
  /**
   * 回退事件绑定函数，它将在以下情况触发：
   * 1. 重试指定次数都无响应而停止继续请求后
   * 2. 因断网、服务端相应错误而停止请求后
   *
   * 绑定此事件后，请求持久化将失效，这意味着刷新即丢失静默提交的项
   * 它只在silent行为下有效
   *
   * 和onComplete事件对比：
   * 1. 只在重试次数达到后仍然失败时触发
   * 2. 在onComplete之前触发
   */
  onFallback: (handler: FallbackHandler<AG>) => void;

  /** 在入队列前调用，在此可以过滤队列中重复的SilentMethod，在static行为下无效 */
  onBeforePushQueue: (handler: BeforePushQueueHandler<AG>) => boolean | void;

  /** 在入队列后调用，在static行为下无效 */
  onPushedQueue: (handler: PushedQueueHandler<AG>) => void;

  /** 重试事件绑定 */
  onRetry: (handler: RetryHandler<AG>) => void;

  /** @override 重写alova的onSuccess事件 */
  onSuccess: (handler: (event: ScopedSQSuccessEvent<AG>) => void) => void;

  /** @override 重写alova的onError事件 */
  onError: (handler: (event: ScopedSQErrorEvent<AG>) => void) => void;

  /** @override 重写alova的onComplete事件 */
  onComplete: (handler: (event: ScopedSQCompleteEvent<AG>) => void) => void;
};

export interface DataSerializer {
  forward: (data: any) => any | undefined | void;
  backward: (data: any) => any | undefined | void;
}

export interface QueueRequestWaitSetting {
  queue: string | RegExp;
  wait: number | ((silentMethod: SilentMethod, queueName: string) => number | undefined);
}

export type OffEventCallback = () => void;
export type SilentQueueMap = Record<string, SilentMethod<any>[]>;

export type ExportedType<T, S> = {};

export type RestoreHandler = () => void;

// middlewares
export interface Actions {
  [x: string]: (...args: any[]) => any;
}
export type MetaMatches = Record<string, any>;
export type ResponseInterceptHandler<RA extends AlovaRequestAdapter<any, any, any>, RESULT = Promise<void>> = (
  response: ReturnType<ReturnType<RA>['response']> extends Promise<infer RE> ? RE : never,
  method: Parameters<RA>[1]
) => RESULT;
export type ResponseErrorInterceptHandler<RA extends AlovaRequestAdapter<any, any, any>, RESULT = Promise<void>> = (
  error: any,
  method: Parameters<RA>[1]
) => RESULT;
export type ResponseAuthorizationInterceptor<RA extends AlovaRequestAdapter<any, any, any>> =
  | ResponseInterceptHandler<RA, void | Promise<void>>
  | {
      metaMatches?: MetaMatches;
      handler: ResponseInterceptHandler<RA, void | Promise<void>>;
    };

export type RequestHandler<RA extends AlovaRequestAdapter<any, any, any>, RESULT = Promise<void>> = (
  method: Parameters<RA>[1]
) => RESULT;

export interface TokenAuthenticationOptions<RA extends AlovaRequestAdapter<any, any, any>> {
  /**
   * 忽略拦截的method
   */
  visitorMeta?: MetaMatches;
  /**
   * 登录请求拦截器
   */
  login?: ResponseAuthorizationInterceptor<RA>;

  /**
   * 登出请求拦截器
   */
  logout?: ResponseAuthorizationInterceptor<RA>;
  /**
   * 赋值token回调函数，登录标识和访客标识的请求不会触发此函数
   * @param method method实例
   */
  assignToken?: <AG extends AlovaGenerics>(method: Method<AG>) => void | Promise<void>;
}
export interface ClientTokenAuthenticationOptions<RA extends AlovaRequestAdapter<unknown, unknown, unknown>>
  extends TokenAuthenticationOptions<RA> {
  /**
   * 在请求前的拦截器中判断token是否过期，并刷新token
   */
  refreshToken?: {
    /**
     * 判断token是否过期
     */
    isExpired: RequestHandler<RA, boolean | Promise<boolean>>;
    /**
     * 刷新token
     */
    handler: RequestHandler<RA>;
    /**
     * 自定义匹配刷新token的method meta
     */
    metaMatches?: MetaMatches;
  };
}

export type BeforeRequestType<AG extends AlovaGenerics> = (
  originalBeforeRequest?: AlovaOptions<AG>['beforeRequest']
) => AlovaOptions<AG>['beforeRequest'];
export type ResponseType<AG extends AlovaGenerics> = (
  originalResponded?: AlovaOptions<AG>['responded']
) => AlovaOptions<AG>['responded'];

export interface ServerTokenAuthenticationOptions<RA extends AlovaRequestAdapter<any, any, any>>
  extends TokenAuthenticationOptions<RA> {
  /**
   * 在请求成功拦截器中判断token是否过期，并刷新token
   */
  refreshTokenOnSuccess?: {
    /**
     * 判断token是否过期
     */
    isExpired: ResponseInterceptHandler<RA, boolean | Promise<boolean>>;
    /**
     * 刷新token
     */
    handler: ResponseInterceptHandler<RA>;
    /**
     * 自定义匹配刷新token的method meta
     */
    metaMatches?: MetaMatches;
  };

  /**
   * 在请求失败拦截器中判断token是否过期，并刷新token
   */
  refreshTokenOnError?: {
    /**
     * 判断token是否过期
     */
    isExpired: ResponseErrorInterceptHandler<RA, boolean | Promise<boolean>>;
    /**
     * 刷新token
     */
    handler: ResponseErrorInterceptHandler<RA>;
    /**
     * 自定义匹配刷新token的method meta
     */
    metaMatches?: MetaMatches;
  };
}

export type AlovaResponded<
  SH extends StatesHook<any, any>,
  RA extends AlovaRequestAdapter<any, any, any>
> = NonNullable<
  AlovaOptions<
    ReturnType<SH['create']>,
    ReturnType<SH['export']>,
    Parameters<RA>[1] extends Method<any, any, any, any, infer RC> ? RC : never,
    Parameters<RA>[1] extends Method<any, any, any, any, any, infer RE> ? RE : never,
    Parameters<RA>[1] extends Method<any, any, any, any, any, any, infer RH> ? RH : never
  >['responded']
>;

/**
 * 统一获取AlovaRequestAdapter的类型
 */
export type AlovaRequestAdapterUnified<
  RA extends
    | AlovaRequestAdapter<any, any, any>
    | ((...args: any[]) => AlovaRequestAdapter<any, any, any>) = AlovaRequestAdapter<any, any, any>
> = RA extends AlovaRequestAdapter<any, any, any> ? RA : ReturnType<RA>;

export type NotifyHandler = () => void;
export type UnbindHandler = () => void;

export type AnyFn<T = Any> = (...args: any[]) => T;
