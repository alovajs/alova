import { mockRequestAdapter, setMockListData, setMockListWithSearchData, setMockShortListData } from '#/mockData';
import { accessAction, actionDelegationMiddleware } from '@/index';
import { GeneralFn } from '@alova/shared/types';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createAlova, invalidateCache, queryCache } from 'alova';
import vueHook from 'alova/vue';
import { delay, generateContinuousNumbers } from 'root/testUtils';
import { ref } from 'vue';
import Pagination from './components/pagination.vue';

jest.setTimeout(1000000);
// reset data
beforeEach(() => {
  setMockListData();
  setMockListWithSearchData();
  setMockShortListData();
  invalidateCache();
});
const alovaInst = createAlova({
  baseURL: process.env.NODE_BASE_URL,
  statesHook: vueHook,
  requestAdapter: mockRequestAdapter,
  cacheLogger: false
});
interface ListResponse {
  total: number;
  list: number[];
}
const getter1 = (page: number, pageSize: number, extra: Record<string, any> = {}, transformData?: GeneralFn) =>
  alovaInst.Get<ListResponse>('/list', {
    params: {
      page,
      pageSize,
      ...extra
    },
    transformData
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

describe('vue => usePagination', () => {
  // 分页相关测试
  test('load paginated data and change page/pageSize', async () => {
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          total: (res: any) => res.total,
          data: (res: any) => res.list
        }
      }
    });

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

    // 检查预加载缓存
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

    // 检查预加载缓存
    await waitFor(async () => {
      let cache = await queryCache(getter1(3, 20));
      expect(cache?.list).toStrictEqual(generateContinuousNumbers(59, 40));
      cache = await queryCache(getter1(1, 20));
      expect(cache?.list).toStrictEqual(generateContinuousNumbers(19));
    });

    // 最后一页
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

  test('should throws an error when got wrong array', async () => {
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          data: ({ wrongList }: any) => wrongList
        }
      }
    });

    await waitFor(() => {
      expect(screen.getByRole('error')).toHaveTextContent(
        '[alova/usePagination]Got wrong array, did you return the correct array of list in `data` function'
      );
    });
  });

  // 不立即发送请求
  test('should not load paginated data when set `immediate` to false', async () => {
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          total: (res: any) => res.total,
          data: (res: any) => res.list,
          immediate: false
        }
      }
    });

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
    const keyword = ref('');
    render(Pagination, {
      props: {
        getter: (page: number, pageSize: number) => getterSearch(page, pageSize, keyword.value),
        paginationConfig: {
          watchingStates: [keyword],
          total: (res: any) => res.total,
          data: (res: any) => res.list
        }
      }
    });

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

    keyword.value = 'bbb';
    await waitFor(() => {
      JSON.parse(screen.getByRole('response').textContent || '[]').forEach(({ word }: any) => expect(word).toBe('bbb'));
      expect(screen.getByRole('total')).toHaveTextContent('100');
    });
  });

  test('paginated data refersh page', async () => {
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          total: (res: any) => res.total,
          data: (res: any) => res.list,
          initialPage: 3
        }
      }
    });

    setMockListData(data => {
      // 修改第3页第1条数据
      data.splice(20, 1, 200);
      return data;
    });

    fireEvent.click(screen.getByRole('refreshCurPage'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(generateContinuousNumbers(29, 20, i => (i === 20 ? 200 : i)))
      );
    });

    // 修改第1页数据
    setMockListData(data => {
      data.splice(0, 1, 100);
      return data;
    });
    fireEvent.click(screen.getByRole('refresh1')); // 在翻页模式下，不是当前页会使用fetch
    await waitFor(async () => {
      const cache = await queryCache(getter1(1, 10));
      expect(cache?.list).toStrictEqual(generateContinuousNumbers(9, 0, i => (i === 0 ? 100 : i)));
    });
  });

  test('paginated data insert item with preload', async () => {
    const fetchMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          data: (res: any) => res.list,
          initialPage: 2 // 默认从第2页开始
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }
      }
    });

    const page = 2;
    const pageSize = 10;
    let total = 300;
    // 检查预加载缓存
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

      // 检查当前页缓存
      let cache = await queryCache(getter1(page, pageSize));
      expect(cache?.list).toStrictEqual([300, ...generateContinuousNumbers(18, 10)]);

      // insert时不会重新fetch后一页的数据
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
      cache = await queryCache(getter1(page + 1, pageSize));
      // insert时会将缓存末尾去掉，因此还是剩下10项
      expect(cache?.list).toEqual(generateContinuousNumbers(28, 19));
    });

    fireEvent.click(screen.getByRole('batchInsert'));
    total += 3;
    await waitFor(async () => {
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
      const curData = [400, 300, 500, ...generateContinuousNumbers(15, 10), 600];
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(curData));

      // 当前页缓存要保持一致
      const cache = await queryCache(getter1(page, pageSize));
      expect(cache?.list).toStrictEqual(curData);

      expect(fetchMockFn).toHaveBeenCalledTimes(2); // insert不会触发下一页预加载
    });

    // 翻到最后一页后，再插入数据不会再去除一条数据
    fireEvent.click(screen.getByRole('pageToLast'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([299]));
    });
    fireEvent.click(screen.getByRole('insert300'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([300, 299]));
    });
  });

  // 当操作了数据重新fetch但还未响应时，翻页到了fetch的页，此时也需要更新界面
  test('should update data when insert and fetch current page', async () => {
    const fetchMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          data: (res: any) => res.list,
          initialPage: 2, // 默认从第2页开始
          initialPageSize: 4
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }
      }
    });

    const page = 2;
    const pageSize = 4;
    let total = 300;

    // 通过检查缓存数据表示预加载数据成功
    await waitFor(async () => {
      let cache = await queryCache(getter1(page - 1, pageSize));
      expect(cache?.list).toStrictEqual(generateContinuousNumbers(3));
      cache = await queryCache(getter1(page + 1, pageSize));
      expect(cache?.list).toEqual(generateContinuousNumbers(11, 8));
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(screen.getByRole('batchInsert1'));
    total += 2;
    // 模拟数据中同步删除，这样fetch的数据校验才正常
    setMockListData(data => {
      data.splice(5, 0, 1000, 1001);
      return data;
    });

    // 正在重新fetch下一页数据，但还没响应，此时翻页到下一页
    await delay(20);
    fireEvent.click(screen.getByRole('setPage'));
    // 等待fetch
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(9, 6))); // 有两项被挤到后面一页了
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
      // 5次来源分别是：初始化时2次、翻页时1次（翻页后上一页数据已有不再fetch）
      expect(fetchMockFn).toHaveBeenCalledTimes(3);
    });

    // 再次返回前一页，移除的数据不应该存在
    fireEvent.click(screen.getByRole('subtractPage'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 1000, 1001, 5]));
    });
  });

  test('paginated data replace item', async () => {
    const successMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          data: (res: any) => res.list
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(successMockFn);
        }
      }
    });

    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(screen.getByRole('replaceError1'));
    await waitFor(() => {
      expect(screen.getByRole('replacedError')).toHaveTextContent(
        '[alova/usePagination]expect specify the replace position'
      );
    });
    fireEvent.click(screen.getByRole('replaceError2'));
    await waitFor(() => {
      expect(screen.getByRole('replacedError')).toHaveTextContent(
        '[alova/usePagination]index must be a number that less than list length'
      );
    });

    fireEvent.click(screen.getByRole('replace1'));
    await waitFor(async () => {
      // 第一项被替换了
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(generateContinuousNumbers(9, 0, { 0: 300 }))
      );

      // 检查当前页缓存
      expect((await queryCache(getter1(1, 10)))?.list).toEqual(generateContinuousNumbers(9, 0, { 0: 300 }));
    });

    // 正向顺序替换
    fireEvent.click(screen.getByRole('replace2'));
    await waitFor(async () => {
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(generateContinuousNumbers(9, 0, { 0: 300, 8: 400 }))
      );

      // 检查当前页缓存
      expect((await queryCache(getter1(1, 10)))?.list).toEqual(generateContinuousNumbers(9, 0, { 0: 300, 8: 400 }));
    });

    // 逆向顺序替换
    fireEvent.click(screen.getByRole('replace3'));
    await waitFor(async () => {
      expect(screen.getByRole('response')).toHaveTextContent(
        JSON.stringify(generateContinuousNumbers(9, 0, { 0: 300, 8: 400, 6: 500 }))
      );

      // 检查当前页缓存
      expect((await queryCache(getter1(1, 10)))?.list).toEqual(
        generateContinuousNumbers(9, 0, { 0: 300, 8: 400, 6: 500 })
      );
    });
  });

  test('paginated data replace item by another item', async () => {
    render(Pagination, {
      props: {
        getter: getterSearch,
        paginationConfig: {
          total: (res: any) => res.total,
          data: (res: any) => res.list
        }
      }
    });

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
      expect(screen.getByRole('replacedError')).toHaveTextContent('[alova/usePagination]item is not found in list');
    });
    fireEvent.click(screen.getByRole('replaceByItem__search'));
    currentList[2] = { id: 100, word: 'zzz' };
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
    });
  });

  test('paginated data insert item without preload', async () => {
    const fetchMockFn = jest.fn();
    const successMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          data: (res: any) => res.list,
          preloadNextPage: false,
          preloadPreviousPage: false,
          initialPage: 2 // 默认从第2页开始
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
          exposure.onSuccess(successMockFn);
        }
      }
    });

    const page = 2;
    const pageSize = 10;
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    // 检查预加载缓存
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

    // 预加载设置为false了，因此不会fetch前后一页的数据
    await delay(100);
    cache = await queryCache(getter1(page + 1, pageSize));
    expect(cache).toBeUndefined();
    cache = await queryCache(getter1(page - 1, pageSize));
    expect(cache).toBeUndefined();
  });

  test('paginated data insert item by another item', async () => {
    render(Pagination, {
      props: {
        getter: getterSearch,
        paginationConfig: {
          total: (res: any) => res.total,
          data: (res: any) => res.list
        }
      }
    });

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
      expect(screen.getByRole('replacedError')).toHaveTextContent('[alova/usePagination]item is not found in list');
    });
    fireEvent.click(screen.getByRole('insertByItem__search'));
    currentList.splice(3, 0, { id: 100, word: 'zzz' });
    currentList.pop();
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
    });
  });

  test('paginated data remove item in preload mode', async () => {
    const fetchMockFn = jest.fn();
    const successMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          data: (res: any) => res.list,
          initialPage: 2, // 默认从第2页开始
          initialPageSize: 4
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
          exposure.onSuccess(successMockFn);
        }
      }
    });

    const page = 2;
    const pageSize = 4;
    let total = 300;
    await waitFor(async () => {
      // 检查预加载缓存
      let cache = await queryCache(getter1(page + 1, pageSize));
      expect(!!cache).toBeTruthy();
      cache = await queryCache(getter1(page - 1, pageSize));
      expect(!!cache).toBeTruthy();
    });
    expect(fetchMockFn).toHaveBeenCalledTimes(2); // 初始化时2次

    // 删除第二项，将会用下一页的数据补位，并重新拉取上下一页的数据
    fireEvent.click(screen.getByRole('batchRemove1'));
    setMockListData(data => {
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.splice(5, 2);
      return data;
    });
    total -= 2;
    // 下一页缓存已经被使用了2项
    expect((await queryCache(getter1(page + 1, pageSize)))?.list).toStrictEqual([10, 11]);
    await waitFor(async () => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 7, 8, 9]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());

      // 当前页缓存要保持一致
      expect((await queryCache(getter1(page, pageSize)))?.list).toStrictEqual([4, 7, 8, 9]);
    });

    // 等待删除后重新fetch下一页完成再继续
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(3);
    });

    // 请求发送了，但还没响应（响应有50ms延迟），此时再一次删除，期望还可以使用原缓存且中断请求
    fireEvent.click(screen.getByRole('remove2'));
    setMockListData(data => {
      data.splice(6, 1);
      return data;
    });
    total -= 1;
    // 下一页缓存又被使用了1项
    expect((await queryCache(getter1(page + 1, pageSize)))?.list).toStrictEqual([11, 12, 13]);
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 7, 9, 10]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
      expect(fetchMockFn).toHaveBeenCalledTimes(3);
    });

    // 检查是否重新fetch了前后一页的数据
    await waitFor(async () => {
      expect(fetchMockFn).toHaveBeenCalledTimes(4);
      let cache = await queryCache(getter1(page - 1, pageSize));
      expect(cache?.list).toStrictEqual([0, 1, 2, 3]);
      cache = await queryCache(getter1(page + 1, pageSize));
      expect(cache?.list).toStrictEqual([11, 12, 13, 14]);
    });
  });

  test('paginated data remove item by another item', async () => {
    const fetchMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getterSearch,
        paginationConfig: {
          total: (res: any) => res.total,
          data: (res: any) => res.list
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }
      }
    });

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
      expect(screen.getByRole('replacedError')).toHaveTextContent('[alova/usePagination]item is not found in list');
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

  // 当操作了数据重新fetch但还未响应时，翻页到了正在fetch的页，此时也需要更新界面
  test('should update data when fetch current page', async () => {
    const fetchMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          data: (res: any) => res.list,
          initialPage: 2, // 默认从第2页开始
          initialPageSize: 4
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }
      }
    });

    const page = 2;
    const pageSize = 4;
    let total = 300;
    await waitFor(async () => {
      // 检查预加载缓存
      let cache = await queryCache(getter1(page + 1, pageSize));
      expect(!!cache).toBeTruthy();
      cache = await queryCache(getter1(page - 1, pageSize));
      expect(!!cache).toBeTruthy();
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(screen.getByRole('batchRemove1'));
    total -= 2;
    setMockListData(data =>
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.filter((i: number) => ![5, 6].includes(i))
    );

    // 正在重新fetch下一页数据，但还没响应（响应有50ms延迟），此时翻页到下一页
    await delay(10);
    fireEvent.click(screen.getByRole('setPage'));
    await waitFor(() => {
      // 有两项用于填补前一页数据了
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([10, 11]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });

    // fetch响应后
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(4); // 初始化2次 + 删除fetch重新fetch1次 + 翻页后fetch下一页1次
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([10, 11, 12, 13]));
    });

    // 再次返回前一页，移除的数据不应该存在
    fireEvent.click(screen.getByRole('subtractPage'));
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(4); // 前后一页都有缓存，不fetch
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 7, 8, 9]));
    });
  });

  test.skip('should use new total data when remove items and go to adjacent page', async () => {
    const fetchMockFn = jest.fn();
    const min = ref(0);
    render(Pagination, {
      props: {
        getter: (page: number, pageSize: number) => getter1(page, pageSize, { min: min.value }),
        paginationConfig: {
          data: (res: any) => res.list,
          watchingStates: [min],
          initialPage: 2, // 默认从第2页开始
          initialPageSize: 4
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }
      }
    });

    const page = 2;
    const pageSize = 4;
    let total = 300;
    // 等待预加载数据完成
    await waitFor(async () => {
      let cache = await queryCache(
        getter1(page + 1, pageSize, {
          min: min.value
        })
      );
      expect(!!cache).toBeTruthy();
      cache = await queryCache(
        getter1(page - 1, pageSize, {
          min: min.value
        })
      );
      expect(!!cache).toBeTruthy();
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
    });

    // 删除两项，前后页的total也会同步更新
    fireEvent.click(screen.getByRole('batchRemove1'));
    total -= 2;
    setMockListData(data =>
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.filter((i: number) => ![5, 6].includes(i))
    );
    await waitFor(() => {
      // 有两项用于填补前一页数据了
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 7, 8, 9]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
      expect(fetchMockFn).toHaveBeenCalledTimes(2); // 还未触发预加载下一页
    });

    await delay(10); // 发起了预加载后再继续
    fireEvent.click(screen.getByRole('subtractPage'));
    // 等待fetch完成后检查total是否正确
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(3); // 初始化2次、删除后1次、翻到第1页无fetch（第1页不触发上一页预加载，且下一页有缓存）
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([0, 1, 2, 3]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });

    fireEvent.click(screen.getByRole('setPage2'));
    // 等待fetch完成后检查total是否正确
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(4); // 再次翻页+1次下一页fetch
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([10, 11, 12, 13]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });

    // 改变筛选条件将使用最新的total
    // 注意：改变监听条件后会自动重置为page=initialPage(2)
    min.value = 100;
    let totalBackup = total;
    total = 200;
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(6); // 改变筛选条件（自动重置第initialPage页）+2次
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([104, 105, 106, 107])); // 重置到第initialPage页
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });

    // 删除一条
    fireEvent.click(screen.getByRole('remove2'));
    total -= 1;
    totalBackup -= 1;
    setMockListData(data =>
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.filter((i: number) => ![106].includes(i))
    );
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(7); // 预加载下一页+1
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([104, 105, 107, 108]));
      // 再次看total是否正确
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });

    // 条件改回去，需要延迟一会儿再继续操作
    await delay(10);
    min.value = 0;
    total = totalBackup;
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(8); // 条件重置了，预加载了前一页数（当前第initialPage页）+1
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 7, 8, 9]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });
  });

  test('paginated data remove short list item without preload', async () => {
    const successMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getterShort,
        paginationConfig: {
          data: (res: any) => res.list,
          total: (res: any) => res.total,
          initialPage: 3, // 默认从第3页开始
          initialPageSize: 4,
          preloadNextPage: false,
          preloadPreviousPage: false
        },
        handleExposure: (exposure: any) => {
          exposure.onSuccess(successMockFn);
        }
      }
    });

    const page = 3;
    const pageSize = 4;
    let total = 10;

    // 等待请求成功
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(screen.getByRole('remove1'));
    total -= 1;
    setMockShortListData(data =>
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.filter((i: number) => ![9].includes(i))
    );

    await waitFor(async () => {
      // 有两项用于填补前一页数据了
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([8]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());

      // 当前页缓存要保持一致
      const cache = await queryCache(getterShort(page, pageSize));
      expect(cache?.list).toStrictEqual([8]);
    });

    fireEvent.click(screen.getByRole('remove0'));
    total -= 1;
    setMockShortListData(data => data.filter((i: number) => ![8].includes(i)));

    // 当最后一页没数据后，会自动切换到上一页
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('page')).toHaveTextContent('2');
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 5, 6, 7]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
    });
  });

  test('should refresh current page and will not prefetch when close cache', async () => {
    const fetchMockFn = jest.fn();
    const successMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: (page: number, pageSize: number) => getterShort(page, pageSize, 0),
        paginationConfig: {
          data: (res: any) => res.list,
          total: (res: any) => res.total,
          initialPage: 2,
          initialPageSize: 4
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
          exposure.onSuccess(successMockFn);
        }
      }
    });

    const page = 2;
    const pageSize = 4;
    let total = 10;

    // 等待请求成功
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    // 删除数据
    fireEvent.click(screen.getByRole('remove1'));
    total -= 1;
    setMockShortListData(data =>
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.filter((i: number) => ![5].includes(i))
    );

    await waitFor(async () => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 6, 7, 8]));
      expect(screen.getByRole('total')).toHaveTextContent(total.toString());
      // 当前缓存已关闭
      expect(await queryCache(getterShort(page, pageSize))).toBeUndefined();
    });

    // 插入数据，插入时不会刷新数据
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

    // 替换数据
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
    // method没有设置缓存时，不会触发数据拉取
    expect(fetchMockFn).not.toHaveBeenCalled();
  });

  // 下拉加载更多相关
  test.only('load more mode paginated data and change page/pageSize', async () => {
    const successMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          preloadNextPage: false,
          preloadPreviousPage: false
        },
        handleExposure: (exposure: any) => {
          exposure.onSuccess(successMockFn);
        }
      }
    });

    let page = 1;
    const pageSize = 10;

    // 等待请求成功
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('page')).toHaveTextContent(page.toString());
      expect(screen.getByRole('pageSize')).toHaveTextContent(pageSize.toString());
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(9)));
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
      expect(screen.getByRole('isLastPage')).toHaveTextContent('false');
    });

    // 检查预加载缓存
    await delay(100);
    expect((await queryCache(getter1(page + 1, pageSize)))?.list).toBeUndefined();

    fireEvent.click(screen.getByRole('setPage'));
    page += 1;
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('page')).toHaveTextContent(page.toString());
      expect(screen.getByRole('pageSize')).toHaveTextContent(pageSize.toString());
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(19))); // 翻页数据追加到尾部
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
      expect(screen.getByRole('isLastPage')).toHaveTextContent('false');
    });

    await delay(100);
    expect((await queryCache(getter1(page + 1, pageSize)))?.list).toBeUndefined();

    // 翻页到没有数据的一页，没有提供total时，数据少于pageSize条时将会把isLastPage判断为true
    fireEvent.click(screen.getByRole('toNoDataPage'));
    page = 31;
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(3);
      expect(screen.getByRole('page')).toHaveTextContent(page.toString());
      expect(screen.getByRole('isLastPage')).toHaveTextContent('true');
    });
  });

  test('load more paginated data with conditions search', async () => {
    const fetchMockFn = jest.fn();
    const successMockFn = jest.fn();
    const keyword = ref('');
    render(Pagination, {
      props: {
        getter: getterSearch,
        paginationConfig: {
          watchingStates: [keyword],
          total: () => undefined,
          data: (res: any) => res.list,
          append: true
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
          exposure.onSuccess(successMockFn);
        }
      }
    });
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
    });

    keyword.value = 'bbb';
    await waitFor(() => {
      JSON.parse(screen.getByRole('response').textContent || '[]').forEach(({ word }: any) => expect(word).toBe('bbb'));
      expect(screen.getByRole('total')).toHaveTextContent('');
    });
  });

  test('load more mode paginated data refersh page by page number', async () => {
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          preloadNextPage: false,
          preloadPreviousPage: false
        }
      }
    });

    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(9)));
    });

    fireEvent.click(screen.getByRole('setPage'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(19)));
    });

    fireEvent.click(screen.getByRole('refreshError'));
    await waitFor(() => {
      expect(screen.getByRole('replacedError')).toHaveTextContent(
        "[alova/usePagination]refresh page can't greater than page"
      );
    });

    // 手动改变一下接口数据，让刷新后能看出效果
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
    render(Pagination, {
      props: {
        getter: getterSearch,
        paginationConfig: {
          total: (res: any) => res.total,
          data: (res: any) => res.list,
          append: true
        }
      }
    });
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
    const fetchMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          total: () => undefined,
          data: (res: any) => res.list,
          append: true, // TODO: 好像漏了
          initialPage: 2, // 默认从第2页开始
          initialPageSize: 4
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }
      }
    });

    // 等待fetch完成
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
    });

    // 混合同步操作
    fireEvent.click(screen.getByRole('mixedOperate'));
    setMockListData(data => {
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.splice(5, 2);
      data.splice(4, 0, 100);
      data.splice(6, 1, 200);
      return data;
    });
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([100, 4, 200, 8]));
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
      expect(fetchMockFn).toHaveBeenCalledTimes(3); // 多次同步操作只会触发一次预加载
    });

    fireEvent.click(screen.getByRole('setPage'));
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([9, 10, 11, 12]));
      expect(screen.getByRole('total')).toHaveTextContent('');
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
      expect(fetchMockFn).toHaveBeenCalledTimes(4); // 翻页只预加载下一页
    });
  });

  test('load more mode paginated data remove item without preload', async () => {
    const fetchMockFn = jest.fn();
    const successMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          preloadNextPage: false,
          preloadPreviousPage: false,
          initialPageSize: 4
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
          exposure.onSuccess(successMockFn);
        }
      }
    });

    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([0, 1, 2, 3]));
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    // 下一页没有缓存的情况下，将会重新请求刷新列表
    fireEvent.click(screen.getByRole('batchRemove1'));
    setMockListData(data => {
      // 模拟数据中同步删除
      data.splice(1, 2);
      return data;
    });
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([2, 3, 4, 5]));
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(fetchMockFn).not.toHaveBeenCalled();
    });

    await delay(100);
    expect(fetchMockFn).not.toHaveBeenCalled();
  });

  test('load more mode reload paginated data', async () => {
    const fetchMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          initialPageSize: 4
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }
      }
    });

    // 等待fetch完成
    await waitFor(() => {
      // 第一页时只有下一页会被预加载
      expect(fetchMockFn).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([0, 1, 2, 3]));
      expect(screen.getByRole('pageCount')).toHaveTextContent('');
    });

    // 手动改变一下接口数据，让刷新后能看出效果
    setMockListData(data => {
      data.splice(0, 1, 100);
      return data;
    });

    fireEvent.click(screen.getByRole('reload1'));
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([100, 1, 2, 3]));
    });

    fireEvent.click(screen.getByRole('setPage'));
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(3); // 上一页已有缓存不会再被预加载
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([100, 1, 2, 3, 4, 5, 6, 7]));
    });

    fireEvent.click(screen.getByRole('reload1'));
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(4);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([100, 1, 2, 3]));
    });
  });

  test("load more mode paginated data don't need to preload when go to last page", async () => {
    const fetchMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getterShort,
        paginationConfig: {
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          initialPage: 2,
          initialPageSize: 4
        },
        handleExposure: (exposure: any) => {
          exposure.onFetchSuccess(fetchMockFn);
        }
      }
    });

    let page = 2;
    const pageSize = 4;
    // 等待fetch完成
    await waitFor(() => {
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 5, 6, 7]));
    });

    fireEvent.click(screen.getByRole('setPage'));
    page += 1;
    await waitFor(async () => {
      // 已经到最后一页了，不需要再预加载下一页数据了，同时上一页也有缓存不会触发预加载
      expect(fetchMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(generateContinuousNumbers(9, 4)));
      expect(await queryCache(getterShort(page + 1, pageSize))).toBeUndefined();
    });
  });

  test('should access actions by middleware actionDelegation', async () => {
    const successMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: (page: number, pageSize: number) => getterShort(page, pageSize, 0),
        paginationConfig: {
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          initialPage: 2,
          initialPageSize: 4,
          middleware: actionDelegationMiddleware('test_page')
        },
        handleExposure: (exposure: any) => {
          exposure.onSuccess(successMockFn);
        }
      }
    });

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
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          total: () => undefined,
          data: (res: any) => res.list,
          append: true,
          initialPage: 2,
          initialPageSize: 4
        }
      }
    });

    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([4, 5, 6, 7]));
    });

    fireEvent.click(screen.getByRole('setLoading'));
    expect(screen.getByRole('status')).toHaveTextContent('loading');
    fireEvent.click(screen.getByRole('clearData'));
    expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([]));
  });

  test('should set initial data to data and total', async () => {
    render(Pagination, {
      props: {
        getter: getter1,
        paginationConfig: {
          total: (res: any) => res.total,
          data: (res: any) => res.list,
          initialData: {
            list: [1, 2, 3],
            total: 3
          },
          immediate: false,
          initialPage: 2,
          initialPageSize: 4
        }
      }
    });

    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify([1, 2, 3]));
      expect(screen.getByRole('total')).toHaveTextContent('3');
    });
  });

  test('can resend request when encounter with an error', async () => {
    const errorFn = jest.fn();
    const completeFn = jest.fn();
    render(Pagination, {
      props: {
        getter: (page: number, pageSize: number) =>
          getter1(page, pageSize, {}, () => {
            throw new Error('mock error');
          }),
        paginationConfig: {
          data: (res: any) => res.list,
          total: (res: any) => res.total
        },
        handleExposure: (exposure: any) => {
          exposure.onError(errorFn);
          exposure.onComplete(completeFn);
        }
      }
    });

    await waitFor(() => {
      expect(errorFn).toHaveBeenCalledTimes(1);
      expect(completeFn).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('reload'));
    await waitFor(() => {
      expect(errorFn).toHaveBeenCalledTimes(2);
      expect(completeFn).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(screen.getByRole('reload'));
    await waitFor(() => {
      expect(errorFn).toHaveBeenCalledTimes(3);
      expect(completeFn).toHaveBeenCalledTimes(3);
    });
  });

  test('should use the data of last request when set `abortLast` to true', async () => {
    const keyword = ref('');
    const successMockFn = jest.fn();
    render(Pagination, {
      props: {
        getter: getterSearch,
        paginationConfig: {
          watchingStates: [keyword],
          abortLast: true,
          data: (res: any) => res.list
        },
        handleExposure: (exposure: any) => {
          exposure.onSuccess(successMockFn);
        }
      }
    });

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

    keyword.value = 'bbb';
    await delay(10);
    keyword.value = '';
    await waitFor(() => {
      expect(screen.getByRole('response')).toHaveTextContent(JSON.stringify(currentList));
      expect(screen.getByRole('total')).toHaveTextContent('300');
      expect(successMockFn).toHaveBeenCalledTimes(2);
    });
  });
});
