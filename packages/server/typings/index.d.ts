import { AlovaGenerics, Method } from 'alova';

/**
 * server hook model, it represents the type of all server hooks.
 * pass a method or hooked method instance, set the options, and return a hooked method instance.
 * you can continue decorate this method, and reach the effect of multiple server hooks combination.
 */
export interface AlovaServerHook<Options extends Record<string, any>> {
  <AG extends AlovaGenerics>(method: Method<AG>, options?: Options): Method<AG>;
}

export interface RetryOptions {
  /**
   * The maximum number of retries. it can also be set as a function that returns a boolean to dynamically determine whether to continue retry.
   * @default 3
   */
  retry?: number | ((error: Error) => boolean);

  /**
   * backoff policy
   */
  backoff?: BackoffPolicy;
}

/**
 * 速率限制，在[duration]秒内最大只能有[points]个请求
 *
 * 使用场景：
 * 1. 请求限制，例如node作为中间层请求下游服务时，在资源消耗严重的api下，通过ip进行限制以免消耗下游服务器资源
 * 2. 防止密码暴力破解，下游服务器连续多次抛出登录错误时，通过ip或用户名进行限制
 * 3. 作为sendCaptcha的发送限制，防止用户频繁发送验证码
 *
 * 实现建议：
 * 找了个库叫node-rate-limiter-flexible作为依赖，目前只发现了它可以实现自定义存储功能，这边的基础参数完全参照它的，地址：https://github.com/animir/node-rate-limiter-flexible
 * 1. 此库可实现自定义存储控制速率，这样我们的存储适配器就可以用上，继承此库的`RateLimiterAbstract`即可实现，参考https://github.com/animir/node-rate-limiter-flexible/blob/master/lib/RateLimiterMemory.js
 */
export interface RateLimitOptions {
  /**
   * duration内可消耗的最大数量
   * @default 4
   */
  points?: number;

  /**
   * 点数重置的时间，单位秒，默认4秒
   */
  duration?: number;

  /**
   * 命名空间，多个限制器使用相同存储介质时，防止冲突
   */
  keyPrefix?: string;

  /**
   * 以下两个参数为消耗间隔时间控制
   * */
  execEvenly?: boolean;
  execEvenlyMinDelayMs?: number;

  /**
   * 到达速率限制后，将延长[blockDuration]秒，例如1小时内密码错误5次，则锁定24小时，这个24小时就是此参数
   */
  blockDuration?: number;

  /**
   * 自定义的存储适配器，未设置时默认使用methodObj.context.l2Cache
   */
  storage?: AlovaGlobalStorageAdapter;
}

/**
 * rateLimit修饰的method实例，它的扩展方法对应rate-limit-flexible中创建实例的方法，key为调用rateLimit指定的key。
 * AlovaServerHook目前只能返回未扩展的method类型，还没改为可自定义返回扩展的method类型
 */
export interface LimitedMethod<AG extends AlovaGenerics> extends Method<AG> {
  get(): Promise<RateLimiterRes | null>;
  set(points: number, secDuration: number): Promise<RateLimiterRes>;
  penalty(points: number): Promise<RateLimiterRes>;
  reward(points: number): Promise<RateLimiterRes>;
  block(secDuration: number): Promise<RateLimiterRes>;
  delete(): Promise<boolean>;
}

export declare function createRateLimit(options: RateLimitOptions): AlovaServerHook<{
  /**
   * 存储key
   */
  key: string;
}>;

/**
 * retry hook
 */
export declare const retry: AlovaServerHook<RetryOptions>;
