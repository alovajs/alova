import { VueOptionsHook } from '@/index';
import { GeneralFn } from '@alova/shared/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createAlova, invalidateCache, queryCache } from 'alova';
import { generateContinuousNumbers } from 'root/testUtils';
import {
  mockRequestAdapter,
  setMockListData,
  setMockListWithSearchData,
  setMockShortListData
} from '../../client/test/mockData';
import Pagination from './components/Pagination.vue';

// vi.setTimeout(1000000);
// reset data
beforeEach(() => {
  setMockListData();
  setMockListWithSearchData();
  setMockShortListData();
  invalidateCache();
});
const alovaInst = createAlova({
  baseURL: process.env.NODE_BASE_URL,
  statesHook: VueOptionsHook,
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
describe('usePagination', () => {
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
});
