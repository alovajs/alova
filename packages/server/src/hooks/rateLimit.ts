import HookedMethod from '@/HookedMethod';
import { createServerHook } from '@/helper';
import { createAssert } from '@alova/shared/assert';
import { getOptions, isFn, uuid } from '@alova/shared/function';
import { AlovaGenerics, AlovaGlobalCacheAdapter, Method } from 'alova';
import { IRateLimiterStoreOptions, RateLimiterRes } from 'rate-limiter-flexible';
import RateLimiterStoreAbstract from 'rate-limiter-flexible/lib/RateLimiterStoreAbstract.js';

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
export interface RateLimitOptions {
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

const assert = createAssert('RateLimit');

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
    const msBeforeNext = expireTime !== -1 ? Math.max(expireTime - Date.now(), 0) : -1;
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
    const expireTime = isNeverExpired ? 0 : Date.now() + msDuration;
    const newRecord = [points, expireTime];
    if (!forceExpire) {
      const [oldPoints = 0, oldExpireTime = 0] = ((await this.storage.get(key)) ?? []) as StoreResult;

      // if haven't expired yet
      if (isNeverExpired || (!isNeverExpired && oldExpireTime > Date.now())) {
        newRecord[0] += oldPoints;
      }

      // if the old one is longer, use it
      if (!isNeverExpired && expireTime < oldExpireTime) {
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
 * rateLimit修饰的method实例，它的扩展方法对应rate-limit-flexible中创建实例的方法，key为调用rateLimit指定的key。
 * AlovaServerHook目前只能返回未扩展的method类型，还没改为可自定义返回扩展的method类型
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
   * @param points default is 1
   */
  penalty(points: number) {
    return this.limiter.penalty(this.getLimiterKey(), points);
  }

  /**
   * Decrease number of consumed points in current duration.
   * @param points default is 1
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

export function createRateLimiter(options: RateLimitOptions) {
  const {
    points = 4,
    duration = 4 * 1000,
    keyPrefix = '',
    execEvenly,
    execEvenlyMinDelayMs,
    blockDuration
  } = options ?? {};

  const limitedMethodWrapper = createServerHook(
    <AG extends AlovaGenerics>(method: Method<AG>, handlerOptions?: LimitHandlerOptions<AG>) => {
      const { key = uuid() } = handlerOptions ?? {};
      const storage = options.storage ?? getOptions(method).l2Cache;

      assert(!!storage, 'storage is not defined');
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
