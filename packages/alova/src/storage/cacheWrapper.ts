import {
  PromiseCls,
  RegExpCls,
  buildNamespacedCacheKey,
  deleteAttr,
  filterItem,
  forEach,
  getTime,
  instanceOf,
  len,
  mapItem,
  newInstance,
  objectKeys,
  pushItem,
  undefinedValue
} from '@alova/shared';
import { AlovaGenerics, AlovaGlobalCacheAdapter, AlovaMethodConfig, DetailCacheConfig, Method } from '~/typings';

type UniqueKeyPromised = Record<string, 0>;
const hitSourceStringCacheKey = (key: string) => `hss.${key}`;
const hitSourceRegexpPrefix = 'hsr.';
const hitSourceRegexpCacheKey = (regexpStr: string) => hitSourceRegexpPrefix + regexpStr;
const unifiedHitSourceRegexpCacheKey = '$$hsrs';
const regexpSourceFlagSeparator = '__$<>$__';
const addItem = (obj: UniqueKeyPromised, item: string) => {
  obj[item] = 0;
};

/**
 * set or update cache
 * @param namespace namespace
 * @param key stored key
 * @param response Stored response content
 * @param expireTimestamp Timestamp representation of expiration time point
 * @param storage storage object
 * @param tag Storage tags, used to distinguish different storage tags
 */
export const setWithCacheAdapter = async <AG extends AlovaGenerics = AlovaGenerics>(
  namespace: string,
  key: string,
  data: any,
  expireTimestamp: number,
  cacheAdapter: AlovaGlobalCacheAdapter,
  hitSource: Method['hitSource'],
  tag?: DetailCacheConfig<AG>['tag']
) => {
  // not to cache if expireTimestamp is less than current timestamp
  if (expireTimestamp > getTime() && data) {
    const methodCacheKey = buildNamespacedCacheKey(namespace, key);
    await cacheAdapter.set(
      methodCacheKey,
      filterItem([data, expireTimestamp === Infinity ? undefinedValue : expireTimestamp, tag], Boolean)
    );

    // save the relationship between this method and its hitSources.
    // cache structure is like this:
    /*
      {
        "$a.[namespace][methodKey]": [cache data],
        ...
        "hss.[sourceMethodKey]": "{
          [targetMethodKey1]: 0,
          [targetMethodKey2]: 0,
          ...
        }",
        "hss.[sourceMethodName]": "{
          [targetMethodKey3]: 0,
          [targetMethodKey4]: 0,
          ...
        }",
        "hsr.[sourceMethodNameRegexpSource]": "{
          [targetMethodKey5]: 0,
          [targetMethodKey6]: 0,
          ...
        }",
        "hsr.regexp1": ["hss.key1", "hss.key2"],
        "hsr.regexp2": ["hss.key1", "hss.key2"]
      }
    */
    if (hitSource) {
      // filter repeat items and categorize the regexp, to prevent unnecessary cost of IO
      const hitSourceKeys = {} as UniqueKeyPromised;
      const hitSourceRegexpSources = [] as string[];
      forEach(hitSource, sourceItem => {
        const isRegexp = instanceOf(sourceItem, RegExpCls);
        const targetHitSourceKey = isRegexp
          ? sourceItem.source + (sourceItem.flags ? regexpSourceFlagSeparator + sourceItem.flags : '')
          : sourceItem;

        if (targetHitSourceKey) {
          if (isRegexp && !hitSourceKeys[targetHitSourceKey]) {
            pushItem(hitSourceRegexpSources, targetHitSourceKey);
          }
          addItem(
            hitSourceKeys,
            isRegexp ? hitSourceRegexpCacheKey(targetHitSourceKey) : hitSourceStringCacheKey(targetHitSourceKey)
          );
        }
      });

      // save the relationship. Minimize IO as much as possible
      const promises = mapItem(objectKeys(hitSourceKeys), async hitSourceKey => {
        // filter the empty strings.
        const targetMethodKeys = (await cacheAdapter.get<UniqueKeyPromised>(hitSourceKey)) || {};
        addItem(targetMethodKeys, methodCacheKey);
        await cacheAdapter.set(hitSourceKey, targetMethodKeys);
      });
      const saveRegexp = async () => {
        // save the regexp source if regexp exists.
        if (len(hitSourceRegexpSources)) {
          const regexpList = (await cacheAdapter.get<string[]>(unifiedHitSourceRegexpCacheKey)) || [];
          // TODO: hitSourceRegexpSources needs to be deduplicated
          pushItem(regexpList, ...hitSourceRegexpSources);
          await cacheAdapter.set(unifiedHitSourceRegexpCacheKey, regexpList);
        }
      };

      // parallel executing all async tasks.
      await PromiseCls.all([...promises, saveRegexp()]);
    }
  }
};

/**
 * Delete stored response data
 * @param namespace namespace
 * @param key stored key
 * @param storage storage object
 */
export const removeWithCacheAdapter = async (namespace: string, key: string, cacheAdapter: AlovaGlobalCacheAdapter) => {
  const methodStoreKey = buildNamespacedCacheKey(namespace, key);
  await cacheAdapter.remove(methodStoreKey);
};

/**
 * Get stored response data
 * @param namespace namespace
 * @param key stored key
 * @param storage storage object
 * @param tag Store tags. If the tag changes, the data will become invalid.
 */
export const getRawWithCacheAdapter = async <AG extends AlovaGenerics = AlovaGenerics>(
  namespace: string,
  key: string,
  cacheAdapter: AlovaGlobalCacheAdapter,
  tag?: DetailCacheConfig<AG>['tag']
) => {
  const storagedData = await cacheAdapter.get<[any, number, DetailCacheConfig<AG>['tag']]>(
    buildNamespacedCacheKey(namespace, key)
  );
  if (storagedData) {
    // Eslint disable next line
    const [dataUnused, expireTimestamp, storedTag] = storagedData;
    // If there is no expiration time, it means that the data will never expire. Otherwise, you need to determine whether it has expired.
    if (storedTag === tag && (!expireTimestamp || expireTimestamp > getTime())) {
      return storagedData;
    }
    // If expired, delete cache
    await removeWithCacheAdapter(namespace, key, cacheAdapter);
  }
};

/**
 * Get stored response data
 * @param namespace namespace
 * @param key stored key
 * @param storage storage object
 * @param tag Store tags. If the tag changes, the data will become invalid.
 */
export const getWithCacheAdapter = async <AG extends AlovaGenerics = AlovaGenerics>(
  namespace: string,
  key: string,
  cacheAdapter: AlovaGlobalCacheAdapter,
  tag?: DetailCacheConfig<AG>['tag']
) => {
  const rawData = await getRawWithCacheAdapter(namespace, key, cacheAdapter, tag);
  return rawData ? rawData[0] : undefinedValue;
};

/**
 * clear all cached data
 */
export const clearWithCacheAdapter = async (cacheAdapters: AlovaGlobalCacheAdapter[]) =>
  PromiseCls.all(cacheAdapters.map(cacheAdapter => cacheAdapter.clear()));

/**
 * query and delete target cache with key and name of source method instance.
 * @param sourceKey source method instance key
 * @param sourceName source method instance name
 * @param cacheAdapter cache adapter
 */
export const hitTargetCacheWithCacheAdapter = async (
  sourceKey: string,
  sourceName: AlovaMethodConfig<any, any, any>['name'],
  cacheAdapter: AlovaGlobalCacheAdapter
) => {
  const sourceNameStr = `${sourceName}`;
  // map that recording the source key and target method keys.
  const sourceTargetKeyMap = {} as Record<string, UniqueKeyPromised | undefined>;
  // get hit key by method key.
  const hitSourceKey = hitSourceStringCacheKey(sourceKey);
  sourceTargetKeyMap[hitSourceKey] = await cacheAdapter.get(hitSourceKey);
  let unifiedHitSourceRegexpChannel: string[] | undefined;

  if (sourceName) {
    const hitSourceName = hitSourceStringCacheKey(sourceNameStr);
    // get hit key by method name if it is exists.
    sourceTargetKeyMap[hitSourceName] = await cacheAdapter.get(hitSourceName);

    // match regexped key by source method name and get hit key by method name.
    unifiedHitSourceRegexpChannel = await cacheAdapter.get<string[]>(unifiedHitSourceRegexpCacheKey);
    const matchedRegexpStrings = [] as string[];
    if (unifiedHitSourceRegexpChannel && len(unifiedHitSourceRegexpChannel)) {
      forEach(unifiedHitSourceRegexpChannel, regexpStr => {
        const [source, flag] = regexpStr.split(regexpSourceFlagSeparator);
        if (newInstance(RegExpCls, source, flag).test(sourceNameStr)) {
          pushItem(matchedRegexpStrings, regexpStr);
        }
      });

      // parallel get hit key by matched regexps.
      await PromiseCls.all(
        mapItem(matchedRegexpStrings, async regexpString => {
          const hitSourceRegexpString = hitSourceRegexpCacheKey(regexpString);
          sourceTargetKeyMap[hitSourceRegexpString] = await cacheAdapter.get(hitSourceRegexpString);
        })
      );
    }
  }

  const removeWithTargetKey = async (targetKey: string) => {
    try {
      await cacheAdapter.remove(targetKey);
      // loop sourceTargetKeyMap and remove this key to prevent unnecessary cost of IO.
      for (const sourceKey in sourceTargetKeyMap) {
        const targetKeys = sourceTargetKeyMap[sourceKey];
        if (targetKeys) {
          deleteAttr(targetKeys, targetKey);
        }
      }
    } catch {
      // the try-catch is used to prevent throwing error, cause throwing error in `Promise.all` below.
    }
  };

  // now let's start to delete target caches.
  // and filter the finished keys.
  const accessedKeys: UniqueKeyPromised = {};
  await PromiseCls.all(
    mapItem(objectKeys(sourceTargetKeyMap), async sourceKey => {
      const targetKeys = sourceTargetKeyMap[sourceKey];
      if (targetKeys) {
        const removingPromises = [] as Promise<void>[];
        for (const key in targetKeys) {
          if (!accessedKeys[key]) {
            addItem(accessedKeys, key);
            pushItem(removingPromises, removeWithTargetKey(key));
          }
        }
        await PromiseCls.all(removingPromises);
      }
    })
  );

  // update source key if there is still has keys.
  // remove source key if its keys is empty.
  const unifiedHitSourceRegexpChannelLen = len(unifiedHitSourceRegexpChannel || []);
  await PromiseCls.all(
    mapItem(objectKeys(sourceTargetKeyMap), async sourceKey => {
      const targetKeys = sourceTargetKeyMap[sourceKey];
      if (targetKeys) {
        if (len(objectKeys(targetKeys))) {
          await cacheAdapter.set(sourceKey, targetKeys);
        } else {
          await cacheAdapter.remove(sourceKey);
          // if this is a regexped key, need to remove it from unified regexp channel.
          if (sourceKey.includes(hitSourceRegexpPrefix) && unifiedHitSourceRegexpChannel) {
            unifiedHitSourceRegexpChannel = filterItem(
              unifiedHitSourceRegexpChannel,
              rawRegexpStr => hitSourceRegexpCacheKey(rawRegexpStr) !== sourceKey
            );
          }
        }
      }
    })
  );

  // update unified hit source regexp channel if its length was changed.
  if (unifiedHitSourceRegexpChannelLen !== len(unifiedHitSourceRegexpChannel || [])) {
    await cacheAdapter.set(unifiedHitSourceRegexpCacheKey, unifiedHitSourceRegexpChannel);
  }
};
