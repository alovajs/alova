import { useFetcher, useWatcher } from '@/index';
import { createAssert } from '@alova/shared/assert';
import {
  createSyncOnceRunner,
  getLocalCacheConfigParam,
  getTime,
  isFn,
  isNumber,
  noop,
  statesHookHelper
} from '@alova/shared/function';
import {
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
  pushItem,
  setTimeoutFn,
  shift,
  splice,
  trueValue,
  undefinedValue
} from '@alova/shared/vars';
import {
  Alova,
  AlovaGenerics,
  Method,
  getMethodKey,
  invalidateCache,
  promiseStatesHook,
  queryCache,
  setCache
} from 'alova';
import { FetcherType } from 'alova/client';
import { AnyFn, PaginationHookConfig } from '~/typings/general';
import createSnapshotMethodsManager from './createSnapshotMethodsManager';

const paginationAssert = createAssert('usePagination');
const indexAssert = (index: number, rawData: any[]) =>
  paginationAssert(isNumber(index) && index < len(rawData), 'index must be a number that less than list length');

export default <AG extends AlovaGenerics>(
  handler: (page: number, pageSize: number) => Method<AG>,
  config: PaginationHookConfig<AG, unknown[]> = {}
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
  const requestCountInReseting = ref(0);
  const page = create(initialPage, 'page', trueValue);
  const pageSize = create(initialPageSize, 'pageSize', trueValue);
  const data = create(initialData ? dataGetter(initialData) || [] : [], 'data', trueValue);
  const total = create(initialData ? totalGetter(initialData) : undefinedValue, 'total', trueValue);
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
    force: ({ sendArgs }) => sendArgs[0]
  });
  const { loading, fetch, abort: abortFetch, onSuccess: onFetchSuccess } = fetchStates;
  const fetchingRef = ref(loading);

  const getHandlerMethod = (refreshPage = page.v) => {
    const pageSizeVal = pageSize.v;
    const handlerMethod = handler(refreshPage, pageSizeVal);

    // 定义统一的额外名称，方便管理
    saveSnapshot(handlerMethod);
    return handlerMethod;
  };
  // 监听状态变化时，重置page为1
  watch(watchingStates, () => {
    page.v = initialPage;
    requestCountInReseting.current = 0;
    isReset.current = trueValue;
  });

  // 兼容react，将需要代理的函数存放在此
  // 这样可以在代理函数中调用到最新的操作函数，避免react闭包陷阱
  const delegationActions = ref<Record<string, AnyFn>>({});
  // 计算data、total、isLastPage参数
  const pageCount = computed(
    () => {
      const totalVal = total.v;
      return totalVal !== undefinedValue ? Math.ceil(totalVal / pageSize.v) : undefinedValue;
    },
    [pageSize.e, total.e],
    'pageCount',
    trueValue
  );
  const createDelegationAction =
    (actionName: string) =>
    (...args: any[]) =>
      delegationActions.current[actionName](...args);
  const states = useWatcher<AG>(getHandlerMethod, [...watchingStates, page.e, pageSize.e] as any, {
    __referingObj: referingObject,
    immediate,
    initialData,
    middleware(ctx, next) {
      (middleware as any)(
        {
          ...ctx,
          delegatingActions: {
            refresh: createDelegationAction('refresh'),
            insert: createDelegationAction('insert'),
            remove: createDelegationAction('remove'),
            replace: createDelegationAction('replace'),
            reload: createDelegationAction('reload'),
            getState: (stateKey: string) => {
              const states: Record<string, AG['Export']> = {
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

      // 监听值改变时将会重置为第一页，此时会触发两次请求，在这边过滤掉一次请求
      let requestPromise: Promise<any> = promiseResolve(undefinedValue);
      if (!isReset.current) {
        requestPromise = next();
      } else if (requestCountInReseting.current === 0) {
        requestCountInReseting.current += 1;
        requestPromise = next();
      }
      return requestPromise;
    },
    force: event => {
      if (isFn(force)) {
        return force(event as any);
      }

      return force === undefinedValue ? event.sendArgs[1] : force;
    },
    abortLast: false,
    ...others
  });
  const { send } = states;

  const requestDataRef = ref(states.data);

  // 判断是否可预加载数据
  const canPreload = async (payload: {
    rawData?: any;
    preloadPage: number;
    fetchMethod: Method<AG>;
    isNextPage?: boolean;
    forceRequest?: boolean;
  }) => {
    const {
      rawData = requestDataRef.current,
      preloadPage,
      fetchMethod,
      forceRequest = falseValue,
      isNextPage = falseValue
    } = payload;

    const { e: expireMilliseconds } = getLocalCacheConfigParam(fetchMethod);
    // 如果缓存时间小于等于当前时间，表示没有设置缓存，此时不再预拉取数据
    // 或者已经有缓存了也不预拉取
    if (expireMilliseconds <= getTime()) {
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
      promiseCatch(fetch(fetchMethod, force), noop);
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
      promiseCatch(fetch(fetchMethod), noop);
    }
  };
  // 如果返回的数据小于pageSize了，则认定为最后一页了
  const isLastPage = computed(
    () => {
      const dataRaw = requestDataRef.current;
      if (!dataRaw) {
        return trueValue;
      }
      const statesDataVal = listDataGetter(dataRaw as any[]);
      const pageVal = page.v;
      const pageCountVal = pageCount.v;
      const dataLen = isArray(statesDataVal) ? len(statesDataVal) : 0;
      return pageCountVal ? pageVal >= pageCountVal : dataLen < pageSize.v;
    },
    [page.e, pageCount.e, states.data, pageSize.e],
    'isLastPage',
    trueValue
  );

  // 更新当前页缓存
  const updateCurrentPageCache = () => {
    const snapshotItem = getSnapshotMethods(page.v);
    snapshotItem &&
      setCache(snapshotItem.entity, (rawData: any[]) => {
        // 当关闭缓存时，rawData为undefined
        if (rawData) {
          const cachedListData = listDataGetter(rawData) || [];
          splice(cachedListData, 0, len(cachedListData), ...data.v);
          return rawData;
        }
      });
  };

  onFetchSuccess(({ method, data: rawData }) => {
    // 处理当fetch还没响应时就翻页到fetch对应的页码时，需要手动更新列表数据
    const snapshotItem = getSnapshotMethods(page.v);
    if (snapshotItem && getMethodKey(snapshotItem.entity) === getMethodKey(method)) {
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
          const rawData = data.v;
          splice(rawData, (page.v - 1) * pageSizeVal, replaceNumber, ...listData);
          data.v = rawData;
        }
      } else {
        data.v = listData;
      }
    }
  });
  states.onSuccess(({ data: rawData, sendArgs: [refreshPage, isRefresh], method }) => {
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
        const rawData = data.v;
        // 如果是刷新页面，则是替换那一页的数据
        splice(rawData, (refreshPage - 1) * pageSizeVal, pageSizeVal, ...listData);
        data.v = rawData;
      }
    } else {
      data.v = listData;
    }
  });

  // 请求成功与否，都要重置它们
  states.onComplete(() => {
    isReset.current = falseValue;
    requestCountInReseting.current = 0;
  });

  // 获取列表项所在位置
  const getItemIndex = (item: any) => {
    const index = data.v.indexOf(item);
    paginationAssert(index >= 0, 'item is not found in list');
    return index;
  };

  /**
   * 刷新指定页码数据，此函数将忽略缓存强制发送请求
   * 如果未传入页码则会刷新当前页
   * 如果传入一个列表项，将会刷新此列表项所在页，只对append模式有效
   * @param pageOrItemPage 刷新的页码或列表项
   */
  const refresh = (pageOrItemPage = page.v) => {
    let refreshPage = pageOrItemPage;
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
        refreshPage === page.v ? send(undefinedValue, trueValue) : fetch(handler(refreshPage, pageSize.v), trueValue),
        noop
      );
    }
  };

  const removeSyncRunner = ref(createSyncOnceRunner()).current;
  // 删除除此usehook当前页和下一页的所有相关缓存
  const invalidatePaginationCache = (all = falseValue) => {
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
        ({ entity }) => getMethodKey(entity)
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
    invalidateCache(mapItem(snapshots, ({ entity }) => entity));
  };

  // 单独拿出来的原因是
  // 无论同步调用几次insert、remove，或它们组合调用，reset操作只需要异步执行一次
  const resetSyncRunner = ref(createSyncOnceRunner()).current;
  const resetCache = () =>
    resetSyncRunner(() => {
      fetchingRef.current && abortFetch();
      // 缓存失效
      invalidatePaginationCache();

      // 当下一页的数据量不超过pageSize时，强制请求下一页，因为有请求共享，需要在中断请求后异步执行拉取操作
      setTimeoutFn(async () => {
        const snapshotItem = getSnapshotMethods(page.v + 1);
        if (snapshotItem) {
          const cachedListData = listDataGetter((await queryCache(snapshotItem.entity)) || {}) || [];
          fetchNextPage(undefinedValue, len(cachedListData) < pageSize.v);
        }
      });
    });

  // 统一更新总条数
  const updateTotal = (offset: number) => {
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
  const insert = (item: any, position = 0) => {
    const index = isNumber(position) ? position : getItemIndex(position) + 1;
    let popItem = undefinedValue;
    const rawData = data.v;
    // 当前展示的项数量刚好是pageSize的倍数时，才需要去掉一项数据，保证操作页的数量为pageSize
    if (len(rawData) % pageSize.v === 0) {
      popItem = rawData.pop();
    }
    // 插入位置为空默认插到最前面
    splice(rawData, index, 0, item);
    data.v = rawData;

    updateTotal(1);

    // 当前页的缓存同步更新
    updateCurrentPageCache();

    // 如果有pop项，将它放到下一页缓存的头部，与remove的操作保持一致
    // 这样在同步调用insert和remove时表现才一致
    if (popItem) {
      const snapshotItem = getSnapshotMethods(page.v + 1);
      snapshotItem &&
        setCache(snapshotItem.entity, (rawData: any[]) => {
          if (rawData) {
            const cachedListData = listDataGetter(rawData) || [];
            cachedListData.unshift(popItem);
            cachedListData.pop();
            return rawData;
          }
        });
    }

    // 插入项后也需要让缓存失效，以免不同条件下缓存未更新
    resetCache();
  };

  /**
   * 移除一条数据
   * 如果传入的是列表项，将移除此列表项，如果列表项未在列表数据中将会抛出错误
   * @param position 移除的索引或列表项
   */
  let tempData: any[] | undefined; // 临时保存的数据，以便当需要重新加载时用于数据恢复
  const remove = (position: number) => {
    const index = isNumber(position) ? position : getItemIndex(position);
    indexAssert(index, data.v);
    const pageVal = page.v;
    const nextPage = pageVal + 1;
    const snapshotItem = getSnapshotMethods(nextPage);
    let fillingItem = undefinedValue; // 补位数据项
    snapshotItem &&
      setCache(snapshotItem.entity, (rawData: any[]) => {
        if (rawData) {
          const cachedListData = listDataGetter(rawData);
          // 从下一页列表的头部开始取补位数据
          fillingItem = shift(cachedListData || []);
          fillingItem = shift(cachedListData || []);
          return rawData;
        }
      });

    const isLastPageVal = isLastPage.v;
    if (fillingItem || isLastPageVal) {
      // 如果有下一页数据则通过缓存数据补位
      if (!tempData) {
        tempData = [...data.v];
      }
      if (index >= 0) {
        const rawData = data.v;
        splice(rawData, index, 1);
        // 如果有下一页的补位数据才去补位，因为有可能是最后一页才进入删除的
        fillingItem && pushItem(rawData, fillingItem);
        data.v = rawData;
      }
    } else if (tempData) {
      data.v = tempData; // 当移除项数都用完时还原数据，减少不必要的视图渲染
    }

    updateTotal(-1);
    // 当前页的缓存同步更新
    updateCurrentPageCache();

    // 如果没有下一页数据，或同步删除的数量超过了pageSize，则恢复数据并重新加载本页
    // 需异步操作，因为可能超过pageSize后还有remove函数被同步执行
    resetCache();
    removeSyncRunner(() => {
      // 移除最后一页数据时，就不需要再刷新了
      if (!fillingItem && !isLastPageVal) {
        refresh(pageVal);
      }
      if (!append && isLastPageVal && len(data.v) <= 0) {
        page.v = pageVal - 1; // 翻页模式下，如果是最后一页且全部项被删除了，则往前翻一页
      }
      tempData = undefinedValue;
    });
  };

  /**
   * 替换一条数据
   * 如果position传入的是列表项，将替换此列表项，如果列表项未在列表数据中将会抛出错误
   * @param item 替换项
   * @param position 替换位置（索引）或列表项
   */
  const replace = (item: any, position: number) => {
    paginationAssert(position !== undefinedValue, 'must specify replace position');
    const index = isNumber(position) ? position : getItemIndex(position);
    indexAssert(index, data.v);
    const rawData = data.v;
    splice(rawData, index, 1, item);
    data.v = rawData;
    // 当前页的缓存同步更新
    updateCurrentPageCache();
  };

  /**
   * 从第${initialPage}页开始重新加载列表，并清空缓存
   */
  const reload = () => {
    invalidatePaginationCache(trueValue);
    isReset.current = trueValue;
    page.v === initialPage ? promiseCatch(send(), noop) : (page.v = initialPage);
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

    fetching: fetchStates.loading,
    onFetchSuccess: fetchStates.onSuccess,
    onFetchError: fetchStates.onError,
    onFetchComplete: fetchStates.onComplete,
    refresh,
    insert,
    remove,
    replace,
    reload,
    ...objectify([data, page, pageCount, pageSize, total, isLastPage])
  });
};
