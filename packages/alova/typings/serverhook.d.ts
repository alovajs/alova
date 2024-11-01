/**
  * @alova/server 1.0.0 (https://alova.js.org)
  * Document https://alova.js.org
  * Copyright 2024 Scott hu. All Rights Reserved
  * Licensed under MIT (git://github.com/alovajs/alova/blob/main/LICENSE)
*/

import { AlovaGenerics, Method, AlovaGlobalCacheAdapter } from 'alova';
import { RateLimiterRes, IRateLimiterStoreOptions } from 'rate-limiter-flexible';
import RateLimiterStoreAbstract from 'rate-limiter-flexible/lib/RateLimiterStoreAbstract.js';
import { BackoffPolicy } from '@alova/shared';

type RequestHandler<Responded> = (forceRequest?: boolean) => Promise<Responded>;
declare class HookedMethod<AG extends AlovaGenerics> extends Method<AG> {
    private handler;
    constructor(entity: Method<AG>, requestHandler: RequestHandler<AG['Responded']>);
    send(forceRequest?: boolean): Promise<AG["Responded"]>;
}

type StoreResult = [points: number, expireTime: number];
interface LimitHandlerOptions<AG extends AlovaGenerics> {
    /** storage key */
    key?: string | ((method: Method<AG>) => string);
}
/**
 * Rate limit, there can only be a maximum of [points] requests within [duration] seconds
 *
 * Usage scenarios:
 * 1. Request restrictions. For example, when node acts as an intermediate layer to request downstream services, under an API with serious resource consumption, it is restricted through IP to avoid consuming downstream server resources.
 * 2. Prevent password brute force cracking. When the downstream server throws login errors multiple times in a row, restrict it by IP or user name.
 * 3. As a sending limit for sendCaptcha, it prevents users from frequently sending verification codes.
 */
interface RateLimitOptions {
    /**
     * The maximum quantity that can be consumed within the duration
     * @default 4
     */
    points?: number;
    /**
     * Points reset time, unit ms
     * @default 4000
     */
    duration?: number;
    /**
     * Namespace, prevents conflicts when multiple limiters use the same storage medium
     */
    keyPrefix?: string;
    /**
     * The following two parameters are consumption interval control
     * */
    execEvenly?: boolean;
    execEvenlyMinDelayMs?: number;
    /**
     * After reaching the rate limit, [blockDuration]ms will be extended. For example, if the password is incorrect 5 times within 1 hour, it will be locked for 24 hours. This 24 hours is this parameter.
     */
    blockDuration?: number;
    /**
     * Custom storage adapter, defaults to methodObj.context.l2Cache if not set
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
 * The method instance modified by rateLimit, its extension method corresponds to the method of creating an instance in rate-limit-flexible, and the key is the key specified by calling rateLimit.
 * AlovaServerHook can currently only return unextended method types. It has not been changed to customizable returned extended method types.
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
     * @param points penalty points
     */
    penalty(points: number): Promise<RateLimiterRes>;
    /**
     * Decrease number of consumed points in current duration.
     * @param points reward points
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
declare function createRateLimiter(options?: RateLimitOptions): <AG extends AlovaGenerics>(method: Method<AG>, handlerOptions?: LimitHandlerOptions<AG>) => LimitedMethod<AG>;

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
declare const retry: <AG extends AlovaGenerics>(method: Method<AG>, options?: RetryOptions) => HookedMethod<AG>;

export { HookedMethod, createRateLimiter, retry };
