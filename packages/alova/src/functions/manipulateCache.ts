import { clearResponseCache, getResponseCache, removeResponseCache, setResponseCache } from '@/storage/responseCache';
import {
  clearPersistentResponse,
  getPersistentResponse,
  persistResponse,
  removePersistentResponse
} from '@/storage/responseStorage';
import { getContext, getLocalCacheConfigParam, getMethodInternalKey, isFn } from '@alova/shared/function';
import { forEach, isArray, undefinedValue } from '@alova/shared/vars';
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
export const queryCache = <R, S, E, T, RC, RE, RH>(matcher: Method<S, E, R, T, RC, RE, RH>) => {
  if (matcher && matcher.__key__) {
    const { id, storage } = getContext(matcher),
      methodKey = getMethodInternalKey(matcher);
    return (
      getResponseCache(id, methodKey) ||
      getPersistentResponse(id, methodKey, storage, getLocalCacheConfigParam(matcher).t)
    );
  }
};

/**
 * 手动设置缓存响应数据，如果对应的methodInstance设置了持久化存储，则还会去检出持久化存储中的缓存
 * @param matcher Method实例匹配器
 * @param data 缓存数据
 */
export const setCache = <R, S, E, T, RC, RE, RH>(
  matcher: Method<S, E, R, T, RC, RE, RH> | Method<S, E, R, T, RC, RE, RH>[],
  dataOrUpdater: R | ((oldCache?: R) => R | undefined | void)
) => {
  const methodInstances = isArray(matcher) ? matcher : [matcher];
  forEach(methodInstances, methodInstance => {
    const { id, storage } = getContext(methodInstance),
      methodKey = getMethodInternalKey(methodInstance),
      { e: expireMilliseconds, s: toStorage, t: tag } = getLocalCacheConfigParam(methodInstance);
    let data: any = dataOrUpdater;
    if (isFn(dataOrUpdater)) {
      const cachedData = getResponseCache(id, methodKey) || getPersistentResponse(id, methodKey, storage, tag);
      data = dataOrUpdater(cachedData);
      if (data === undefinedValue) {
        return;
      }
    }
    setResponseCache(id, methodKey, data, expireMilliseconds);
    toStorage && persistResponse(id, methodKey, data, expireMilliseconds, storage, tag);
  });
};

/**
 * 失效缓存
 * @param matcher Method实例匹配器
 */
export const invalidateCache = <S, E, R, T, RC, RE, RH>(
  matcher?: Method<S, E, R, T, RC, RE, RH> | Method<S, E, R, T, RC, RE, RH>[]
) => {
  if (!matcher) {
    clearResponseCache();
    clearPersistentResponse();
    return;
  }
  const methodInstances = isArray(matcher) ? matcher : [matcher];
  forEach(methodInstances, methodInstance => {
    const { id, storage } = getContext(methodInstance),
      methodKey = getMethodInternalKey(methodInstance);
    removeResponseCache(id, methodKey);
    removePersistentResponse(id, methodKey, storage);
  });
};
