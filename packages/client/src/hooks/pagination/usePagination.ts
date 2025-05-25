import useFetcher from '@/hooks/core/useFetcher';
import useWatcher from '@/hooks/core/useWatcher';
import { statesHookHelper } from '@/util/helper';
import {
  GeneralFn,
  MEMORY,
  createAssert,
  createAsyncQueue,
  falseValue,
  filterItem,
  forEach,
  getLocalCacheConfigParam,
  getMethodInternalKey,
  getTime,
  includes,
  isArray,
  isFn,
  isNumber,
  len,
  mapItem,
  noop,
  objectKeys,
  objectValues,
  promiseCatch,
  promiseResolve,
  pushItem,
  setTimeoutFn,
  splice,
  trueValue,
  undefinedValue,
  usePromise
} from '@alova/shared';
import { Alova, AlovaGenerics, Method, invalidateCache, promiseStatesHook, queryCache, setCache } from 'alova';
import { FetcherType, PaginationHookConfig } from '~/typings/clienthook';
import createSnapshotMethodsManager from './createSnapshotMethodsManager';

const paginationAssert = createAssert('usePagination');
const indexAssert = (index: number, rawData: any[]) =>
  paginationAssert(isNumber(index) && index < len(rawData), 'index must be a number that less than list length');

const parseSendArgs = (args: any[]) => [
  args[args.length - 2], // refreshPage
  args[args.length - 1], // isRefresh
  args.slice(0, args.length - 2) // send args
];

export default <AG extends AlovaGenerics, ListData extends unknown[]>(
  handler: (page: number, pageSize: number, ...args: any[]) => Method<AG>,
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
    middleware,
    force = noop,
    ...others
  } = config;

  const handlerRef = ref<typeof handler>(handler);
  const isReset = ref(falseValue); // Used to control whether to reset
  // The number of requests during reset. In order to prevent repeated requests during reset, use this parameter to limit requests.
  const page = create(initialPage, 'page');
  const pageSize = create(initialPageSize, 'pageSize');
  const data = create((initialData ? dataGetter(initialData) || [] : []) as ListData[number][], 'data');
  const total = create(initialData ? totalGetter(initialData) : undefinedValue, 'total');
  // Save snapshots of all method instances used by the current hook
  const {
    snapshots: methodSnapshots,
    get: getSnapshotMethods,
    save: saveSnapshot,
    remove: removeSnapshot
  } = ref(createSnapshotMethodsManager<AG>(page => handlerRef.current(page, pageSize.v))).current;
  const listDataGetter = (rawData: any) => dataGetter(rawData) || rawData;
  // Initialize fetcher
  const fetchStates = useFetcher<FetcherType<Alova<AG>>>({
    __referingObj: referingObject,
    updateState: falseValue,
    force: ({ args }) => args[len(args) - 1]
  });
  const { loading, fetch, abort: abortFetch, onSuccess: onFetchSuccess } = fetchStates;
  const fetchingRef = ref(loading);

  const getHandlerMethod = (refreshPage: number = page.v, customArgs: any[] = []) => {
    const handlerMethod = handler(refreshPage, pageSize.v, ...customArgs);

    // Define unified additional names to facilitate management
    saveSnapshot(handlerMethod);
    return handlerMethod;
  };
  // When monitoring status changes, reset page to 1
  watch(watchingStates, () => {
    page.v = initialPage;
    isReset.current = trueValue;
  });

  // Compatible with react, store functions that require proxy here
  // In this way, the latest operation function can be called in the proxy function and avoid the react closure trap.
  const delegationActions = ref<Record<string, GeneralFn>>({});
  // Calculate data, total, is last page parameters
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
  const states = useWatcher(
    (...args: any[]) => {
      const [refreshPage, , customArgs] = parseSendArgs(args);
      return getHandlerMethod(refreshPage, customArgs);
    },
    [...watchingStates, page.e, pageSize.e],
    {
      __referingObj: referingObject,
      immediate,
      initialData,
      managedStates: objectify([data, page, pageSize, total], 's'),
      middleware(ctx, next) {
        if (!middleware) {
          return next();
        }

        return middleware(
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
          next
        );
      },
      force: event => event.args[1] || (isFn(force) ? (force(event) as boolean) : force),
      ...others
    }
  );
  const { send } = states;
  const nestedData = states.__proxyState('data');

  // Determine whether data can be preloaded
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

    const pageCountVal = pageCount.v;
    const exceedPageCount = pageCountVal
      ? preloadPage > pageCountVal
      : isNextPage // If it is judged to preload the next page of data and there is no page count, it is judged by whether the data volume of the last page reaches the page size.
        ? len(listDataGetter(rawData)) < pageSize.v
        : falseValue;
    const isMatchPageScope = preloadPage > 0 && !exceedPageCount;

    if (!isMatchPageScope) {
      return falseValue;
    }

    const { e: expireMilliseconds } = getLocalCacheConfigParam(fetchMethod);
    const hasCache = await queryCache(fetchMethod);

    // If the cache time is less than or equal to the current time, it means that the cache is not set and the data will no longer be pre-pulled at this time.
    // Or there is already a cache and it is not pre-fetched.
    return expireMilliseconds(MEMORY) <= getTime() ? falseValue : forceRequest || !hasCache;
  };

  // Preload next page data
  const fetchNextPage = async (rawData: any[] | undefined, force: boolean, customArgs: any[] = []) => {
    const nextPage = page.v + 1;
    const fetchMethod = getHandlerMethod(nextPage, customArgs);
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
      promiseCatch(fetch(fetchMethod as Method, ...customArgs, force), noop);
    }
  };
  // Preload previous page data
  const fetchPreviousPage = async (rawData: any[], customArgs: any[] = []) => {
    const prevPage = page.v - 1;
    const fetchMethod = getHandlerMethod(prevPage, customArgs);
    if (
      preloadPreviousPage &&
      (await canPreload({
        rawData,
        preloadPage: prevPage,
        fetchMethod
      }))
    ) {
      promiseCatch(fetch(fetchMethod as Method, ...customArgs, undefinedValue), noop);
    }
  };

  /**
   * fix #685
   * @see {https://github.com/alovajs/alova/issues/685}
   */
  const isLastPage = create(falseValue, 'isLastPage');
  // If the returned data is smaller than the page size, it is considered the last page.
  watch([page, pageCount, nestedData, pageSize], () => {
    // the reason why setTimeout is used is that needed to wait for the `loading` state to be updated.
    setTimeoutFn(() => {
      const dataRaw = nestedData.v;
      if (!dataRaw) {
        isLastPage.v = trueValue;
        return;
      }
      const statesDataVal = listDataGetter(dataRaw as any[]);
      const pageVal = page.v;
      const pageCountVal = pageCount.v;
      const dataLen = isArray(statesDataVal) ? len(statesDataVal) : 0;
      isLastPage.v = pageCountVal ? pageVal >= pageCountVal : dataLen < pageSize.v;
    });
  });

  // Update current page cache
  const updateCurrentPageCache = async () => {
    const snapshotItem = getSnapshotMethods(page.v);
    if (snapshotItem) {
      await setCache(snapshotItem.entity, (rawData: any[]) => {
        // When caching is turned off, raw data is undefined
        if (rawData) {
          const cachedListData = listDataGetter(rawData) || [];
          splice(cachedListData, 0, len(cachedListData), ...data.v);
          return rawData;
        }
      });
    }
  };

  onFetchSuccess(({ method, data: rawData }) => {
    // When fetch has not responded yet and the page is flipped to the page number corresponding to fetch, the list data needs to be updated manually.
    const snapshotItem = getSnapshotMethods(page.v);
    if (snapshotItem && getMethodInternalKey(snapshotItem.entity) === getMethodInternalKey(method)) {
      // If data is appended, data is updated
      const listData = listDataGetter(rawData); // Update data parameters
      if (append) {
        // The current page data needs to be replaced during pull-down loading.
        const dataRaw = data.v;
        const pageSizeVal = pageSize.v;

        // When performing a removal operation, the number of replacements is less than pageSize, and dataRaw % pageSizeVal will be greater than 0.
        // When adding a new operation, the number of replacements is equal to pageSize. At this time, dataRaw % pageSizeVal will be equal to 0. No replacement is needed at this time.
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

  const awaitResolve = ref(undefinedValue as GeneralFn | undefined);
  const awaitReject = ref(undefinedValue as GeneralFn | undefined);
  states
    .onSuccess(({ data: rawData, args, method }) => {
      const [refreshPage, isRefresh, customArgs] = parseSendArgs(args);
      const { total: cachedTotal } = getSnapshotMethods(method) || {};
      const typedRawData = rawData as any[];
      total.v = cachedTotal !== undefinedValue ? cachedTotal : totalGetter(typedRawData);
      if (!isRefresh) {
        fetchPreviousPage(typedRawData, customArgs);
        fetchNextPage(typedRawData, falseValue, customArgs);
      }

      const pageSizeVal = pageSize.v;
      const listData = listDataGetter(typedRawData); // Get array
      paginationAssert(
        isArray(listData),
        'Got wrong array, did you return the correct array of list in `data` function'
      );

      // If data is appended, data is updated
      if (append) {
        // If it is reset, clear the data first
        if (isReset.current) {
          data.v = [];
        }
        if (refreshPage === undefinedValue) {
          data.v = [...data.v, ...listData];
        } else if (refreshPage) {
          const rawData = [...data.v];
          // If the page is refreshed, the data on that page is replaced.
          splice(rawData, (refreshPage - 1) * pageSizeVal, pageSizeVal, ...listData);
          data.v = rawData;
        }
      } else {
        data.v = listData;
      }
    })
    .onSuccess(({ data }) => {
      awaitResolve.current?.(data);
    })
    .onError(({ error }) => {
      awaitReject.current?.(error);
    })
    .onComplete(() => {
      // Whether the request is successful or not, it must be reset is reset
      isReset.current = falseValue;
    });

  // Get the location of a list item
  const getItemIndex = (item: ListData[number]) => {
    const index = data.v.indexOf(item);
    paginationAssert(index >= 0, 'item is not found in list');
    return index;
  };

  const { addQueue: add2AsyncQueue, onComplete: onAsyncQueueRunComplete } = ref(createAsyncQueue()).current;

  /**
   * Refresh the specified page number data. This function will ignore the cache and force the request to be sent.
   * If no page number is passed in, the current page will be refreshed.
   * If a list item is passed in, the page where the list item is located will be refreshed, which is only valid in append mode.
   * @param pageOrItemPage Refreshed page number or list item
   */
  const refresh = async (pageOrItemPage: number | ListData[number] = page.v) => {
    let refreshPage = pageOrItemPage as number;
    let awaitPromise = promiseResolve<AG['Responded']>();
    if (append) {
      if (!isNumber(pageOrItemPage)) {
        const itemIndex = getItemIndex(pageOrItemPage);
        refreshPage = Math.floor(itemIndex / pageSize.v) + 1;
      }
      paginationAssert(refreshPage <= page.v, "refresh page can't greater than page");
      // Update current page data
      awaitPromise = send(refreshPage, trueValue);
    } else {
      paginationAssert(isNumber(refreshPage), 'unable to calculate refresh page by item in pagination mode');
      // If the number of pages is equal, refresh the current page, otherwise fetch data
      awaitPromise =
        refreshPage === page.v
          ? send(undefinedValue, trueValue)
          : fetch(handler(refreshPage, pageSize.v) as Method, trueValue);
    }
    return awaitPromise;
  };

  // Delete all related caches except the current page and next page of this usehook
  const invalidatePaginationCache = async (all = falseValue) => {
    const pageVal = page.v;
    const snapshotObj = methodSnapshots();
    let snapshots = objectValues(snapshotObj);
    if (all) {
      removeSnapshot();
    } else {
      // Filter out data from the previous page, current page, and next page
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

  // The reason for taking it out separately is that
  // No matter how many times insert, remove, or a combination of them is called synchronously, the reset operation only needs to be executed asynchronously once
  const resetCache = async () => {
    fetchingRef.current && abortFetch();
    // cache invalidation
    await invalidatePaginationCache();

    // When the amount of data on the next page does not exceed the page size, the next page is forced to be requested. Because there is a request for sharing, the fetching needs to be performed asynchronously after interrupting the request.
    const snapshotItem = getSnapshotMethods(page.v + 1);
    if (snapshotItem) {
      const cachedListData = listDataGetter((await queryCache(snapshotItem.entity)) || {}) || [];
      fetchNextPage(undefinedValue, len(cachedListData) < pageSize.v);
    }
  };

  // Unified update of total number of items
  const updateTotal = (offset: number) => {
    if (offset === 0) {
      return;
    }
    // Update current page
    const totalVal = total.v;
    if (isNumber(totalVal)) {
      const offsetedTotal = Math.max(totalVal + offset, 0);
      total.v = offsetedTotal;
      const pageVal = page.v;

      // Update redundant total field
      forEach([getSnapshotMethods(pageVal - 1), getSnapshotMethods(pageVal), getSnapshotMethods(pageVal + 1)], item => {
        item && (item.total = offsetedTotal);
      });
    }
  };

  /**
   * Insert a piece of data
   * If no index is passed in, it will be inserted at the front by default.
   * If a list item is passed in, it will be inserted after the list item. If the list item is not in the list data, an error will be thrown.
   * @param item insert
   * @param position Insert position (index) or list item
   */
  const insert = (item: ListData extends any[] ? ListData[number] : any, position: number | ListData[number] = 0) => {
    onAsyncQueueRunComplete(resetCache); // The cache needs to be reset at the end of execution
    return add2AsyncQueue(async () => {
      const index = isNumber(position) ? position : getItemIndex(position) + 1;
      let popItem: ListData[number] | undefined = undefinedValue;
      const rawData = [...data.v];
      // Only when the number of items currently displayed is exactly a multiple of page size, you need to remove an item of data to ensure that the number of operating pages is page size.
      if (len(rawData) % pageSize.v === 0) {
        popItem = rawData.pop();
      }
      // If the insertion position is empty, it will be inserted to the front by default.
      splice(rawData, index, 0, item);
      data.v = rawData;

      updateTotal(1);

      // The cache of the current page is updated synchronously
      await updateCurrentPageCache();

      // If there is a pop item, put it at the head of the next page cache, consistent with the remove operation.
      // In this way, the performance will be consistent when insert and remove are called synchronously.
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
   * Remove a piece of data
   * If a list item is passed in, the list item will be removed. If the list item is not in the list data, an error will be thrown.
   * @param position Removed index or list item
   */
  const remove = (...positions: (number | ListData[number])[]) => {
    onAsyncQueueRunComplete(resetCache); // The cache needs to be reset at the end of execution
    return add2AsyncQueue(async () => {
      const indexes = mapItem(positions, position => {
        const index = isNumber(position) ? position : getItemIndex(position);
        indexAssert(index, data.v);
        return index;
      });
      const pageVal = page.v;
      const nextPage = pageVal + 1;
      const snapshotItem = getSnapshotMethods(nextPage);
      const fillingItems: ListData[number][] = []; // padding data item
      if (snapshotItem) {
        await setCache(snapshotItem.entity, (rawData: any) => {
          if (rawData) {
            const cachedListData = listDataGetter(rawData);
            // Start filling data from the head of the list on the next page
            if (isArray(cachedListData)) {
              pushItem(fillingItems, ...splice(cachedListData, 0, len(indexes)));
            }
            return rawData;
          }
        });
      }

      const isLastPageVal = isLastPage.v;
      const fillingItemsLen = len(fillingItems);
      let isLastEmptyPageInNonAppendMode = false;
      if (fillingItemsLen > 0 || isLastPageVal) {
        // Delete data at the specified index
        const newListData = filterItem(data.v, (_, index) => !includes(indexes, index));

        // In page turning mode, if it is the last page and all items have been deleted, then turn one page forward.
        isLastEmptyPageInNonAppendMode = !append && isLastPageVal && len(newListData) <= 0;
        if (!isLastEmptyPageInNonAppendMode && fillingItemsLen > 0) {
          pushItem(newListData, ...fillingItems);
        }
        data.v = newListData;
      } else if (fillingItemsLen <= 0 && !isLastPageVal) {
        // When the last page of data is removed, there is no need to refresh
        refresh(pageVal);
      }

      updateTotal(-len(indexes));
      // The cache of the current page is updated synchronously
      return updateCurrentPageCache().then(() => {
        if (isLastEmptyPageInNonAppendMode) {
          page.v = pageVal - 1;
        }
      });
    });
  };
  /**
   * Replace a piece of data
   * If the position passed in is a list item, this list item will be replaced. If the list item is not in the list data, an error will be thrown.
   * @param item replacement
   * @param position Replace position (index) or list item
   */
  const replace = (item: ListData extends any[] ? ListData[number] : any, position: number | ListData[number]) =>
    add2AsyncQueue(async () => {
      paginationAssert(position !== undefinedValue, 'expect specify the replace position');
      const index = isNumber(position) ? position : getItemIndex(position);
      indexAssert(index, data.v);
      const rawData = [...data.v];
      splice(rawData, index, 1, item);
      data.v = rawData;
      // The cache of the current page is updated synchronously
      await updateCurrentPageCache();
    });

  /**
   * Reload the list starting from page ${initialPage} and clear the cache
   */
  const reload = async () => {
    await invalidatePaginationCache(trueValue);
    isReset.current = trueValue;
    page.v === initialPage ? promiseCatch(send(), noop) : (page.v = initialPage);
    const { resolve, reject, promise } = usePromise<AG['Responded']>();
    awaitResolve.current = resolve;
    awaitReject.current = reject;
    return promise;
  };

  // Compatible with react, caches the latest operation function each time, avoiding closure traps
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
    send: (...args: any[]) => send(...args, undefinedValue, undefinedValue),

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
