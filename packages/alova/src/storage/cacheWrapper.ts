import { buildNamespacedCacheKey, getTime, instanceOf, newInstance } from '@alova/shared/function';
import {
  PromiseCls,
  RegExpCls,
  deleteAttr,
  filterItem,
  forEach,
  len,
  mapItem,
  objectKeys,
  pushItem,
  undefinedValue
} from '@alova/shared/vars';
import { AlovaGlobalCacheAdapter, AlovaMethodConfig, DetailCacheConfig, Method } from '~/typings';

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
 * @param namespace 命名空间
 * @param key 存储的key
 * @param response 存储的响应内容
 * @param expireTimestamp 过期时间点的时间戳表示
 * @param storage 存储对象
 * @param tag 存储标签，用于区分不同的存储标记
 */
export const setWithCacheAdapter = async (
  namespace: string,
  key: string,
  data: any,
  expireTimestamp: number,
  cacheAdapter: AlovaGlobalCacheAdapter,
  hitSource: Method['hitSource'],
  tag?: DetailCacheConfig['tag']
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
          [targtMethodKey1]: 0,
          [targtMethodKey2]: 0,
          ...
        }",
        "hss.[sourceMethodName]": "{
          [targtMethodKey3]: 0,
          [targtMethodKey4]: 0,
          ...
        }",
        "hsr.[sourceMethodNameRegxpSource]": "{
          [targtMethodKey5]: 0,
          [targtMethodKey6]: 0,
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
          // TODO: hitSourceRegexpSources 需要去重
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
 * 删除存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 */
export const removeWithCacheAdapter = async (namespace: string, key: string, cacheAdapter: AlovaGlobalCacheAdapter) => {
  const methodStoreKey = buildNamespacedCacheKey(namespace, key);
  await cacheAdapter.remove(methodStoreKey);
};

/**
 * 获取存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 * @param tag 存储标签，标记改变了数据将会失效
 */
export const getRawWithCacheAdapter = async (
  namespace: string,
  key: string,
  cacheAdapter: AlovaGlobalCacheAdapter,
  tag?: DetailCacheConfig['tag']
) => {
  const storagedData = await cacheAdapter.get<[any, number, DetailCacheConfig['tag']]>(
    buildNamespacedCacheKey(namespace, key)
  );
  if (storagedData) {
    // eslint-disable-next-line
    const [_, expireTimestamp, storedTag] = storagedData;
    // 如果没有过期时间则表示数据永不过期，否则需要判断是否过期
    if (storedTag === tag && (!expireTimestamp || expireTimestamp > getTime())) {
      return storagedData;
    }
    // 如果过期，则删除缓存
    await removeWithCacheAdapter(namespace, key, cacheAdapter);
  }
};

/**
 * 获取存储的响应数据
 * @param namespace 命名空间
 * @param key 存储的key
 * @param storage 存储对象
 * @param tag 存储标签，标记改变了数据将会失效
 */
export const getWithCacheAdapter = async (
  namespace: string,
  key: string,
  cacheAdapter: AlovaGlobalCacheAdapter,
  tag?: DetailCacheConfig['tag']
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
  sourceName: AlovaMethodConfig<any, any, {}, any>['name'],
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
    } catch (error) {
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
