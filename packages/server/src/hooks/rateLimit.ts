import HookedMethod from '@/HookedMethod';
import { createServerHook } from '@/helper';
import { createAssert, getOptions, isFn, uuid } from '@alova/shared';
import { AlovaGenerics, AlovaGlobalCacheAdapter, Method } from 'alova';
import { IRateLimiterStoreOptions, RateLimiterRes } from 'rate-limiter-flexible';
import RateLimiterStoreAbstract from 'rate-limiter-flexible/lib/RateLimiterStoreAbstract.js';

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
export interface RateLimitOptions {
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

const assert: ReturnType<typeof createAssert> = createAssert('RateLimit');

class RateLimiterStore extends RateLimiterStoreAbstract {
  constructor(
    protected storage: AlovaGlobalCacheAdapter,
    options: IRateLimiterStoreOptions
  ) {
    super(options);
  }

  /**
   * parses raw data from store to RateLimiterRes object.
   */
  _getRateLimiterRes(key: string | number, changedPoints: number, result: StoreResult) {
    const [consumed = 0, expireTime = 0] = result ?? [];
    const msBeforeNext = expireTime > 0 ? Math.max(expireTime - Date.now(), 0) : -1;
    const isFirstInDuration = !consumed || changedPoints === consumed;
    const currentConsumedPoints = isFirstInDuration ? changedPoints : consumed;

    const res = new RateLimiterRes(
      Math.max(0, this.points - currentConsumedPoints),
      msBeforeNext,
      isFirstInDuration ? changedPoints : consumed,
      isFirstInDuration
    );

    return res;
  }

  async _upsert(key: string | number, points: number, msDuration: number, forceExpire = false) {
    key = key.toString();
    const isNeverExpired = msDuration <= 0;
    const expireTime = isNeverExpired ? -1 : Date.now() + msDuration;
    const newRecord = [points, expireTime];
    if (!forceExpire) {
      const [oldPoints = 0, oldExpireTime = 0] = ((await this.storage.get(key)) ?? []) as StoreResult;

      // if haven't expired yet
      if (isNeverExpired || (!isNeverExpired && oldExpireTime > Date.now())) {
        newRecord[0] += oldPoints;
      }

      if (!isNeverExpired && oldExpireTime > Date.now()) {
        newRecord[1] = oldExpireTime;
      }
    }

    await this.storage.set(key.toString(), newRecord);

    // need to return the record after upsert
    return newRecord;
  }

  /**
   * returns raw data by key or null if there is no key or expired.
   */
  async _get(key: string | number) {
    return Promise.resolve(this.storage.get(key.toString())).then(res => {
      if (!res) {
        return null;
      }

      const [, expireTime] = res as StoreResult;

      // if have expire time and it has expired
      if (expireTime > 0 && expireTime <= Date.now()) {
        return null;
      }

      return res;
    });
  }

  /**
   * returns true on deleted, false if key is not found.
   */
  async _delete(key: string | number) {
    try {
      await this.storage.remove(key.toString());
    } catch {
      return false;
    }

    return true;
  }
}

/**
 * The method instance modified by rateLimit, its extension method corresponds to the method of creating an instance in rate-limit-flexible, and the key is the key specified by calling rateLimit.
 * AlovaServerHook can currently only return unextended method types. It has not been changed to customizable returned extended method types.
 */
export class LimitedMethod<AG extends AlovaGenerics> extends HookedMethod<AG> {
  private keyGetter: () => string;

  constructor(
    method: Method<AG>,
    limiterKey: string | ((method: Method<AG>) => string),
    protected limiter: RateLimiterStore
  ) {
    super(method, force => this.consume().then(() => method.send(force)));
    this.keyGetter = isFn(limiterKey) ? () => limiterKey(method) : () => limiterKey;
  }

  private getLimiterKey() {
    return this.keyGetter();
  }

  /**
   * Get RateLimiterRes or null.
   */
  get(options?: { [key: string]: any }) {
    return this.limiter.get(this.getLimiterKey(), options);
  }

  /**
   * Set points by key.
   */
  set(points: number, msDuration: number) {
    return this.limiter.set(this.getLimiterKey(), points, msDuration / 1000);
  }

  /**
   * @param points default is 1
   */
  consume(points?: number) {
    return this.limiter.consume(this.getLimiterKey(), points);
  }

  /**
   * Increase number of consumed points in current duration.
   * @param points penalty points
   */
  penalty(points: number) {
    return this.limiter.penalty(this.getLimiterKey(), points);
  }

  /**
   * Decrease number of consumed points in current duration.
   * @param points reward points
   */
  reward(points: number) {
    return this.limiter.reward(this.getLimiterKey(), points);
  }

  /**
   * Block key for ms.
   */
  block(msDuration: number) {
    return this.limiter.block(this.getLimiterKey(), msDuration / 1000);
  }

  /**
   * Reset consumed points.
   */
  delete() {
    return this.limiter.delete(this.getLimiterKey());
  }
}

export function createRateLimiter(options: RateLimitOptions = {}) {
  const { points = 4, duration = 4 * 1000, keyPrefix, execEvenly, execEvenlyMinDelayMs, blockDuration } = options;

  const limitedMethodWrapper = createServerHook(
    <AG extends AlovaGenerics>(method: Method<AG>, handlerOptions: LimitHandlerOptions<AG> = {}) => {
      const { key = uuid() } = handlerOptions;
      const storage = options.storage ?? getOptions(method).l2Cache;

      assert(!!storage, 'storage is not define');
      const limiter = new RateLimiterStore(storage!, {
        points,
        duration: Math.floor(duration / 1000),
        keyPrefix,
        execEvenly,
        execEvenlyMinDelayMs,
        blockDuration: blockDuration ? Math.floor(blockDuration / 1000) : blockDuration,
        storeClient: {}
      });

      return new LimitedMethod<AG>(method, key, limiter);
    }
  );

  return limitedMethodWrapper;
}

export default createRateLimiter;
