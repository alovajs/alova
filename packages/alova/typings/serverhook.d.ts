/**
  * @alova/server 1.0.0-beta.3 (https://alova.js.org)
  * Document https://alova.js.org
  * Copyright 2024 Scott hu. All Rights Reserved
  * Licensed under MIT (https://github.com/alovajs/alova/blob/main/LICENSE)
*/

import * as alova from 'alova';
import { AlovaGenerics, Method, ProgressHandler, AlovaGlobalCacheAdapter } from 'alova';
import { RateLimiterRes, IRateLimiterStoreOptions } from 'rate-limiter-flexible';
import RateLimiterStoreAbstract from 'rate-limiter-flexible/lib/RateLimiterStoreAbstract.js';
import { BackoffPolicy } from '@alova/shared/types';

type RequestHandler<Responded> = (forceRequest?: boolean) => Promise<Responded>;
declare class HookedMethod<AG extends AlovaGenerics = any> implements Method<AG> {
    private entity;
    private handler;
    constructor(entity: Method<AG>, requestHandler: RequestHandler<AG['Responded']>);
    generateKey(): string;
    get type(): alova.MethodType;
    get config(): alova.MethodRequestConfig & {
        name?: string | number | undefined;
        timeout?: number | undefined;
        cacheFor?: alova.CacheConfig<alova.RespondedAlovaGenerics<AG, AG["Responded"], AG["Transformed"]>> | alova.CacheController<AG["Responded"]> | undefined;
        hitSource?: string | RegExp | Method<any> | (string | RegExp | Method<any>)[] | undefined;
        transform?: ((data: AG["Transformed"], headers: AG["ResponseHeader"]) => AG["Responded"] | Promise<AG["Responded"]>) | undefined;
        shareRequest?: boolean | undefined;
        meta?: any;
    } & AG["RequestConfig"];
    get baseURL(): string;
    get context(): alova.Alova<AG>;
    get url(): string;
    get data(): alova.RequestBody | undefined;
    get meta(): any;
    get hitSource(): (string | RegExp)[] | undefined;
    get key(): string;
    get abort(): alova.AbortFunction;
    get dhs(): ProgressHandler[];
    get uhs(): ProgressHandler[];
    get fromCache(): boolean | undefined;
    setName(name: string | number): void;
    send(forceRequest?: boolean): Promise<AG["Responded"]>;
    onDownload(downloadHandler: ProgressHandler): () => void;
    onUpload(uploadHandler: ProgressHandler): () => void;
    then<TResult1 = AG['Responded'], TResult2 = never>(onfulfilled?: (value: AG['Responded']) => TResult1 | PromiseLike<TResult1>, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    catch(onrejected: Parameters<Method<AG>['catch']>[0]): Promise<unknown>;
    finally(onfinally: Parameters<Method<AG>['finally']>[0]): Promise<AG["Responded"]>;
}

type StoreResult = [points: number, expireTime: number];
interface LimitHandlerOptions<AG extends AlovaGenerics> {
    /** 存储key */
    key?: string | ((method: Method<AG>) => string);
}
/**
 * 速率限制，在[duration]秒内最大只能有[points]个请求
 *
 * 使用场景：
 * 1. 请求限制，例如node作为中间层请求下游服务时，在资源消耗严重的api下，通过ip进行限制以免消耗下游服务器资源
 * 2. 防止密码暴力破解，下游服务器连续多次抛出登录错误时，通过ip或用户名进行限制
 * 3. 作为sendCaptcha的发送限制，防止用户频繁发送验证码
 */
interface RateLimitOptions {
    /**
     * duration内可消耗的最大数量
     * @default 4
     */
    points?: number;
    /**
     * 点数重置的时间，单位ms
     * @default 4000
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
     * 到达速率限制后，将延长[blockDuration]ms，例如1小时内密码错误5次，则锁定24小时，这个24小时就是此参数
     */
    blockDuration?: number;
    /**
     * 自定义的存储适配器，未设置时默认使用methodObj.context.l2Cache
     */
    storage?: AlovaGlobalCacheAdapter;
}
declare class RateLimiterStore extends RateLimiterStoreAbstract {
    protected storage: AlovaGlobalCacheAdapter;
    constructor(storage: AlovaGlobalCacheAdapter, options: IRateLimiterStoreOptions);
    /**
     * parses raw data from store to RateLimiterRes object.
     */
    _getRateLimiterRes(key: string | number, changedPoints: number, result: StoreResult): RateLimiterRes;
    _upsert(key: string | number, points: number, msDuration: number, forceExpire?: boolean): Promise<number[]>;
    /**
     * returns raw data by key or null if there is no key or expired.
     */
    _get(key: string | number): Promise<{} | null>;
    /**
     * returns true on deleted, false if key is not found.
     */
    _delete(key: string | number): Promise<boolean>;
}
/**
 * rateLimit修饰的method实例，它的扩展方法对应rate-limit-flexible中创建实例的方法，key为调用rateLimit指定的key。
 * AlovaServerHook目前只能返回未扩展的method类型，还没改为可自定义返回扩展的method类型
 */
declare class LimitedMethod<AG extends AlovaGenerics> extends HookedMethod<AG> {
    protected limiter: RateLimiterStore;
    private keyGetter;
    constructor(method: Method<AG>, limiterKey: string | ((method: Method<AG>) => string), limiter: RateLimiterStore);
    private getLimiterKey;
    /**
     * Get RateLimiterRes or null.
     */
    get(options?: {
        [key: string]: any;
    }): Promise<RateLimiterRes | null>;
    /**
     * Set points by key.
     */
    set(points: number, msDuration: number): Promise<RateLimiterRes>;
    /**
     * @param points default is 1
     */
    consume(points?: number): Promise<RateLimiterRes>;
    /**
     * Increase number of consumed points in current duration.
     * @param points default is 1
     */
    penalty(points: number): Promise<RateLimiterRes>;
    /**
     * Decrease number of consumed points in current duration.
     * @param points default is 1
     */
    reward(points: number): Promise<RateLimiterRes>;
    /**
     * Block key for ms.
     */
    block(msDuration: number): Promise<RateLimiterRes>;
    /**
     * Reset consumed points.
     */
    delete(): Promise<boolean>;
}
declare function createRateLimiter(options: RateLimitOptions): <AG extends AlovaGenerics<any, any, any, any, any, any, any, any>>(method: Method<AG>, wrapperOption?: LimitHandlerOptions<AG>) => LimitedMethod<AG>;

interface RetryOptions {
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

declare const retry: <AG extends AlovaGenerics<any, any, any, any, any, any, any, any>>(method: Method<AG>, options: RetryOptions) => HookedMethod<AG>;

export { HookedMethod, createRateLimiter, retry };
