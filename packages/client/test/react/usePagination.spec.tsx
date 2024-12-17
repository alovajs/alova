import { mockRequestAdapter, setMockListData, setMockListWithSearchData, setMockShortListData } from '#/mockData';
import { accessAction, actionDelegationMiddleware, updateState } from '@/index';
import reactHook from '@/statesHook/react';
import { GeneralFn } from '@alova/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createAlova, invalidateCache, queryCache } from 'alova';
import { Dispatch, SetStateAction, act, useState } from 'react';
import { delay, generateContinuousNumbers } from 'root/testUtils';
import Pagination from './components/Pagination';

interface ListResponse {
  total: number;
  list: number[];
}
interface SearchListResponse {
  total: number;
  list: { id: number; word: string }[];
}

type ReactPossibleState<D> = [D, Dispatch<SetStateAction<D>>] | undefined;
// vi.setConfig({ testTimeout: 1000_000 });
// reset data
beforeEach(async () => {
  setMockListData();
  setMockListWithSearchData();
  setMockShortListData();
  await invalidateCache();
});
const alovaInst = createAlova({
  baseURL: process.env.NODE_BASE_URL,
  statesHook: reactHook,
  requestAdapter: mockRequestAdapter,
  cacheLogger: false
});
interface ListResponse {
  total: number;
  list: number[];
}
const getter1 = (page: number, pageSize: number, extra: Record<string, any> = {}, transform?: GeneralFn) =>
  alovaInst.Get<ListResponse>('/list', {
    params: {
      page,
      pageSize,
      ...extra
    },
    transform
  });
interface SearchListResponse {
  total: number;
  list: { id: number; word: string }[];
}
const getterSearch = (page: number, pageSize: number, keyword?: string) =>
  alovaInst.Get<SearchListResponse>('/list-with-search', {
    params: {
      page,
      pageSize,
      keyword
    }
  });
const getterShort = (page: number, pageSize: number, cacheFor?: number) => {
  const config = {
    params: {
      page,
      pageSize
    }
  };
  if (cacheFor !== undefined) {
    (config as any).cacheFor = cacheFor;
  }
  return alovaInst.Get<ListResponse>('/list-short', config);
};
describe('react => usePagination', () => {
  // Pagination related tests
  test('load paginated data and change page/pageSize', async () => {
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          total: (res: any) => res.total,
          data: (res: any) => res.list
        }}
      />
    );

    const page = 1;
    const pageSize = 10;
    await waitFor(() => {
      expect(screen.getByRole('page')).toHaveTextContent('1');
      expect(screen.getByRole('pageSize')).toHaveTextContent('10');
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(9)));
      expect(screen.getByRole('total')).toHaveTextContent('300');
      expect(screen.getByRole('pageCount')).toHaveTextContent('30');
      expect(screen.getByRole('isLastPage')).toHaveTextContent('false');
    });

    // Check preload cache
    await waitFor(async () => {
      let cache = await queryCache(getter1(page + 1, pageSize));
      expect(cache?.list).toStrictEqual(generateContinuousNumbers(19, 10));
      cache = await queryCache(getter1(page - 1, pageSize));
      expect(cache).toBeUndefined();
    });

    fireEvent.click(screen.getByRole('setPage'));
    await waitFor(() => {
      expect(screen.getByRole('page')).toHaveTextContent('2');
      expect(screen.getByRole('pageSize')).toHaveTextContent('10');
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(19, 10)));
      expect(screen.getByRole('total')).toHaveTextContent('300');
      expect(screen.getByRole('pageCount')).toHaveTextContent('30');
      expect(screen.getByRole('isLastPage')).toHaveTextContent('false');
    });

    fireEvent.click(screen.getByRole('setPageSize'));
    await waitFor(() => {
      expect(screen.getByRole('page')).toHaveTextContent('2');
      expect(screen.getByRole('pageSize')).toHaveTextContent('20');
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(39, 20)));
      expect(screen.getByRole('total')).toHaveTextContent('300');
      expect(screen.getByRole('pageCount')).toHaveTextContent('15');
      expect(screen.getByRole('isLastPage')).toHaveTextContent('false');
    });

    // Check preload cache
    await waitFor(async () => {
      let cache = await queryCache(getter1(3, 20));
      expect(cache?.list).toStrictEqual(generateContinuousNumbers(59, 40));
      cache = await queryCache(getter1(1, 20));
      expect(cache?.list).toStrictEqual(generateContinuousNumbers(19));
    });

    // last page
    fireEvent.click(screen.getByRole('setLastPage'));
    await waitFor(async () => {
      expect(screen.getByRole('isLastPage')).toHaveTextContent('true');
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(299, 280)));
      let cache = await queryCache(getter1(16, 20));
      expect(cache).toBeUndefined();
      cache = await queryCache(getter1(14, 20));
      expect(cache?.list).toStrictEqual(generateContinuousNumbers(279, 260));
    });
  });

  test('should clear the cache when reload', async () => {
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          total: (res: any) => res.total,
          data: (res: any) => res.list
        }}
      />
    );

    const page = 1;
    const pageSize = 10;
    await waitFor(() => {
      expect(screen.getByRole('page')).toHaveTextContent('1');
      expect(screen.getByRole('pageSize')).toHaveTextContent('10');
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(9)));
      expect(screen.getByRole('total')).toHaveTextContent('300');
      expect(screen.getByRole('pageCount')).toHaveTextContent('30');
      expect(screen.getByRole('isLastPage')).toHaveTextContent('false');
    });

    // Check preload cache
    await waitFor(async () => {
      let cache = await queryCache(getter1(page + 1, pageSize));
      expect(cache?.list).toStrictEqual(generateContinuousNumbers(19, 10));
      cache = await queryCache(getter1(page - 1, pageSize));
      expect(cache).toBeUndefined();
    });

    fireEvent.click(screen.getByRole('reload1'));
    await waitFor(async () => {
      let cache = await queryCache(getter1(page + 1, pageSize));
      expect(cache?.list).toBeUndefined();
      cache = await queryCache(getter1(page - 1, pageSize));
      expect(cache).toBeUndefined();
    });
  });

  test('should throws an error when got wrong array', async () => {
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          data: ({ wrongList }: any) => wrongList
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('error')).toHaveTextContent(
        'Got wrong array, did you return the correct array of list in `data` function'
      );
    });
  });

  // Do not send request immediately
  test('should not load paginated data when set `immediate` to false', async () => {
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          total: (res: any) => res.total,
          data: (res: any) => res.list,
          immediate: false
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('page')).toHaveTextContent('1');
      expect(screen.getByRole('pageSize')).toHaveTextContent('10');
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([]));
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
      expect(screen.getByRole('isLastPage')).toHaveTextContent('true');
    });

    fireEvent.click(screen.getByRole('setPage'));
    await waitFor(() => {
      expect(screen.getByRole('page')).toHaveTextContent('2');
      expect(screen.getByRole('pageSize')).toHaveTextContent('10');
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(19, 10)));
      expect(screen.getByRole('total')).toHaveTextContent('300');
      expect(screen.getByRole('pageCount')).toHaveTextContent('30');
      expect(screen.getByRole('isLastPage')).toHaveTextContent('false');
    });
  });

  test('paginated data with conditions search', async () => {
    let keyword: ReactPossibleState<string>;
    render(
      <Pagination
        getter={(page: number, pageSize: number) => getterSearch(page, pageSize, keyword?.[0])}
        paginationConfig={() => {
          keyword = useState('');
          return {
            watchingStates: [keyword[0]],
            total: (res: any) => res.total,
            data: (res: any) => res.list
          };
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(
          generateContinuousNumbers(9, 0, i => {
            const n = i % 3;
            return {
              id: i,
              word: ['aaa', 'bbb', 'ccc'][n]
            };
          })
        )
      );
      expect(screen.getByRole('total')).toHaveTextContent('300');
    });

    fireEvent.click(screen.getByRole('setPage'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(
          generateContinuousNumbers(19, 10, i => {
            const n = i % 3;
            return {
              id: i,
              word: ['aaa', 'bbb', 'ccc'][n]
            };
          })
        )
      );
      expect(screen.getByRole('total')).toHaveTextContent('300');
    });

    act(() => {
      keyword?.[1]('bbb');
    });
    await waitFor(() => {
      JSON.parse(screen.getByRole('response').textContent || '[]').forEach(({ word }: any) => expect(word).toBe('bbb'));
      expect(screen.getByRole('total')).toHaveTextContent('100');
    });
  });

  test('paginated data refersh page', async () => {
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          total: (res: any) => res.total,
          data: (res: any) => res.list,
          initialPage: 3
        }}
      />
    );

    setMockListData(data => {
      // Modify the first data on page 3
      data.splice(20, 1, 200);
      return data;
    });

    fireEvent.click(screen.getByRole('refreshCurPage'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(generateContinuousNumbers(29, 20, i => (i === 20 ? 200 : i)))
      );
    });

    // Modify data on page 1
    setMockListData(data => {
      data.splice(0, 1, 100);
      return data;
    });
    fireEvent.click(screen.getByRole('refresh1')); // In page turning mode, fetch will be used instead of the current page.
    const awaitResultEl = await screen.findByRole('awaitResult');
    expect(awaitResultEl).toHaveTextContent('resolve');
    await waitFor(async () => {
      const cache = await queryCache(getter1(1, 10));
      expect(cache?.list).toStrictEqual(generateContinuousNumbers(9, 0, i => (i === 0 ? 100 : i)));
    });
  });

  test('paginated data insert item with preload', async () => {
    const fetchMockFn = vi.fn();
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          data: (res: any) => res.list,
          initialPage: 2 // Starts on page 2 by default
        }}
        handleExposure={(exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }}
      />
    );

    const page = 2;
    const pageSize = 10;
    let total = 300;
    // Check preload cache
    await waitFor(async () => {
      let cache = await queryCache(getter1(page + 1, pageSize));
      expect(cache?.list).toStrictEqual(generateContinuousNumbers(29, 20));
      cache = await queryCache(getter1(page - 1, pageSize));
      expect(cache?.list).toStrictEqual(generateContinuousNumbers(9));
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(screen.getByRole('insert300'));
    setMockListData(data => {
      data.splice(10, 0, 300);
      return data;
    });
    total += 1;
    await waitFor(async () => {
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(generateContinuousNumbers(18, 9, { 9: 300 }))
      );
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());

      // Check current page cache
      let cache = await queryCache(getter1(page, pageSize));
      expect(cache?.list).toStrictEqual([300, ...generateContinuousNumbers(18, 10)]);

      // When inserting, the data on the next page will not be fetched again.
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
      cache = await queryCache(getter1(page + 1, pageSize));
      // When inserting, the end of the cache will be removed, so there are still 10 items left.
      expect(cache?.list).toEqual(generateContinuousNumbers(28, 19));
    });

    fireEvent.click(screen.getByRole('batchInsert'));
    total += 3;
    await waitFor(async () => {
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
      const curData = [400, 300, 500, ...generateContinuousNumbers(15, 10), 600];
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(curData));

      // The current page cache must be consistent
      const cache = await queryCache(getter1(page, pageSize));
      expect(cache?.list).toStrictEqual(curData);

      expect(fetchMockFn).toHaveBeenCalledTimes(2); // Insert does not trigger next page preloading
    });

    // After turning to the last page, inserting data will not remove another piece of data.
    fireEvent.click(screen.getByRole('pageToLast'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([299]));
    });
    fireEvent.click(screen.getByRole('insert300'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([300, 299]));
    });
  });

  // When the data is fetched again but it has not yet responded, the page is turned to the fetch page. At this time, the interface also needs to be updated.
  test('should update data when insert and fetch current page', async () => {
    const fetchMockFn = vi.fn();
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          data: (res: any) => res.list,
          initialPage: 2, // Starts on page 2 by default
          initialPageSize: 4
        }}
        handleExposure={(exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }}
      />
    );

    const page = 2;
    const pageSize = 4;
    let total = 300;

    // Indicates successful preloading of data by checking cached data
    await waitFor(async () => {
      let cache = await queryCache(getter1(page - 1, pageSize));
      expect(cache?.list).toStrictEqual(generateContinuousNumbers(3));
      cache = await queryCache(getter1(page + 1, pageSize));
      expect(cache?.list).toEqual(generateContinuousNumbers(11, 8));
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(screen.getByRole('batchInsert1'));
    total += 2;
    // Synchronously delete the simulated data so that the fetch data verification is normal.
    setMockListData(data => {
      data.splice(5, 0, 1000, 1001);
      return data;
    });

    // The next page of data is being fetched again, but there is no response yet. At this time, the page is turned to the next page.
    delay(20).then(() => {
      fireEvent.click(screen.getByRole('setPage'));
    });
    // waiting for fetch
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(9, 6))); // There are two items that have been pushed to the back of the page.
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
      // The five sources are: 2 times during initialization and 1 time when turning the page (the data on the previous page is no longer fetched after turning the page)
      expect(fetchMockFn).toHaveBeenCalledTimes(3);
    });

    // Return to the previous page again, the removed data should not exist
    fireEvent.click(screen.getByRole('subtractPage'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 1000, 1001, 5]));
    });
  });

  test('paginated data replace item', async () => {
    const successMockFn = vi.fn();
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          data: (res: any) => res.list
        }}
        handleExposure={(exposure: any) => {
          exposure.onSuccess(successMockFn);
        }}
      />
    );

    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(screen.getByRole('replaceError1'));
    await waitFor(() => {
      expect(screen.getByRole('replacedError')).toHaveTextContent('expect specify the replace position');
    });
    fireEvent.click(screen.getByRole('replaceError2'));
    await waitFor(() => {
      expect(screen.getByRole('replacedError')).toHaveTextContent('index must be a number that less than list length');
    });

    fireEvent.click(screen.getByRole('replace1'));
    await waitFor(async () => {
      // The first item was replaced
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(generateContinuousNumbers(9, 0, { 0: 300 }))
      );

      // Check current page cache
      expect((await queryCache(getter1(1, 10)))?.list).toEqual(generateContinuousNumbers(9, 0, { 0: 300 }));
    });

    // Forward sequence replacement
    fireEvent.click(screen.getByRole('replace2'));
    await waitFor(async () => {
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(generateContinuousNumbers(9, 0, { 0: 300, 8: 400 }))
      );

      // Check current page cache
      expect((await queryCache(getter1(1, 10)))?.list).toEqual(generateContinuousNumbers(9, 0, { 0: 300, 8: 400 }));
    });

    // Reverse order replacement
    fireEvent.click(screen.getByRole('replace3'));
    await waitFor(async () => {
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(generateContinuousNumbers(9, 0, { 0: 300, 8: 400, 6: 500 }))
      );

      // Check current page cache
      expect((await queryCache(getter1(1, 10)))?.list).toEqual(
        generateContinuousNumbers(9, 0, { 0: 300, 8: 400, 6: 500 })
      );
    });
  });

  test('paginated data replace item by another item', async () => {
    render(
      <Pagination
        getter={getterSearch}
        paginationConfig={{
          total: (res: any) => res.total,
          data: (res: any) => res.list
        }}
      />
    );

    const currentList = generateContinuousNumbers(9, 0, i => {
      const n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
    });

    fireEvent.click(screen.getByRole('replaceError1__search'));
    await waitFor(() => {
      expect(screen.getByRole('replacedError')).toHaveTextContent('item is not found in list');
    });
    fireEvent.click(screen.getByRole('replaceByItem__search'));
    currentList[2] = { id: 100, word: 'zzz' };
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
    });
  });

  test('paginated data insert item without preload', async () => {
    const fetchMockFn = vi.fn();
    const successMockFn = vi.fn();
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          data: (res: any) => res.list,
          preloadNextPage: false,
          preloadPreviousPage: false,
          initialPage: 2 // Starts on page 2 by default
        }}
        handleExposure={(exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
          exposure.onSuccess(successMockFn);
        }}
      />
    );

    const page = 2;
    const pageSize = 10;
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    // Check preload cache
    let cache = await queryCache(getter1(page + 1, pageSize));
    expect(cache).toBeUndefined();
    cache = await queryCache(getter1(page - 1, pageSize));
    expect(cache).toBeUndefined();

    fireEvent.click(screen.getByRole('insert1'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(generateContinuousNumbers(18, 9, { 9: 100 }))
      );
    });

    // Preloading is set to false, so the data on the previous and next pages will not be fetched.
    await delay(100);
    cache = await queryCache(getter1(page + 1, pageSize));
    expect(cache).toBeUndefined();
    cache = await queryCache(getter1(page - 1, pageSize));
    expect(cache).toBeUndefined();
  });

  test('paginated data insert item by another item', async () => {
    render(
      <Pagination
        getter={getterSearch}
        paginationConfig={{
          total: (res: any) => res.total,
          data: (res: any) => res.list
        }}
      />
    );

    const currentList = generateContinuousNumbers(9, 0, i => {
      const n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
    });

    fireEvent.click(screen.getByRole('insertError1__search'));
    await waitFor(() => {
      expect(screen.getByRole('replacedError')).toHaveTextContent('item is not found in list');
    });
    fireEvent.click(screen.getByRole('insertByItem__search'));
    currentList.splice(3, 0, { id: 100, word: 'zzz' });
    currentList.pop();
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
    });
  });

  test('paginated data remove item in preload mode', async () => {
    const fetchMockFn = vi.fn();
    const successMockFn = vi.fn();
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          data: (res: any) => res.list,
          initialPage: 2, // Starts on page 2 by default
          initialPageSize: 4
        }}
        handleExposure={(exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
          exposure.onSuccess(successMockFn);
        }}
      />
    );

    const page = 2;
    const pageSize = 4;
    let total = 300;
    await waitFor(async () => {
      // Check preload cache
      let cache = await queryCache(getter1(page + 1, pageSize));
      expect(!!cache).toBeTruthy();
      cache = await queryCache(getter1(page - 1, pageSize));
      expect(!!cache).toBeTruthy();
    });
    expect(fetchMockFn).toHaveBeenCalledTimes(2); // 2 times during initialization

    // Deleting the second item will fill the space with the data from the next page and re-fetch the data from the previous and next pages.
    fireEvent.click(screen.getByRole('batchRemove1'));
    setMockListData(data => {
      // Synchronously delete the simulated data so that the fetch data verification is normal.
      data.splice(5, 2);
      return data;
    });
    total -= 2;
    // The next page cache has been used for 2 items
    expect((await queryCache(getter1(page + 1, pageSize)))?.list).toStrictEqual([10, 11]);
    await waitFor(async () => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 7, 8, 9]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());

      // The current page cache must be consistent
      expect((await queryCache(getter1(page, pageSize)))?.list).toStrictEqual([4, 7, 8, 9]);
    });

    // Wait for deletion and then re-fetch the next page to complete before continuing.
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(3);
    });

    // The request is sent, but there is no response yet (the response is delayed by 50ms). At this time, it is deleted again. It is expected that the original cache can still be used and the request is interrupted.
    fireEvent.click(screen.getByRole('remove2'));
    setMockListData(data => {
      data.splice(6, 1);
      return data;
    });
    total -= 1;
    // The next page cache is used by 1 more items
    expect((await queryCache(getter1(page + 1, pageSize)))?.list).toStrictEqual([11, 12, 13]);
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 7, 9, 10]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
      expect(fetchMockFn).toHaveBeenCalledTimes(3);
    });

    // Check whether the data of the previous and previous pages has been fetched again
    await waitFor(async () => {
      expect(fetchMockFn).toHaveBeenCalledTimes(4);
      let cache = await queryCache(getter1(page - 1, pageSize));
      expect(cache?.list).toStrictEqual([0, 1, 2, 3]);
      cache = await queryCache(getter1(page + 1, pageSize));
      expect(cache?.list).toStrictEqual([11, 12, 13, 14]);
    });
  });

  test('paginated data remove item by another item', async () => {
    const fetchMockFn = vi.fn();
    render(
      <Pagination
        getter={getterSearch}
        paginationConfig={{
          total: (res: any) => res.total,
          data: (res: any) => res.list
        }}
        handleExposure={(exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }}
      />
    );

    let currentList = generateContinuousNumbers(9, 0, i => {
      const n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
      expect(fetchMockFn).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('removeError1__search'));
    await waitFor(() => {
      expect(screen.getByRole('replacedError')).toHaveTextContent('item is not found in list');
    });
    fireEvent.click(screen.getByRole('removeByItem__search'));

    currentList = generateContinuousNumbers(10, 0, i => {
      const n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    currentList.splice(2, 1);
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
    });
  });

  // When the data is fetched again but there is no response, the page is turned to the page being fetched. At this time, the interface also needs to be updated.
  test('should update data when fetch current page', async () => {
    const fetchMockFn = vi.fn();
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          data: (res: any) => res.list,
          initialPage: 2, // Starts on page 2 by default
          initialPageSize: 4
        }}
        handleExposure={(exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }}
      />
    );

    const page = 2;
    const pageSize = 4;
    let total = 300;
    await waitFor(async () => {
      // Check preload cache
      let cache = await queryCache(getter1(page + 1, pageSize));
      expect(!!cache).toBeTruthy();
      cache = await queryCache(getter1(page - 1, pageSize));
      expect(!!cache).toBeTruthy();
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(screen.getByRole('batchRemove1'));
    total -= 2;
    setMockListData(data =>
      // Synchronously delete the simulated data so that the fetch data verification is normal.
      data.filter((i: number) => ![5, 6].includes(i))
    );

    // The next page of data is being fetched again, but there is no response yet (the response is delayed by 50ms). At this time, the page is turned to the next page.
    delay(10).then(() => {
      fireEvent.click(screen.getByRole('setPage'));
    });
    await waitFor(() => {
      // There are two items used to fill in the data on the previous page.
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([10, 11]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });

    // After Fetch response
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(4); // Initialize 2 times + delete fetch and re-fetch 1 time + fetch next page 1 time after turning the page
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([10, 11, 12, 13]));
    });

    // Return to the previous page again, the removed data should not exist
    fireEvent.click(screen.getByRole('subtractPage'));
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(4); // Both the previous and next pages are cached, no fetch is required.
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 7, 8, 9]));
    });
  });

  test('should use new total data when remove items and go to adjacent page', async () => {
    const fetchMockFn = vi.fn();
    let min: ReactPossibleState<number>;
    render(
      <Pagination
        getter={(page: number, pageSize: number) => getter1(page, pageSize, { min: min?.[0] })}
        paginationConfig={() => {
          min = useState(0);
          return {
            data: (res: any) => res.list,
            watchingStates: [min[0]],
            initialPage: 2, // Starts on page 2 by default
            initialPageSize: 4
          };
        }}
        handleExposure={(exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }}
      />
    );

    const page = 2;
    const pageSize = 4;
    let total = 300;
    // Wait for preloading data to complete
    await waitFor(async () => {
      let cache = await queryCache(
        getter1(page + 1, pageSize, {
          min: min?.[0]
        })
      );
      expect(!!cache).toBeTruthy();
      cache = await queryCache(
        getter1(page - 1, pageSize, {
          min: min?.[0]
        })
      );
      expect(!!cache).toBeTruthy();
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
    });

    // Delete two items, and the total of the previous and next pages will be updated simultaneously.
    fireEvent.click(screen.getByRole('batchRemove1'));
    total -= 2;
    setMockListData(data =>
      // Synchronously delete the simulated data so that the fetch data verification is normal.
      data.filter((i: number) => ![5, 6].includes(i))
    );
    await waitFor(() => {
      // There are two items used to fill in the data on the previous page.
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 7, 8, 9]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
      expect(fetchMockFn).toHaveBeenCalledTimes(2); // Preloading the next page has not been triggered yet
    });

    await delay(10); // Initiate preloading before continuing
    fireEvent.click(screen.getByRole('subtractPage'));
    // Wait for fetch to complete and check whether total is correct
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(3); // Initialization twice, deletion once, no fetch when turning to the first page (the first page does not trigger the preloading of the previous page, and the next page is cached)
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([0, 1, 2, 3]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });

    fireEvent.click(screen.getByRole('setPage2'));
    // Wait for fetch to complete and check whether total is correct
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(4); // Turn the page again + fetch the next page 1 time
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([10, 11, 12, 13]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });

    // Changing the filter will use the latest total
    // Note: After changing the listening conditions, it will be automatically reset to page=initialPage(2)
    act(() => {
      min?.[1](100);
    });
    let totalBackup = total;
    total = 200;
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(6); // Change filter conditions (automatically reset initial page) +2 times
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([104, 105, 106, 107])); // Reset to initial page
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });

    // Delete one
    fireEvent.click(screen.getByRole('remove2'));
    total -= 1;
    totalBackup -= 1;
    setMockListData(data =>
      // Synchronously delete the simulated data so that the fetch data verification is normal.
      data.filter((i: number) => ![106].includes(i))
    );
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(7); // Preload next page +1
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([104, 105, 107, 108]));
      // Check again whether total is correct
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });

    // If the conditions are changed back, you need to delay for a while before continuing the operation.
    await delay(10);
    act(() => {
      min?.[1](0);
    });
    total = totalBackup;
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(9); // The condition is reset, and the number of previous and previous pages + 2 (current initial page) is preloaded.
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 7, 8, 9]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });
  });

  test('paginated data remove short list item without preload', async () => {
    const successMockFn = vi.fn();
    render(
      <Pagination
        getter={getterShort}
        paginationConfig={{
          data: (res: any) => res.list,
          total: (res: any) => res.total,
          initialPage: 3, // Starts on page 3 by default
          initialPageSize: 4,
          preloadNextPage: false,
          preloadPreviousPage: false
        }}
        handleExposure={(exposure: any) => {
          exposure.onSuccess(successMockFn);
        }}
      />
    );

    const page = 3;
    const pageSize = 4;
    let total = 10;

    // Wait for request to succeed
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(screen.getByRole('remove1'));
    total -= 1;
    setMockShortListData(data =>
      // Synchronously delete the simulated data so that the fetch data verification is normal.
      data.filter((i: number) => ![9].includes(i))
    );

    await waitFor(async () => {
      // There are two items used to fill in the data on the previous page.
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([8]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());

      // The current page cache must be consistent
      const cache = await queryCache(getterShort(page, pageSize));
      expect(cache?.list).toStrictEqual([8]);
    });

    fireEvent.click(screen.getByRole('remove0'));
    total -= 1;
    setMockShortListData(data => data.filter((i: number) => ![8].includes(i)));

    // When the last page has no data, it will automatically switch to the previous page.
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('page')).toHaveTextContent('2');
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 5, 6, 7]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });
  });

  test('should refresh current page and will not prefetch when close cache', async () => {
    const fetchMockFn = vi.fn();
    const successMockFn = vi.fn();
    render(
      <Pagination
        getter={(page: number, pageSize: number) => getterShort(page, pageSize, 0)}
        paginationConfig={{
          data: (res: any) => res.list,
          total: (res: any) => res.total,
          initialPage: 2,
          initialPageSize: 4
        }}
        handleExposure={(exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
          exposure.onSuccess(successMockFn);
        }}
      />
    );

    const page = 2;
    const pageSize = 4;
    let total = 10;

    // Wait for request to succeed
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    // Delete data
    fireEvent.click(screen.getByRole('remove1'));
    total -= 1;
    setMockShortListData(data =>
      // Synchronously delete the simulated data so that the fetch data verification is normal.
      data.filter((i: number) => ![5].includes(i))
    );

    await waitFor(async () => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 6, 7, 8]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
      // Caching is currently closed
      expect(await queryCache(getterShort(page, pageSize))).toBeUndefined();
    });

    // Insert data, the data will not be refreshed when inserting
    fireEvent.click(screen.getByRole('insert1'));
    total += 1;
    setMockShortListData(data => {
      data.splice(4, 0, 100);
      return data;
    });

    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([100, 4, 6, 7]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });

    // Replace data
    fireEvent.click(screen.getByRole('replace4'));
    setMockShortListData(data => {
      data.splice(5, 1, 200);
      return data;
    });
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([100, 200, 6, 7]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });
    // When Method does not set a cache, data fetching will not be triggered.
    expect(fetchMockFn).not.toHaveBeenCalled();
  });

  // Pull down to load more related
  test('load more mode paginated data and change page/pageSize', async () => {
    const successMockFn = vi.fn();
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          preloadNextPage: false,
          preloadPreviousPage: false
        }}
        handleExposure={(exposure: any) => {
          exposure.onSuccess(successMockFn);
        }}
      />
    );

    let page = 1;
    const pageSize = 10;

    // Wait for request to succeed
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('page')).toHaveTextContent(page.toString());
      expect(screen.getByRole('pageSize')).toHaveTextContent(pageSize.toString());
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(9)));
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
      expect(screen.getByRole('isLastPage')).toHaveTextContent('false');
    });

    // Check preload cache
    await delay(100);
    expect((await queryCache(getter1(page + 1, pageSize)))?.list).toBeUndefined();

    fireEvent.click(screen.getByRole('setPage'));
    page += 1;
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('page')).toHaveTextContent(page.toString());
      expect(screen.getByRole('pageSize')).toHaveTextContent(pageSize.toString());
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(19))); // Page turning data is appended to the end
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
      expect(screen.getByRole('isLastPage')).toHaveTextContent('false');
    });

    await delay(100);
    expect((await queryCache(getter1(page + 1, pageSize)))?.list).toBeUndefined();

    // Turn the page to a page with no data. When total is not provided and the data is less than page size bar, is last page will be judged as true.
    fireEvent.click(screen.getByRole('toNoDataPage'));
    page = 31;
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(3);
      expect(screen.getByRole('page')).toHaveTextContent(page.toString());
      expect(screen.getByRole('isLastPage')).toHaveTextContent('true');
    });
  });

  test('load more paginated data with conditions search', async () => {
    const fetchMockFn = vi.fn();
    const successMockFn = vi.fn();
    let keyword: ReactPossibleState<string>;
    render(
      <Pagination
        getter={(page: number, pageSize: number) => getterSearch(page, pageSize, keyword?.[0])}
        paginationConfig={() => {
          keyword = useState('');
          return {
            watchingStates: [keyword[0]],
            total: () => undefined,
            data: (res: any) => res.list,
            append: true
          };
        }}
        handleExposure={(exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
          exposure.onSuccess(successMockFn);
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(
          generateContinuousNumbers(9, 0, i => {
            const n = i % 3;
            return {
              id: i,
              word: ['aaa', 'bbb', 'ccc'][n]
            };
          })
        )
      );
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(successMockFn).toHaveBeenCalledTimes(1);
      expect(fetchMockFn).toHaveBeenCalledTimes(1); // Preload only next page
    });

    fireEvent.click(screen.getByRole('setPage'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(
          generateContinuousNumbers(19, 0, i => {
            const n = i % 3;
            return {
              id: i,
              word: ['aaa', 'bbb', 'ccc'][n]
            };
          })
        )
      );
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(fetchMockFn).toHaveBeenCalledTimes(2); // Preload next page +1
    });

    act(() => {
      keyword?.[1]('bbb');
    });
    await waitFor(
      () => {
        const responseWords = JSON.parse(screen.getByRole('response').textContent || '[]').map(({ word }: any) => word);
        expect(responseWords.join('')).toMatch(/^b+$/);
        expect(screen.getByRole('total')).toHaveTextContent('');
        expect(successMockFn).toHaveBeenCalledTimes(3); // Return to first page
        expect(fetchMockFn).toHaveBeenCalledTimes(3); // Preload next page +1
      },
      {
        timeout: 500
      }
    );
  });

  test('load more mode paginated data refersh page by page number', async () => {
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          preloadNextPage: false,
          preloadPreviousPage: false
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(9)));
    });

    fireEvent.click(screen.getByRole('setPage'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(19)));
    });

    fireEvent.click(screen.getByRole('refreshError'));
    await waitFor(() => {
      expect(screen.getByRole('replacedError')).toHaveTextContent("refresh page can't greater than page");
    });

    // Manually change the interface data so that the effect can be seen after refreshing
    setMockListData(data => {
      data.splice(0, 1, 100);
      return data;
    });

    fireEvent.click(screen.getByRole('refresh1'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(generateContinuousNumbers(19, 0, { 0: 100 }))
      );
    });
  });

  test('load more mode paginated data refersh page by item', async () => {
    render(
      <Pagination
        getter={getterSearch}
        paginationConfig={{
          total: (res: any) => res.total,
          data: (res: any) => res.list,
          append: true
        }}
      />
    );

    let currentList = generateContinuousNumbers(9, 0, i => {
      const n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
      expect(screen.getByRole('total')).toHaveTextContent('300');
    });

    fireEvent.click(screen.getByRole('setPage'));
    currentList = generateContinuousNumbers(19, 0, i => {
      const n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
    });

    setMockListWithSearchData(data => {
      data.splice(12, 1, { id: 100, word: 'zzz' });
      return data;
    });

    fireEvent.click(screen.getByRole('refreshByItem__search'));
    currentList[12] = { id: 100, word: 'zzz' };
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
    });
  });

  test('load more mode paginated data operate items with remove/insert/replace(open preload)', async () => {
    const fetchMockFn = vi.fn();
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          initialPage: 2, // Starts on page 2 by default
          initialPageSize: 4
        }}
        handleExposure={(exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }}
      />
    );

    // Wait for fetch to complete
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
    });

    // Mixed sync operations
    fireEvent.click(screen.getByRole('mixedOperate'));
    setMockListData(data => {
      // Synchronously delete the simulated data so that the fetch data verification is normal.
      data.splice(5, 2);
      data.splice(4, 0, 100);
      data.splice(6, 1, 200);
      return data;
    });
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([100, 4, 200, 8]));
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
      expect(fetchMockFn).toHaveBeenCalledTimes(3); // Multiple sync operations will only trigger preloading once
    });

    fireEvent.click(screen.getByRole('setPage'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([100, 4, 200, 8, 9, 10, 11, 12]));
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
      expect(fetchMockFn).toHaveBeenCalledTimes(4); // Page turning only preloads the next page
    });
  });

  test('load more mode paginated data remove item without preload', async () => {
    const fetchMockFn = vi.fn();
    const successMockFn = vi.fn();
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          preloadNextPage: false,
          preloadPreviousPage: false,
          initialPageSize: 4
        }}
        handleExposure={(exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
          exposure.onSuccess(successMockFn);
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([0, 1, 2, 3]));
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    // If the next page is not cached, a new request will be made to refresh the list.
    fireEvent.click(screen.getByRole('batchRemove1'));
    setMockListData(data => {
      // Synchronous deletion in simulated data
      data.splice(1, 2);
      return data;
    });
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([0, 3, 4, 5]));
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(fetchMockFn).not.toHaveBeenCalled();
    });

    await delay(100);
    expect(fetchMockFn).not.toHaveBeenCalled();
  });

  test('load more mode reload paginated data', async () => {
    const fetchMockFn = vi.fn();
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          initialPageSize: 4
        }}
        handleExposure={(exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }}
      />
    );

    // Wait for fetch to complete
    await waitFor(() => {
      // On the first page, only the next page will be preloaded
      expect(fetchMockFn).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([0, 1, 2, 3]));
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
    });

    // Manually change the interface data so that the effect can be seen after refreshing
    setMockListData(data => {
      data.splice(0, 1, 100);
      return data;
    });

    fireEvent.click(screen.getByRole('reload1'));
    const awaitResultEl = await screen.findByRole('awaitResult');
    expect(awaitResultEl).toHaveTextContent('resolve');
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([100, 1, 2, 3]));
    });

    fireEvent.click(screen.getByRole('setPage'));
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(3); // The previous page has been cached and will not be preloaded again.
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([100, 1, 2, 3, 4, 5, 6, 7]));
    });

    fireEvent.click(screen.getByRole('reload1'));
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(4);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([100, 1, 2, 3]));
    });
  });

  test("load more mode paginated data don't need to preload when go to last page", async () => {
    const fetchMockFn = vi.fn();
    render(
      <Pagination
        getter={getterShort}
        paginationConfig={{
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          initialPage: 2,
          initialPageSize: 4
        }}
        handleExposure={(exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }}
      />
    );

    let page = 2;
    const pageSize = 4;
    // Wait for fetch to complete
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 5, 6, 7]));
    });

    fireEvent.click(screen.getByRole('setPage'));
    page += 1;
    await waitFor(async () => {
      // We have reached the last page. There is no need to preload the next page of data. At the same time, the previous page is also cached and will not trigger preloading.
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(9, 4)));
      expect(await queryCache(getterShort(page + 1, pageSize))).toBeUndefined();
    });
  });

  test('should access actions by middleware actionDelegation', async () => {
    const successMockFn = vi.fn();
    render(
      <Pagination
        getter={(page: number, pageSize: number) => getterShort(page, pageSize, 0)}
        paginationConfig={() => ({
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          initialPage: 2,
          initialPageSize: 4,
          middleware: actionDelegationMiddleware('test_page')
        })}
        handleExposure={(exposure: any) => {
          exposure.onSuccess(successMockFn);
        }}
      />
    );

    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    accessAction('test_page', handlers => {
      expect(handlers.send).toBeInstanceOf(Function);
      expect(handlers.refresh).toBeInstanceOf(Function);
      expect(handlers.insert).toBeInstanceOf(Function);
      expect(handlers.remove).toBeInstanceOf(Function);
      expect(handlers.replace).toBeInstanceOf(Function);
      expect(handlers.reload).toBeInstanceOf(Function);
      expect(handlers.abort).toBeInstanceOf(Function);
      handlers.refresh(1);
    });

    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
    });
  });

  test('should update list data when call update function that returns in hook', async () => {
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          initialPage: 2,
          initialPageSize: 4
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 5, 6, 7]));
    });

    fireEvent.click(screen.getByRole('setLoading'));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loading');
    });
    fireEvent.click(screen.getByRole('clearData'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([]));
    });
  });

  test('should set initial data to data and total', async () => {
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          total: (res: any) => res.total,
          data: (res: any) => res.list,
          initialData: {
            list: [1, 2, 3],
            total: 3
          },
          immediate: false,
          initialPage: 2,
          initialPageSize: 4
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([1, 2, 3]));
      expect(screen.getByRole('total')).toHaveTextContent('3');
    });
  });

  test('can be resent request when encounter an error', async () => {
    const errorFn = vi.fn();
    const completeFn = vi.fn();
    render(
      <Pagination
        getter={(page: number, pageSize: number) =>
          getter1(page, pageSize, {}, () => {
            throw new Error('mock error');
          })
        }
        paginationConfig={{
          data: (res: any) => res.list,
          total: (res: any) => res.total
        }}
        handleExposure={(exposure: any) => {
          exposure.onError(errorFn);
          exposure.onComplete(completeFn);
        }}
      />
    );

    await waitFor(() => {
      expect(errorFn).toHaveBeenCalledTimes(1);
      expect(completeFn).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('reload1'));
    const awaitResultEl = await screen.findByRole('awaitResult');
    expect(awaitResultEl).toHaveTextContent('reject');
    await waitFor(() => {
      expect(errorFn).toHaveBeenCalledTimes(2);
      expect(completeFn).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(screen.getByRole('reload1'));
    const awaitResultEl2 = await screen.findByRole('awaitResult');
    expect(awaitResultEl2).toHaveTextContent('reject');
    await waitFor(() => {
      expect(errorFn).toHaveBeenCalledTimes(3);
      expect(completeFn).toHaveBeenCalledTimes(3);
    });
  });

  test('should use the data of last request when set `abortLast` to true', async () => {
    let keyword: ReactPossibleState<string>;
    const successMockFn = vi.fn();
    render(
      <Pagination
        getter={getterSearch}
        paginationConfig={() => {
          keyword = useState('');
          return {
            watchingStates: [keyword[0]],
            abortLast: true,
            data: (res: any) => res.list
          };
        }}
        handleExposure={(exposure: any) => {
          exposure.onSuccess(successMockFn);
        }}
      />
    );

    const currentList = generateContinuousNumbers(9, 0, i => {
      const n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
      expect(screen.getByRole('total')).toHaveTextContent('300');
    });

    act(() => {
      keyword?.[1]('bbb');
    });
    await delay(10);
    act(() => {
      keyword?.[1]('');
    });
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
      expect(screen.getByRole('total')).toHaveTextContent('300');
      expect(successMockFn).toHaveBeenCalledTimes(2);
    });
  });

  test('should update state data when call `updateState` function', async () => {
    const initialPageSize = 4;
    render(
      <Pagination
        getter={getter1}
        paginationConfig={{
          data: (res: any) => res.list,
          append: true,
          initialPageSize
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([0, 1, 2, 3]));
    });

    let updated: boolean;
    delay()
      .then(() =>
        updateState<number[]>(getter1(1, initialPageSize), {
          data: list => [...list, 100, 200],
          total: old => old + 10
        })
      )
      .then(res => {
        updated = res;
      });
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([0, 1, 2, 3, 100, 200]));
      expect(screen.getByRole('total')).toHaveTextContent('310');
      expect(updated).toBeTruthy();
    });

    delay().then(() => updateState<number[]>(getter1(1, initialPageSize), list => [...list, 300]));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([0, 1, 2, 3, 100, 200, 300]));
    });
  });

  test('should receive custom params from function send', async () => {
    const successFn = vi.fn();
    const fetchSuccessMockFn = vi.fn();
    render(
      <Pagination
        getter={(page, pageSize) => getter1(page, pageSize)}
        paginationConfig={{
          total: (res: any) => res.total,
          data: (res: any) => res.list,
          immediate: false
        }}
        handleExposure={exposure => {
          exposure.onSuccess(({ args }) => {
            successFn(args);
          });
          exposure.onFetchSuccess(({ args }) => {
            fetchSuccessMockFn(args);
          });
        }}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('page')).toHaveTextContent('1');
      expect(screen.getByRole('pageSize')).toHaveTextContent('10');
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([]));
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
      expect(screen.getByRole('isLastPage')).toHaveTextContent('true');
    });

    fireEvent.click(screen.getByRole('customSend'));
    await waitFor(() => {
      expect(successFn).toHaveBeenCalledWith(['a', 1, undefined, undefined]);
      expect(fetchSuccessMockFn).toHaveBeenCalledWith(['a', 1, false]);
    });
  });
});
