import { createAssert } from '@alova/shared/assert';
import { createSyncOnceRunner, getLocalCacheConfigParam, getTime, isNumber, noop, statesHookHelper } from '@alova/shared/function';
import {
  falseValue,
  filterItem,
  forEach,
  isArray,
  len,
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
  AlovaMethodHandler,
  Method,
  getMethodKey,
  invalidateCache,
  promiseStatesHook,
  queryCache,
  setCache,
  useFetcher,
  useWatcher
} from 'alova';
import { includes, map } from 'lodash-es';
import { PaginationHookConfig } from '~/typings/general';
import createSnapshotMethodsManager from './createSnapshotMethodsManager';

const paginationAssert = createAssert('usePagination');
const indexAssert = (index, rawData) =>
  paginationAssert(isNumber(index) && index < len(rawData), 'index must be a number that less than list length');

export default <State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>(
  handler:
    | Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
    | AlovaMethodHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
  config: PaginationHookConfig<State, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader, any, Watched> = {}
) => {
  const {
    create,
    computed,
    dehydrate,
    ref,
    watch,
    memorize,
    batchExport,
    exportObject,
    __referingObj: referingObject
  } = statesHookHelper(promiseStatesHook());

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
  const [page, setPage] = create(initialPage, 'page', trueValue);
  const [pageSize, setPageSize] = create(initialPageSize, 'pageSize', trueValue);
  const [data, setData] = create(initialData ? dataGetter(initialData) || [] : [], 'data', trueValue);
  const [total, setTotal] = create(initialData ? totalGetter(initialData) : undefinedValue, 'total', trueValue);
  // 保存当前hook所使用到的所有method实例快照
  const {
    snapshots: methodSnapshots,
    get: getSnapshotMethods,
    save: saveSnapshot,
    remove: removeSnapshot
  } = ref(createSnapshotMethodsManager(page => handlerRef.current(page, dehydrate(pageSize)))).current;
  const listDataGetter = rawData => dataGetter(rawData) || rawData;
  const getHandlerMethod = (refreshPage = dehydrate(page)) => {
    const pageSizeVal = dehydrate(pageSize);
    const handlerMethod = handler(refreshPage, pageSizeVal);

    // 定义统一的额外名称，方便管理
    saveSnapshot(handlerMethod);
    return handlerMethod;
  };
  // 监听状态变化时，重置page为1
  watch(watchingStates, () => {
    setPage(initialPage);
    requestCountInReseting.current = 0;
    isReset.current = trueValue;
  });

  // 兼容react，将需要代理的函数存放在此
  // 这样可以在代理函数中调用到最新的操作函数，避免react闭包陷阱
  const delegationActions = ref({});
  const createDelegationAction =
    actionName =>
    (...args) =>
      delegationActions.current[actionName](...args);
  const states = useWatcher(getHandlerMethod, [...watchingStates, exportState(page), exportState(pageSize)], {
    __referingObj: referingObject,
    immediate,
    initialData,
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
            getState: stateKey => {
              const states = {
                page,
                pageSize,
                data,
                pageCount,
                total,
                isLastPage
              };
              return dehydrate(states[stateKey]);
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
        requestCountInReseting.current++;
        requestPromise = next();
      }
      return requestPromise;
    },
    force: (...args) => args[1] || force(...args),
    abortLast: false,
    ...others
  });
  const { send } = states;
  // 计算data、total、isLastPage参数
  const pageCount = computed(
    () => {
      const totalVal = dehydrate(total);
      return totalVal !== undefinedValue ? Math.ceil(totalVal / dehydrate(pageSize)) : undefinedValue;
    },
    batchExport(pageSize, total),
    trueValue
  );
  const requestDataRef = useRequestRefState$(states.data);

  // 判断是否可预加载数据
  const canPreload = async (
    rawData = dehydrate(requestDataRef),
    preloadPage: number,
    fetchMethod: Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
    isNextPage = falseValue,
    forceRequest: boolean
  ) => {
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

    const pageCountVal = dehydrate(pageCount);
    const exceedPageCount = pageCountVal
      ? preloadPage > pageCountVal
      : isNextPage // 如果是判断预加载下一页数据且没有pageCount的情况下，通过最后一页数据量是否达到pageSize来判断
        ? len(listDataGetter(rawData)) < dehydrate(pageSize)
        : falseValue;
    return preloadPage > 0 && !exceedPageCount;
  };

  // 预加载下一页数据
  const fetchNextPage = (rawData, force = falseValue) => {
    const nextPage = dehydrate(page) + 1;
    const fetchMethod = getHandlerMethod(nextPage);
    if (preloadNextPage && canPreload(rawData, nextPage, fetchMethod, trueValue, force)) {
      promiseCatch(fetch(fetchMethod, force), noop);
    }
  };
  // 预加载上一页数据
  const fetchPreviousPage = rawData => {
    const prevPage = dehydrate(page) - 1;
    const fetchMethod = getHandlerMethod(prevPage);
    if (preloadPreviousPage && canPreload(rawData, prevPage, fetchMethod)) {
      promiseCatch(fetch(fetchMethod), noop);
    }
  };
  // 如果返回的数据小于pageSize了，则认定为最后一页了
  const isLastPage = computed(
    () => {
      const dataRaw = dehydrate(requestDataRef);
      if (!dataRaw) {
        return trueValue;
      }
      const statesDataVal = listDataGetter(dataRaw);
      const pageVal = dehydrate(page);
      const pageCountVal = dehydrate(pageCount);
      const dataLen = isArray(statesDataVal) ? len(statesDataVal) : 0;
      return pageCountVal ? pageVal >= pageCountVal : dataLen < dehydrate(pageSize);
    },
    batchExport(page, pageCount, states.data, pageSize),
    trueValue
  );

  // 更新当前页缓存
  const updateCurrentPageCache = () => {
    const snapshotItem = getSnapshotMethods(dehydrate(page));
    snapshotItem &&
      setCache(snapshotItem.entity, rawData => {
        // 当关闭缓存时，rawData为undefined
        if (rawData) {
          const cachedListData = listDataGetter(rawData) || [];
          splice(cachedListData, 0, len(cachedListData), ...dehydrate(data));
          return rawData;
        }
      });
  };

  // 初始化fetcher
  const fetchStates = useFetcher({
    __referingObj: referingObject,
    force: forceFetch => forceFetch
  });
  const { fetching, fetch, abort: abortFetch, onSuccess: onFetchSuccess } = fetchStates;
  const fetchingRef = useRequestRefState$(fetching);
  onFetchSuccess(({ method, data: rawData }) => {
    // 处理当fetch还没响应时就翻页到fetch对应的页码时，需要手动更新列表数据
    const snapshotItem = getSnapshotMethods(dehydrate(page));
    if (snapshotItem && getMethodKey(snapshotItem.entity) === getMethodKey(method)) {
      // 如果追加数据，才更新data
      const listData = listDataGetter(rawData); // 更新data参数
      if (append) {
        // 下拉加载时需要替换当前页数据
        const dataRaw = dehydrate(data);
        const pageSizeVal = dehydrate(pageSize);

        // 当做移除操作时，替换的数量小于pageSize，此时dataRaw % pageSizeVal会大于0
        // 当新增操作时，替换的数量等于pageSize，此时dataRaw % pageSizeVal会等于0，此时不需要替换
        const replaceNumber = len(dataRaw) % pageSizeVal;

        if (replaceNumber > 0) {
          const rawData = dehydrate(data);
          splice(rawData, (dehydrate(page) - 1) * pageSizeVal, replaceNumber, ...listData);
          setData(rawData);
        }
      } else {
        setData(listData);
      }
    }
  });
  states.onSuccess(({ data: rawData, sendArgs: [refreshPage, isRefresh], method }) => {
    const { total: cachedTotal } = getSnapshotMethods(method) || {};
    setTotal(cachedTotal !== undefinedValue ? cachedTotal : totalGetter(rawData));
    if (!isRefresh) {
      fetchPreviousPage(rawData);
      fetchNextPage(rawData);
    }

    const pageSizeVal = dehydrate(pageSize);
    const listData = listDataGetter(rawData); // 获取数组
    paginationAssert(isArray(listData), 'Got wrong array, did you return the correct array of list in `data` function');

    // 如果追加数据，才更新data
    if (append) {
      // 如果是reset则先清空数据
      isReset.current && setData([]);
      if (refreshPage === undefinedValue) {
        setData([...dehydrate(data), ...listData]);
      } else if (refreshPage) {
        // 如果是刷新页面，则是替换那一页的数据
        setData(rawd => {
          splice(rawd, (refreshPage - 1) * pageSizeVal, pageSizeVal, ...listData);
          return rawd;
        });
      }
    } else {
      setData(listData);
    }
  });

  // 请求成功与否，都要重置它们
  states.onComplete(() => {
    isReset.current = falseValue;
    requestCountInReseting.current = 0;
  });

  // 获取列表项所在位置
  const getItemIndex = item => {
    const index = dehydrate(data).indexOf(item);
    paginationAssert(index >= 0, 'item is not found in list');
    return index;
  };

  /**
   * 刷新指定页码数据，此函数将忽略缓存强制发送请求
   * 如果未传入页码则会刷新当前页
   * 如果传入一个列表项，将会刷新此列表项所在页，只对append模式有效
   * @param pageOrItemPage 刷新的页码或列表项
   */
  const refresh = memorize((pageOrItemPage = dehydrate(page)) => {
    let refreshPage = pageOrItemPage;
    if (append) {
      if (!isNumber(pageOrItemPage)) {
        const itemIndex = getItemIndex(pageOrItemPage);
        refreshPage = Math.floor(itemIndex / dehydrate(pageSize)) + 1;
      }
      paginationAssert(refreshPage <= dehydrate(page), "refresh page can't greater than page");
      // 更新当前页数据
      promiseCatch(send(refreshPage, trueValue), noop);
    } else {
      paginationAssert(isNumber(refreshPage), 'unable to calculate refresh page by item in pagination mode');
      // 页数相等，则刷新当前页，否则fetch数据
      promiseCatch(
        refreshPage === dehydrate(page) ? send(undefinedValue, trueValue) : fetch(handler(refreshPage, dehydrate(pageSize)), trueValue),
        noop
      );
    }
  });

  const removeSyncRunner = ref(createSyncOnceRunner()).current;
  // 删除除此usehook当前页和下一页的所有相关缓存
  const invalidatePaginationCache = (all = falseValue) => {
    const pageVal = dehydrate(page);
    const snapshotObj = methodSnapshots();
    let snapshots = objectValues(snapshotObj);
    if (all) {
      removeSnapshot();
    } else {
      // 筛选出上一页、当前页、下一页的数据
      const excludeSnapshotKeys = map(
        filterItem([getSnapshotMethods(pageVal - 1), getSnapshotMethods(pageVal), getSnapshotMethods(pageVal + 1)], Boolean),
        ({ entity }) => getMethodKey(entity)
      );
      snapshots = map(
        filterItem(objectKeys(snapshotObj), key => !includes(excludeSnapshotKeys, key)),
        key => {
          const item = snapshotObj[key];
          delete snapshotObj[key];
          return item;
        }
      );
    }
    invalidateCache(map(snapshots, ({ entity }) => entity));
  };

  // 单独拿出来的原因是
  // 无论同步调用几次insert、remove，或它们组合调用，reset操作只需要异步执行一次
  const resetSyncRunner = ref(createSyncOnceRunner()).current;
  const resetCache = () =>
    resetSyncRunner(() => {
      dehydrate(fetchingRef) && abortFetch();
      // 缓存失效
      invalidatePaginationCache();

      // 当下一页的数据量不超过pageSize时，强制请求下一页，因为有请求共享，需要在中断请求后异步执行拉取操作
      setTimeoutFn(() => {
        const snapshotItem = getSnapshotMethods(dehydrate(page) + 1);
        if (snapshotItem) {
          const cachedListData = listDataGetter(queryCache(snapshotItem.entity) || {}) || [];
          fetchNextPage(undefinedValue, len(cachedListData) < dehydrate(pageSize));
        }
      });
    });

  // 统一更新总条数
  const updateTotal = (offset: number) => {
    // 更新当前页
    const totalVal = dehydrate(total);
    if (isNumber(totalVal)) {
      const offsetedTotal = Math.max(totalVal + offset, 0);
      setTotal(offsetedTotal);
      const pageVal = dehydrate(page);

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
  const insert = memorize((item, position = 0) => {
    const index = isNumber(position) ? position : getItemIndex(position) + 1;
    let popItem = undefinedValue;
    const rawData = dehydrate(data);
    // 当前展示的项数量刚好是pageSize的倍数时，才需要去掉一项数据，保证操作页的数量为pageSize
    if (len(rawData) % dehydrate(pageSize) === 0) {
      popItem = rawData.pop();
    }
    // 插入位置为空默认插到最前面
    splice(rawData, index, 0, item);
    setData(rawData);

    updateTotal(1);

    // 当前页的缓存同步更新
    updateCurrentPageCache();

    // 如果有pop项，将它放到下一页缓存的头部，与remove的操作保持一致
    // 这样在同步调用insert和remove时表现才一致
    if (popItem) {
      const snapshotItem = getSnapshotMethods(dehydrate(page) + 1);
      snapshotItem &&
        setCache(snapshotItem.entity, rawData => {
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
  });

  /**
   * 移除一条数据
   * 如果传入的是列表项，将移除此列表项，如果列表项未在列表数据中将会抛出错误
   * @param position 移除的索引或列表项
   */
  let tempData; // 临时保存的数据，以便当需要重新加载时用于数据恢复
  const remove = memorize(position => {
    const index = isNumber(position) ? position : getItemIndex(position);
    indexAssert(index, dehydrate(data));
    const pageVal = dehydrate(page);
    const nextPage = pageVal + 1;
    const snapshotItem = getSnapshotMethods(nextPage);
    let fillingItem = undefinedValue; // 补位数据项
    snapshotItem &&
      setCache(snapshotItem.entity, rawData => {
        if (rawData) {
          const cachedListData = listDataGetter(rawData);
          // 从下一页列表的头部开始取补位数据
          fillingItem = shift(cachedListData || []);
          return rawData;
        }
      });

    const isLastPageVal = dehydrate(isLastPage);
    if (fillingItem || isLastPageVal) {
      // 如果有下一页数据则通过缓存数据补位
      if (!tempData) {
        tempData = [...dehydrate(data)];
      }
      if (index >= 0) {
        const rawData = dehydrate(data);
        splice(rawData, index, 1);
        // 如果有下一页的补位数据才去补位，因为有可能是最后一页才进入删除的
        fillingItem && pushItem(rawData, fillingItem);
        setData(rawData);
      }
    } else if (tempData) {
      setData(tempData); // 当移除项数都用完时还原数据，减少不必要的视图渲染
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
      if (!append && isLastPageVal && len(dehydrate(data)) <= 0) {
        setPage(pageVal - 1); // 翻页模式下，如果是最后一页且全部项被删除了，则往前翻一页
      }
      tempData = undefinedValue;
    });
  });

  /**
   * 替换一条数据
   * 如果position传入的是列表项，将替换此列表项，如果列表项未在列表数据中将会抛出错误
   * @param item 替换项
   * @param position 替换位置（索引）或列表项
   */
  const replace = memorize((item, position) => {
    paginationAssert(position !== undefinedValue, 'must specify replace position');
    const index = isNumber(position) ? position : getItemIndex(position);
    indexAssert(index, dehydrate(data));
    const rawData = dehydrate(data);
    splice(rawData, index, 1, item);
    setData(rawData);
    // 当前页的缓存同步更新
    updateCurrentPageCache();
  });

  /**
   * 从第${initialPage}页开始重新加载列表，并清空缓存
   */
  const reload = memorize(() => {
    invalidatePaginationCache(trueValue);
    isReset.current = trueValue;
    dehydrate(page) === initialPage ? promiseCatch(send(), noop) : setPage(initialPage);
  });

  // 兼容react，每次缓存最新的操作函数，避免闭包陷阱
  delegationActions.current = {
    refresh,
    insert,
    remove,
    replace,
    reload
  };
  /** @Returns */
  return {
    ...states,

    fetching: fetchStates.fetching,
    onFetchSuccess: fetchStates.onSuccess,
    onFetchError: fetchStates.onError,
    onFetchComplete: fetchStates.onComplete,

    ...exportObject(
      {
        data,
        page,
        pageCount,
        pageSize,
        total,
        isLastPage
      },
      states
    ),

    refresh,
    insert,
    remove,
    replace,
    reload
  };
};
