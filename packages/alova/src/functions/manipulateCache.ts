import { usingL1CacheAdapters, usingL2CacheAdapters } from '@/alova';
import { globalConfigMap } from '@/globalConfig';
import {
  clearWithCacheAdapter,
  getWithCacheAdapter,
  hitTargetCacheWithCacheAdapter,
  removeWithCacheAdapter,
  setWithCacheAdapter
} from '@/storage/cacheWrapper';
import { getConfig, getContext, getLocalCacheConfigParam, getMethodInternalKey, getTime, isFn } from '@alova/shared/function';
import { PromiseCls, isArray, len, mapItem, undefinedValue } from '@alova/shared/vars';
import { CacheController, CacheQueryOptions, CacheSetOptions, Method } from '~/typings';

/*
 * 以下三个函数中的matcher为Method实例匹配器，它分为3种情况：
 * 1. 如果matcher为Method实例，则清空该Method实例缓存
 * 2. 如果matcher为字符串或正则，则清空所有符合条件的Method实例缓存
 * 3. 如果未传入matcher，则会清空所有缓存
 */

/**
 * 查询缓存
 * @param matcher Method实例匹配器
 * @returns 缓存数据，未查到时返回undefined
 */
export const queryCache = async <Responded>(matcher: Method<any, any, any, any, Responded>, { policy = 'all' }: CacheQueryOptions = {}) => {
  // if __key__ exists, that means it's a method instance.
  if (matcher && matcher.__key__) {
    const { id, l1Cache, l2Cache } = getContext(matcher);
    const methodKey = getMethodInternalKey(matcher);
    const { f: cacheFor, c: controlled, s: store, e: expireMilliseconds, t: tag } = getLocalCacheConfigParam(matcher);
    // if it's controlled cache, it will return the result of cacheFor function.
    if (controlled) {
      return (cacheFor as CacheController<Responded>)();
    }

    let cachedData: Responded | undefined = policy !== 'l2' ? await getWithCacheAdapter(id, methodKey, l1Cache) : undefinedValue;
    if (policy === 'l2') {
      cachedData = await getWithCacheAdapter(id, methodKey, l2Cache, tag);
    } else if (policy === 'all' && !cachedData) {
      if (store && expireMilliseconds > getTime()) {
        cachedData = await getWithCacheAdapter(id, methodKey, l2Cache, tag);
      }
    }
    return cachedData;
  }
};

/**
 * 手动设置缓存响应数据，如果对应的methodInstance设置了持久化存储，则还会去检出持久化存储中的缓存
 * @param matcher Method实例匹配器
 * @param data 缓存数据
 */
export const setCache = async <Responded>(
  matcher: Method<any, any, any, any, Responded> | Method<any, any, any, any, Responded>[],
  dataOrUpdater: Responded | ((oldCache?: Responded) => Responded | undefined | void),
  { policy = 'all' }: CacheSetOptions = {}
) => {
  const methodInstances = isArray(matcher) ? matcher : [matcher];
  const batchPromises = methodInstances.map(async methodInstance => {
    const { hitSource } = methodInstance;
    const { id, l1Cache, l2Cache } = getContext(methodInstance);
    const methodKey = getMethodInternalKey(methodInstance);
    const { e: expireMilliseconds, s: toStore, t: tag, c: controlled } = getLocalCacheConfigParam(methodInstance);
    // don't set cache when it's controlled cache.
    if (controlled) {
      return;
    }
    let data: any = dataOrUpdater;
    if (isFn(dataOrUpdater)) {
      let cachedData = policy !== 'l2' ? await getWithCacheAdapter(id, methodKey, l1Cache) : undefinedValue;
      if (policy === 'l2' || (policy === 'all' && !cachedData && toStore && expireMilliseconds > getTime())) {
        cachedData = await getWithCacheAdapter(id, methodKey, l2Cache, tag);
      }
      data = dataOrUpdater(cachedData);
      if (data === undefinedValue) {
        return;
      }
    }
    return PromiseCls.all([
      policy !== 'l2' && setWithCacheAdapter(id, methodKey, data, expireMilliseconds, l1Cache, hitSource),
      policy === 'l2' || (policy === 'all' && toStore)
        ? setWithCacheAdapter(id, methodKey, data, expireMilliseconds, l2Cache, hitSource, tag)
        : undefinedValue
    ]);
  });
  return PromiseCls.all(batchPromises);
};

/**
 * 失效缓存
 * @param matcher Method实例匹配器
 */
export const invalidateCache = async (matcher?: Method | Method[]) => {
  if (!matcher) {
    await PromiseCls.all([clearWithCacheAdapter(usingL1CacheAdapters), clearWithCacheAdapter(usingL2CacheAdapters)]);
    return;
  }
  const methodInstances = isArray(matcher) ? matcher : [matcher];
  const batchPromises = methodInstances.map(methodInstance => {
    const { id, l1Cache, l2Cache } = getContext(methodInstance);
    const { c: controlled } = getLocalCacheConfigParam(methodInstance);
    // don't invalidate cache when it's controlled cache.
    if (controlled) {
      return;
    }
    const methodKey = getMethodInternalKey(methodInstance);
    return PromiseCls.all([removeWithCacheAdapter(id, methodKey, l1Cache), removeWithCacheAdapter(id, methodKey, l2Cache)]);
  });
  await PromiseCls.all(batchPromises);
};

/**
 * hit(invalidate) target caches by source method
 * this is the implementation of auto invalidate cache
 * @param sourceMethod source method instance
 */
export const hitCacheBySource = async (sourceMethod: Method) => {
  // 查找hit target cache，让它的缓存失效
  // 通过全局配置`autoHitCache`来控制自动缓存失效范围
  const { autoHitCache } = globalConfigMap;
  const { l1Cache, l2Cache } = getContext(sourceMethod);
  const sourceKey = getMethodInternalKey(sourceMethod);
  const { name: sourceName } = getConfig(sourceMethod);
  const cacheAdaptersInvolved = {
    global: [...usingL1CacheAdapters, ...usingL2CacheAdapters],
    self: [l1Cache, l2Cache],
    close: []
  }[autoHitCache];
  if (cacheAdaptersInvolved && len(cacheAdaptersInvolved)) {
    await PromiseCls.all(
      mapItem(cacheAdaptersInvolved, involvedCacheAdapter => hitTargetCacheWithCacheAdapter(sourceKey, sourceName, involvedCacheAdapter))
    );
  }
};
