import useFetcher from '@/hooks/core/useFetcher';
import useWatcher from '@/hooks/core/useWatcher';
import { createAssert } from '@alova/shared/assert';
import {
  createAsyncQueue,
  getLocalCacheConfigParam,
  getMethodInternalKey,
  getTime,
  isFn,
  isNumber,
  noop,
  statesHookHelper
} from '@alova/shared/function';
import { GeneralFn } from '@alova/shared/types';
import {
  MEMORY,
  falseValue,
  filterItem,
  forEach,
  includes,
  isArray,
  len,
  mapItem,
  objectKeys,
  objectValues,
  promiseCatch,
  promiseResolve,
  promiseThen,
  pushItem,
  splice,
  trueValue,
  undefinedValue
} from '@alova/shared/vars';
import { Alova, AlovaGenerics, Method, invalidateCache, promiseStatesHook, queryCache, setCache } from 'alova';
import { FetcherType, PaginationHookConfig } from '~/typings/clienthook';
import createSnapshotMethodsManager from './createSnapshotMethodsManager';

const paginationAssert = createAssert('usePagination');
const indexAssert = (index: number, rawData: any[]) =>
  paginationAssert(isNumber(index) && index < len(rawData), 'index must be a number that less than list length');

export default <AG extends AlovaGenerics, ListData extends unknown[]>(
  handler: (page: number, pageSize: number) => Method<AG>,
  config: PaginationHookConfig<AG, ListData> = {}
) => {
  const {
    create,
    computed,
    ref,
    watch,
    exposeProvider,
    objectify,
    __referingObj: referingObject
  } = statesHookHelper<AG>(promiseStatesHook());

  const {
    preloadPreviousPage = trueValue,
    preloadNextPage = trueValue,
    total: totalGetter = res => res.total,
    data: dataGetter = res => res.data,
    append = falseValue,
    initialPage = 1,
    initialPageSize = 10,
    watchingStates = [],
    initialData,
    immediate = trueValue,
    middleware = noop,
    force = noop,
    ...others
  } = config;

  const handlerRef = ref<typeof handler>(handler);
  const isReset = ref(falseValue); // 用于控制是否重置
  // 重置期间请求的次数，为了防止重置时重复请求，使用此参数限制请求
  const page = create(initialPage, 'page');
  const pageSize = create(initialPageSize, 'pageSize');
  const data = create((initialData ? dataGetter(initialData) || [] : []) as ListData[number][], 'data');
  const total = create(initialData ? totalGetter(initialData) : undefinedValue, 'total');
  // 保存当前hook所使用到的所有method实例快照
  const {
    snapshots: methodSnapshots,
    get: getSnapshotMethods,
    save: saveSnapshot,
    remove: removeSnapshot
  } = ref(createSnapshotMethodsManager<AG>(page => handlerRef.current(page, pageSize.v))).current;
  const listDataGetter = (rawData: any) => dataGetter(rawData) || rawData;
  // 初始化fetcher
  const fetchStates = useFetcher<FetcherType<Alova<AG>>>({
    __referingObj: referingObject,
    updateState: falseValue,
    force: ({ args }) => args[0]
  });
  const { loading, fetch, abort: abortFetch, onSuccess: onFetchSuccess } = fetchStates;
  const fetchingRef = ref(loading);

  const getHandlerMethod = (refreshPage: number | undefined = page.v) => {
    const pageSizeVal = pageSize.v;
    const handlerMethod = handler(refreshPage, pageSizeVal);

    // 定义统一的额外名称，方便管理
    saveSnapshot(handlerMethod);
    return handlerMethod;
  };
  // 监听状态变化时，重置page为1
  watch(watchingStates, () => {
    page.v = initialPage;
    isReset.current = trueValue;
  });

  // 兼容react，将需要代理的函数存放在此
  // 这样可以在代理函数中调用到最新的操作函数，避免react闭包陷阱
  const delegationActions = ref<Record<string, GeneralFn>>({});
  // 计算data、total、isLastPage参数
  const pageCount = computed(
    () => {
      const totalVal = total.v;
      return totalVal !== undefinedValue ? Math.ceil(totalVal / pageSize.v) : undefinedValue;
    },
    [pageSize, total],
    'pageCount'
  );
  const createDelegationAction =
    (actionName: string) =>
    (...args: any[]) =>
      delegationActions.current[actionName](...args);
  const states = useWatcher<AG, [page?: number, force?: boolean]>(
    getHandlerMethod,
    [...watchingStates, page.e, pageSize.e] as any,
    {
      __referingObj: referingObject,
      immediate,
      initialData,
      managedStates: objectify([data, page, pageSize, total], 's'),
      middleware(ctx, next) {
        middleware(
          {
            ...ctx,
            delegatingActions: {
              refresh: createDelegationAction('refresh'),
              insert: createDelegationAction('insert'),
              remove: createDelegationAction('remove'),
              replace: createDelegationAction('replace'),
              reload: createDelegationAction('reload'),
              getState: (stateKey: string) => {
                type SE = AG['StatesExport'];
                const states: Record<string, SE['StateExport']> = {
                  page,
                  pageSize,
                  data,
                  pageCount,
                  total,
                  // eslint-disable-next-line @typescript-eslint/no-use-before-define
                  isLastPage
                } as Record<string, any>;
                return states[stateKey].v;
              }
            }
          },
          promiseResolve
        );

        return next();
      },
      force: event => event.args[1] || (isFn(force) ? (force(event) as boolean) : force),
      ...others
    }
  );
  const { send } = states;
  const nestedData = states.__proxyState('data');

  // 判断是否可预加载数据
  const canPreload = async (payload: {
    rawData?: any;
    preloadPage: number;
    fetchMethod: Method<AG>;
    isNextPage?: boolean;
    forceRequest?: boolean;
  }) => {
    const {
      rawData = nestedData.v,
      preloadPage,
      fetchMethod,
      forceRequest = falseValue,
      isNextPage = falseValue
    } = payload;

    const { e: expireMilliseconds } = getLocalCacheConfigParam(fetchMethod);
    // 如果缓存时间小于等于当前时间，表示没有设置缓存，此时不再预拉取数据
    // 或者已经有缓存了也不预拉取
    if (expireMilliseconds(MEMORY) <= getTime()) {
      return falseValue;
    }
    if (forceRequest) {
      return trueValue;
    }
    if (await queryCache(fetchMethod)) {
      return falseValue;
    }

    const pageCountVal = pageCount.v;
    const exceedPageCount = pageCountVal
      ? preloadPage > pageCountVal
      : isNextPage // 如果是判断预加载下一页数据且没有pageCount的情况下，通过最后一页数据量是否达到pageSize来判断
        ? len(listDataGetter(rawData)) < pageSize.v
        : falseValue;
    return preloadPage > 0 && !exceedPageCount;
  };

  // 预加载下一页数据
  const fetchNextPage = async (rawData?: any[], force = falseValue) => {
    const nextPage = page.v + 1;
    const fetchMethod = getHandlerMethod(nextPage);
    if (
      preloadNextPage &&
      (await canPreload({
        rawData,
        preloadPage: nextPage,
        fetchMethod,
        isNextPage: trueValue,
        forceRequest: force
      }))
    ) {
      promiseCatch(fetch(fetchMethod as Method, force), noop);
    }
  };
  // 预加载上一页数据
  const fetchPreviousPage = async (rawData: any[]) => {
    const prevPage = page.v - 1;
    const fetchMethod = getHandlerMethod(prevPage);
    if (
      preloadPreviousPage &&
      (await canPreload({
        rawData,
        preloadPage: prevPage,
        fetchMethod
      }))
    ) {
      promiseCatch(fetch(fetchMethod as Method), noop);
    }
  };
  // 如果返回的数据小于pageSize了，则认定为最后一页了
  const isLastPage = computed(
    () => {
      const dataRaw = nestedData.v;
      if (!dataRaw) {
        return trueValue;
      }
      const statesDataVal = listDataGetter(dataRaw as any[]);
      const pageVal = page.v;
      const pageCountVal = pageCount.v;
      const dataLen = isArray(statesDataVal) ? len(statesDataVal) : 0;
      return pageCountVal ? pageVal >= pageCountVal : dataLen < pageSize.v;
    },
    [page, pageCount, nestedData, pageSize],
    'isLastPage'
  );

  // 更新当前页缓存
  const updateCurrentPageCache = async () => {
    const snapshotItem = getSnapshotMethods(page.v);
    if (snapshotItem) {
      await setCache(snapshotItem.entity, (rawData: any[]) => {
        // 当关闭缓存时，rawData为undefined
        if (rawData) {
          const cachedListData = listDataGetter(rawData) || [];
          splice(cachedListData, 0, len(cachedListData), ...data.v);
          return rawData;
        }
      });
    }
  };

  onFetchSuccess(({ method, data: rawData }) => {
    // 处理当fetch还没响应时就翻页到fetch对应的页码时，需要手动更新列表数据
    const snapshotItem = getSnapshotMethods(page.v);
    if (snapshotItem && getMethodInternalKey(snapshotItem.entity) === getMethodInternalKey(method)) {
      // 如果追加数据，才更新data
      const listData = listDataGetter(rawData); // 更新data参数
      if (append) {
        // 下拉加载时需要替换当前页数据
        const dataRaw = data.v;
        const pageSizeVal = pageSize.v;

        // 当做移除操作时，替换的数量小于pageSize，此时dataRaw % pageSizeVal会大于0
        // 当新增操作时，替换的数量等于pageSize，此时dataRaw % pageSizeVal会等于0，此时不需要替换
        const replaceNumber = len(dataRaw) % pageSizeVal;

        if (replaceNumber > 0) {
          const rawData = [...data.v];
          splice(rawData, (page.v - 1) * pageSizeVal, replaceNumber, ...listData);
          data.v = rawData;
        }
      } else {
        data.v = listData;
      }
    }
  });
  states.onSuccess(({ data: rawData, args: [refreshPage, isRefresh], method }) => {
    const { total: cachedTotal } = getSnapshotMethods(method) || {};
    const typedRawData = rawData as any[];
    total.v = cachedTotal !== undefinedValue ? cachedTotal : totalGetter(typedRawData);
    if (!isRefresh) {
      fetchPreviousPage(typedRawData);
      fetchNextPage(typedRawData);
    }

    const pageSizeVal = pageSize.v;
    const listData = listDataGetter(typedRawData); // 获取数组
    paginationAssert(isArray(listData), 'Got wrong array, did you return the correct array of list in `data` function');

    // 如果追加数据，才更新data
    if (append) {
      // 如果是reset则先清空数据
      if (isReset.current) {
        data.v = [];
      }
      if (refreshPage === undefinedValue) {
        data.v = [...data.v, ...listData];
      } else if (refreshPage) {
        const rawData = [...data.v];
        // 如果是刷新页面，则是替换那一页的数据
        splice(rawData, (refreshPage - 1) * pageSizeVal, pageSizeVal, ...listData);
        data.v = rawData;
      }
    } else {
      data.v = listData;
    }
  });

  // 请求成功与否，都要重置isReset
  states.onComplete(() => {
    isReset.current = falseValue;
  });

  // 获取列表项所在位置
  const getItemIndex = (item: ListData[number]) => {
    const index = data.v.indexOf(item);
    paginationAssert(index >= 0, 'item is not found in list');
    return index;
  };

  const { addQueue: add2AsyncQueue, onComplete: onAsyncQueueRunComplete } = ref(createAsyncQueue()).current;

  /**
   * 刷新指定页码数据，此函数将忽略缓存强制发送请求
   * 如果未传入页码则会刷新当前页
   * 如果传入一个列表项，将会刷新此列表项所在页，只对append模式有效
   * @param pageOrItemPage 刷新的页码或列表项
   */
  const refresh = (pageOrItemPage: number | ListData[number] = page.v) => {
    let refreshPage = pageOrItemPage as number;
    if (append) {
      if (!isNumber(pageOrItemPage)) {
        const itemIndex = getItemIndex(pageOrItemPage);
        refreshPage = Math.floor(itemIndex / pageSize.v) + 1;
      }
      paginationAssert(refreshPage <= page.v, "refresh page can't greater than page");
      // 更新当前页数据
      promiseCatch(send(refreshPage, trueValue), noop);
    } else {
      paginationAssert(isNumber(refreshPage), 'unable to calculate refresh page by item in pagination mode');
      // 页数相等，则刷新当前页，否则fetch数据
      promiseCatch(
        refreshPage === page.v
          ? send(undefinedValue, trueValue)
          : fetch(handler(refreshPage, pageSize.v) as Method, trueValue),
        noop
      );
    }
  };

  // 删除除此usehook当前页和下一页的所有相关缓存
  const invalidatePaginationCache = async (all = falseValue) => {
    const pageVal = page.v;
    const snapshotObj = methodSnapshots();
    let snapshots = objectValues(snapshotObj);
    if (all) {
      removeSnapshot();
    } else {
      // 筛选出上一页、当前页、下一页的数据
      const excludeSnapshotKeys = mapItem(
        filterItem(
          [getSnapshotMethods(pageVal - 1), getSnapshotMethods(pageVal), getSnapshotMethods(pageVal + 1)],
          Boolean
        ),
        ({ entity }) => getMethodInternalKey(entity)
      );
      snapshots = mapItem(
        filterItem(objectKeys(snapshotObj), key => !includes(excludeSnapshotKeys, key)),
        key => {
          const item = snapshotObj[key];
          delete snapshotObj[key];
          return item;
        }
      );
    }
    await invalidateCache(mapItem(snapshots, ({ entity }) => entity));
  };

  // 单独拿出来的原因是
  // 无论同步调用几次insert、remove，或它们组合调用，reset操作只需要异步执行一次
  const resetCache = async () => {
    fetchingRef.current && abortFetch();
    // 缓存失效
    await invalidatePaginationCache();

    // 当下一页的数据量不超过pageSize时，强制请求下一页，因为有请求共享，需要在中断请求后异步执行拉取操作
    const snapshotItem = getSnapshotMethods(page.v + 1);
    if (snapshotItem) {
      const cachedListData = listDataGetter((await queryCache(snapshotItem.entity)) || {}) || [];
      fetchNextPage(undefinedValue, len(cachedListData) < pageSize.v);
    }
  };

  // 统一更新总条数
  const updateTotal = (offset: number) => {
    if (offset === 0) {
      return;
    }
    // 更新当前页
    const totalVal = total.v;
    if (isNumber(totalVal)) {
      const offsetedTotal = Math.max(totalVal + offset, 0);
      total.v = offsetedTotal;
      const pageVal = page.v;

      // 更新冗余的total字段
      forEach([getSnapshotMethods(pageVal - 1), getSnapshotMethods(pageVal), getSnapshotMethods(pageVal + 1)], item => {
        item && (item.total = offsetedTotal);
      });
    }
  };

  /**
   * 插入一条数据
   * 如果未传入index，将默认插入到最前面
   * 如果传入一个列表项，将插入到这个列表项的后面，如果列表项未在列表数据中将会抛出错误
   * @param item 插入项
   * @param position 插入位置（索引）或列表项
   */
  const insert = (item: ListData extends any[] ? ListData[number] : any, position: number | ListData[number] = 0) => {
    onAsyncQueueRunComplete(resetCache); // 执行结束需要重置缓存
    return add2AsyncQueue(async () => {
      const index = isNumber(position) ? position : getItemIndex(position) + 1;
      let popItem: ListData[number] | undefined = undefinedValue;
      const rawData = [...data.v];
      // 当前展示的项数量刚好是pageSize的倍数时，才需要去掉一项数据，保证操作页的数量为pageSize
      if (len(rawData) % pageSize.v === 0) {
        popItem = rawData.pop();
      }
      // 插入位置为空默认插到最前面
      splice(rawData, index, 0, item);
      data.v = rawData;

      updateTotal(1);

      // 当前页的缓存同步更新
      await updateCurrentPageCache();

      // 如果有pop项，将它放到下一页缓存的头部，与remove的操作保持一致
      // 这样在同步调用insert和remove时表现才一致
      if (popItem) {
        const snapshotItem = getSnapshotMethods(page.v + 1);
        if (snapshotItem) {
          await setCache(snapshotItem.entity, (rawData: any[]) => {
            if (rawData) {
              const cachedListData = listDataGetter(rawData) || [];
              cachedListData.unshift(popItem);
              cachedListData.pop();
              return rawData;
            }
          });
        }
      }
    });
  };

  /**
   * 移除一条数据
   * 如果传入的是列表项，将移除此列表项，如果列表项未在列表数据中将会抛出错误
   * @param position 移除的索引或列表项
   */
  const remove = (...positions: (number | ListData[number])[]) => {
    onAsyncQueueRunComplete(resetCache); // 执行结束需要重置缓存
    return add2AsyncQueue(async () => {
      const indexes = mapItem(positions, position => {
        const index = isNumber(position) ? position : getItemIndex(position);
        indexAssert(index, data.v);
        return index;
      });
      const pageVal = page.v;
      const nextPage = pageVal + 1;
      const snapshotItem = getSnapshotMethods(nextPage);
      const fillingItems: ListData[number][] = []; // 补位数据项
      if (snapshotItem) {
        await setCache(snapshotItem.entity, (rawData: any) => {
          if (rawData) {
            const cachedListData = listDataGetter(rawData);
            // 从下一页列表的头部开始取补位数据
            if (isArray(cachedListData)) {
              pushItem(fillingItems, ...splice(cachedListData, 0, len(indexes)));
            }
            return rawData;
          }
        });
      }

      const isLastPageVal = isLastPage.v;
      const fillingItemsLen = len(fillingItems);
      if (fillingItemsLen > 0 || isLastPageVal) {
        // 删除指定索引的数据
        const newListData = filterItem(data.v, (_, index) => !includes(indexes, index));

        // 翻页模式下，如果是最后一页且全部项被删除了，则往前翻一页
        if (!append && isLastPageVal && len(newListData) <= 0) {
          page.v = pageVal - 1;
        } else if (fillingItemsLen > 0) {
          pushItem(newListData, ...fillingItems);
        }
        data.v = newListData;
      } else if (fillingItemsLen <= 0 && !isLastPageVal) {
        // 移除最后一页数据时，就不需要再刷新了
        refresh(pageVal);
      }

      updateTotal(-len(indexes));
      // 当前页的缓存同步更新
      return updateCurrentPageCache();
    });
  };
  /**
   * 替换一条数据
   * 如果position传入的是列表项，将替换此列表项，如果列表项未在列表数据中将会抛出错误
   * @param item 替换项
   * @param position 替换位置（索引）或列表项
   */
  const replace = (item: ListData extends any[] ? ListData[number] : any, position: number | ListData[number]) =>
    add2AsyncQueue(async () => {
      paginationAssert(position !== undefinedValue, 'expect specify the replace position');
      const index = isNumber(position) ? position : getItemIndex(position);
      indexAssert(index, data.v);
      const rawData = [...data.v];
      splice(rawData, index, 1, item);
      data.v = rawData;
      // 当前页的缓存同步更新
      await updateCurrentPageCache();
    });

  /**
   * 从第${initialPage}页开始重新加载列表，并清空缓存
   */
  const reload = () => {
    promiseThen(invalidatePaginationCache(trueValue), () => {
      isReset.current = trueValue;
      page.v === initialPage ? promiseCatch(send(), noop) : (page.v = initialPage);
    });
  };

  // 兼容react，每次缓存最新的操作函数，避免闭包陷阱
  delegationActions.current = {
    refresh,
    insert,
    remove,
    replace,
    reload
  };
  /** @Returns */
  return exposeProvider({
    ...states,
    ...objectify([data, page, pageCount, pageSize, total, isLastPage]),

    fetching: fetchStates.loading,
    onFetchSuccess: fetchStates.onSuccess,
    onFetchError: fetchStates.onError,
    onFetchComplete: fetchStates.onComplete,
    refresh,
    insert,
    remove,
    replace,
    reload
  });
};
