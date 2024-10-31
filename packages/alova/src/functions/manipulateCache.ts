import { usingL1CacheAdapters, usingL2CacheAdapters } from '@/alova';
import { globalConfigMap } from '@/globalConfig';
import {
  clearWithCacheAdapter,
  getWithCacheAdapter,
  hitTargetCacheWithCacheAdapter,
  removeWithCacheAdapter,
  setWithCacheAdapter
} from '@/storage/cacheWrapper';
import {
  MEMORY,
  PromiseCls,
  STORAGE_RESTORE,
  getConfig,
  getContext,
  getLocalCacheConfigParam,
  getMethodInternalKey,
  getTime,
  isArray,
  isFn,
  len,
  mapItem,
  undefinedValue
} from '@alova/shared';
import { AlovaGenerics, CacheController, CacheQueryOptions, CacheSetOptions, Method } from '~/typings';

/*
 * The matchers in the following three functions are Method instance matchers, which are divided into three situations:
 * 1. If the matcher is a Method instance, clear the cache of the Method instance.
 * 2. If matcher is a string or regular expression, clear the cache of all Method instances that meet the conditions.
 * 3. If no matcher is passed in, all caches will be cleared.
 */

/**
 * Query cache
 * @param matcher Method instance matcher
 * @returns Cache data, return undefined if not found
 */
export const queryCache = async <Responded>(
  matcher: Method<AlovaGenerics<Responded>>,
  { policy = 'all' }: CacheQueryOptions = {}
) => {
  // if key exists, that means it's a method instance.
  if (matcher && matcher.key) {
    const { id, l1Cache, l2Cache } = getContext(matcher);
    const methodKey = getMethodInternalKey(matcher);
    const { f: cacheFor, c: controlled, s: store, e: expireMilliseconds, t: tag } = getLocalCacheConfigParam(matcher);
    // if it's controlled cache, it will return the result of cacheFor function.
    if (controlled) {
      return (cacheFor as CacheController<Responded>)();
    }

    let cachedData: Responded | undefined =
      policy !== 'l2' ? await getWithCacheAdapter(id, methodKey, l1Cache) : undefinedValue;
    if (policy === 'l2') {
      cachedData = await getWithCacheAdapter(id, methodKey, l2Cache, tag);
    } else if (policy === 'all' && !cachedData) {
      if (store && expireMilliseconds(STORAGE_RESTORE) > getTime()) {
        cachedData = await getWithCacheAdapter(id, methodKey, l2Cache, tag);
      }
    }
    return cachedData;
  }
};

/**
 * Manually set cache response data. If the corresponding methodInstance sets persistent storage, the cache in the persistent storage will also be checked out.
 * @param matcher Method instance matcher
 * @param data cache data
 */
export const setCache = async <Responded>(
  matcher: Method<AlovaGenerics<Responded>> | Method<AlovaGenerics<Responded>>[],
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
      if (
        policy === 'l2' ||
        (policy === 'all' && !cachedData && toStore && expireMilliseconds(STORAGE_RESTORE) > getTime())
      ) {
        cachedData = await getWithCacheAdapter(id, methodKey, l2Cache, tag);
      }
      data = dataOrUpdater(cachedData);
      if (data === undefinedValue) {
        return;
      }
    }
    return PromiseCls.all([
      policy !== 'l2' && setWithCacheAdapter(id, methodKey, data, expireMilliseconds(MEMORY), l1Cache, hitSource),
      policy === 'l2' || (policy === 'all' && toStore)
        ? setWithCacheAdapter(id, methodKey, data, expireMilliseconds(STORAGE_RESTORE), l2Cache, hitSource, tag)
        : undefinedValue
    ]);
  });
  return PromiseCls.all(batchPromises);
};

/**
 * invalid cache
 * @param matcher Method instance matcher
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
    return PromiseCls.all([
      removeWithCacheAdapter(id, methodKey, l1Cache),
      removeWithCacheAdapter(id, methodKey, l2Cache)
    ]);
  });
  await PromiseCls.all(batchPromises);
};

/**
 * hit(invalidate) target caches by source method
 * this is the implementation of auto invalidate cache
 * @param sourceMethod source method instance
 */
export const hitCacheBySource = async <AG extends AlovaGenerics>(sourceMethod: Method<AG>) => {
  // Find the hit target cache and invalidate its cache
  // Control the automatic cache invalidation range through global configuration `autoHitCache`
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
      mapItem(cacheAdaptersInvolved, involvedCacheAdapter =>
        hitTargetCacheWithCacheAdapter(sourceKey, sourceName, involvedCacheAdapter)
      )
    );
  }
};
