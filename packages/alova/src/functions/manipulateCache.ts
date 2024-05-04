import { getContext, getLocalCacheConfigParam, getMethodInternalKey, isFn } from '@alova/shared/function';
import { PromiseCls, isArray, undefinedValue } from '@alova/shared/vars';
import { usingL1CacheAdapters, usingL2CacheAdapters } from '@/alova';
import {
  clearWithCacheAdapter,
  getWithCacheAdapter,
  removeWithCacheAdapter,
  setWithCacheAdapter
} from '@/storage/cacheWrapper';
import { Method } from '~/typings';

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
export const queryCache = async <Responded>(matcher: Method<any, any, any, any, Responded>) => {
  if (matcher && matcher.__key__) {
    const { id, l1Cache, l2Cache } = getContext(matcher);
    const methodKey = getMethodInternalKey(matcher);
    let cachedData = await getWithCacheAdapter(id, methodKey, l1Cache);
    cachedData = cachedData || (await getWithCacheAdapter(id, methodKey, l2Cache, getLocalCacheConfigParam(matcher).t));
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
  dataOrUpdater: Responded | ((oldCache?: Responded) => Responded | undefined | void)
) => {
  const methodInstances = isArray(matcher) ? matcher : [matcher];
  const batchPromises = methodInstances.map(async methodInstance => {
    const { id, l1Cache, l2Cache } = getContext(methodInstance);
    const methodKey = getMethodInternalKey(methodInstance);
    const { e: expireMilliseconds, s: toStorage, t: tag } = getLocalCacheConfigParam(methodInstance);
    let data: any = dataOrUpdater;
    if (isFn(dataOrUpdater)) {
      let cachedData = await getWithCacheAdapter(id, methodKey, l1Cache);
      cachedData = cachedData || (await getWithCacheAdapter(id, methodKey, l2Cache, tag));
      data = dataOrUpdater(cachedData);
      if (data === undefinedValue) {
        return;
      }
    }
    await PromiseCls.all([
      setWithCacheAdapter(id, methodKey, data, expireMilliseconds, l1Cache),
      toStorage && setWithCacheAdapter(id, methodKey, data, expireMilliseconds, l2Cache, tag)
    ]);
  });
  await PromiseCls.all(batchPromises);
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
    const methodKey = getMethodInternalKey(methodInstance);
    return PromiseCls.all([
      removeWithCacheAdapter(id, methodKey, l1Cache),
      removeWithCacheAdapter(id, methodKey, l2Cache)
    ]);
  });
  await PromiseCls.all(batchPromises);
};
