import { mockRequestAdapter, setMockListData, setMockListWithSearchData, setMockShortListData } from '#/mockData';
import { generateContinuousNumbers, untilCbCalled } from '#/utils';
import { createAlova, invalidateCache, queryCache, setCache } from 'alova';
import VueHook from 'alova/vue';
import { ref } from 'vue';
import { accessAction, actionDelegationMiddleware, usePagination } from '..';

// jest.setTimeout(1000000);
// reset data
beforeEach(() => {
  setMockListData();
  setMockListWithSearchData();
  setMockShortListData();
  invalidateCache();
});
const createMockAlova = () =>
  createAlova({
    baseURL: 'http://localhost:8080',
    statesHook: VueHook,
    requestAdapter: mockRequestAdapter,
    cacheLogger: false
  });
describe('vue => usePagination', () => {
  // 分页相关测试
  test('load paginated data and change page/pageSize', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, pageCount, total, page, pageSize, isLastPage, onSuccess } = usePagination(getter, {
      total: res => res.total,
      data: res => res.list
    });

    await untilCbCalled(onSuccess);
    expect(page.value).toBe(1);
    expect(pageSize.value).toBe(10);
    expect(data.value.length).toBe(pageSize.value);
    expect(data.value[0]).toBe(0);
    expect(total.value).toBe(300);
    expect(pageCount.value).toBe(Math.ceil(total.value / pageSize.value));
    expect(isLastPage.value).toBeFalsy();

    // 检查预加载缓存
    await untilCbCalled(setTimeout, 100);
    let cache = queryCache(getter(page.value + 1, pageSize.value));
    expect(cache.list).toStrictEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    cache = setCache(getter(page.value - 1, pageSize.value));
    expect(cache).toBeUndefined();

    page.value++;
    await untilCbCalled(onSuccess);
    expect(page.value).toBe(2);
    expect(pageSize.value).toBe(10);
    expect(data.value.length).toBe(pageSize.value);
    expect(data.value[0]).toBe(10);
    expect(total.value).toBe(300);
    expect(pageCount.value).toBe(Math.ceil(total.value / pageSize.value));
    expect(isLastPage.value).toBeFalsy();

    pageSize.value = 20;
    await untilCbCalled(onSuccess);
    expect(page.value).toBe(2);
    expect(pageSize.value).toBe(20);
    expect(data.value.length).toBe(pageSize.value);
    expect(data.value[0]).toBe(20);
    expect(total.value).toBe(300);
    expect(pageCount.value).toBe(Math.ceil(total.value / pageSize.value));
    expect(isLastPage.value).toBeFalsy();

    // 检查预加载缓存
    await untilCbCalled(setTimeout, 100);
    setCache(getter(page.value + 1, pageSize.value), cache => {
      expect(!!cache).toBeTruthy();
    });
    setCache(getter(page.value - 1, pageSize.value), cache => {
      expect(!!cache).toBeTruthy();
    });

    // 最后一页
    page.value = pageCount.value;
    await untilCbCalled(onSuccess);
    expect(isLastPage.value).toBeTruthy();
    // 检查预加载缓存
    await untilCbCalled(setTimeout, 100);
    setCache(getter(page.value + 1, pageSize.value), cache => {
      expect(!!cache).toBeFalsy();
    });
    setCache(getter(page.value - 1, pageSize.value), cache => {
      expect(!!cache).toBeTruthy();
    });
  });

  test('should throws an error when got wrong array', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { onError } = usePagination(getter, {
      data: ({ wrongList }) => wrongList
    });

    const ev = await untilCbCalled(onError);
    expect(ev.error.message).toBe(
      '[alova/usePagination]Got wrong array, did you return the correct array of list in `data` function'
    );
  });

  // 不立即发送请求
  test('should not load paginated data when set `immediate` to false', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, total, pageCount, page, isLastPage, onSuccess } = usePagination(getter, {
      total: res => res.total,
      data: res => res.list,
      immediate: false
    });

    await untilCbCalled(setTimeout, 100);
    expect(data.value.length).toBe(0);
    expect(total.value).toBeUndefined();
    expect(isLastPage.value).toBeTruthy();
    expect(pageCount.value).toBeUndefined();

    page.value++;
    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  test('paginated data with conditions search', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize, keyword) =>
      alovaInst.Get('/list-with-search', {
        params: {
          page,
          pageSize,
          keyword
        }
      });
    const keyword = ref('');
    const { page, data, onSuccess, total } = usePagination((p, ps) => getter(p, ps, keyword.value), {
      watchingStates: [keyword],
      total: res => res.total,
      data: res => res.list
    });

    await untilCbCalled(onSuccess);
    expect(data.value[0]).toStrictEqual({ id: 0, word: 'aaa' });
    expect(data.value[data.value.length - 1]).toStrictEqual({ id: 9, word: 'aaa' });
    expect(total.value).toBe(300);

    page.value++;
    await untilCbCalled(onSuccess);
    expect(data.value[0]).toStrictEqual({ id: 10, word: 'bbb' });
    expect(data.value[data.value.length - 1]).toStrictEqual({ id: 19, word: 'bbb' });
    expect(total.value).toBe(300);

    keyword.value = 'bbb';
    await untilCbCalled(onSuccess);
    data.value.forEach(({ word }) => expect(word).toBe('bbb'));
    expect(data.value[0]).toStrictEqual({ id: 1, word: 'bbb' });
    expect(total.value).toBe(100);
  });

  test('paginated data refersh page', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, pageSize, onSuccess, refresh } = usePagination(getter, {
      total: res => res.total,
      data: res => res.list
    });

    await untilCbCalled(onSuccess);
    page.value = 3;

    await untilCbCalled(onSuccess);
    setMockListData(data => {
      data.splice(20, 1, 200);
      return data;
    });

    refresh(); // 未传入参数时将默认刷新当前页，当前页为3
    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual([200, 21, 22, 23, 24, 25, 26, 27, 28, 29]);

    setMockListData(data => {
      data.splice(0, 1, 100);
      return data;
    });
    refresh(1); // 在翻页模式下，不是当前页会使用fetch，因此只能使用setTimeout
    await untilCbCalled(setTimeout, 100);
    setCache(getter(1, pageSize.value), cache => {
      expect(cache.list).toStrictEqual([100, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  test('paginated data insert item with preload', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, pageSize, total, insert, onFetchSuccess } = usePagination(getter, {
      data: res => res.list,
      initialPage: 2 // 默认从第2页开始
    });

    await untilCbCalled(setTimeout, 150); // 预留请求和fetch的时间

    // 检查预加载缓存
    let cache = queryCache(getter(page.value + 1, pageSize.value));
    expect(!!cache).toBeTruthy();
    cache = queryCache(getter(page.value - 1, pageSize.value));
    expect(!!cache).toBeTruthy();

    let totalPrev = total.value;
    insert(300, 0);
    expect(data.value).toStrictEqual([300, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
    expect(total.value).toBe((totalPrev = totalPrev + 1));
    setMockListData(data => {
      data.splice(10, 0, 300);
      return data;
    });
    // 检查当前页缓存
    cache = queryCache(getter(page.value, pageSize.value));
    expect(cache.list).toStrictEqual([300, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
    // 检查是否重新fetch了前后一页的数据
    cache = queryCache(getter(page.value - 1, pageSize.value));
    expect(cache.list).toStrictEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    cache = queryCache(getter(page.value + 1, pageSize.value));
    // insert时会将缓存末尾去掉，因此还是剩下10项
    expect(cache.list).toStrictEqual([19, 20, 21, 22, 23, 24, 25, 26, 27, 28]);

    insert(400);
    insert(500, 2);
    insert(600, pageSize.value - 1);
    expect(total.value).toBe((totalPrev = totalPrev + 3));
    expect(data.value).toStrictEqual([400, 300, 500, 10, 11, 12, 13, 14, 15, 600]);
    // 当前页缓存要保持一致
    cache = queryCache(getter(page.value, pageSize.value));
    expect(cache.list).toStrictEqual([400, 300, 500, 10, 11, 12, 13, 14, 15, 600]);

    const mockFn2 = jest.fn();
    onFetchSuccess(mockFn2);
    await untilCbCalled(setTimeout, 100);
    expect(mockFn2).not.toHaveBeenCalled(); // 插入时不需要重新加载下一页数据

    // 翻到最后一页后，再插入数据不会再去除一条数据
    page.value = 31;
    await untilCbCalled(setTimeout, 150);
    expect(data.value).toStrictEqual([299]);
    insert(2000);
    expect(data.value).toStrictEqual([2000, 299]);
  });

  // 当操作了数据重新fetch但还未响应时，翻页到了fetch的页，此时也需要更新界面
  test('should update data when insert and fetch current page', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, total, insert } = usePagination(getter, {
      data: res => res.list,
      initialPage: 2, // 默认从第2页开始
      initialPageSize: 4
    });

    await untilCbCalled(setTimeout, 150); // 预留请求和fetch的时间
    insert(1000, 1);
    insert(1001, 2);
    setMockListData(data => {
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.splice(5, 0, 1000, 1001);
      return data;
    });

    // 正在重新fetch下一页数据，但还没响应（响应有50ms延迟），此时翻页到下一页
    await untilCbCalled(setTimeout);
    page.value++;

    await untilCbCalled(setTimeout, 20);
    expect(data.value).toStrictEqual([6, 7, 8, 9]); // 有两项被挤到后面一页了
    expect(total.value).toBe(302);

    await untilCbCalled(setTimeout, 100); // 等待fetch响应
    expect(data.value).toStrictEqual([6, 7, 8, 9]);

    // 再次返回前一页，移除的数据不应该存在
    page.value--;
    await untilCbCalled(setTimeout, 20);
    expect(data.value).toStrictEqual([4, 1000, 1001, 5]);
  });

  test('paginated data replace item', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, pageSize, replace } = usePagination(getter, {
      data: res => res.list
    });

    await untilCbCalled(setTimeout, 150); // 预留请求和fetch的时间

    expect(() => {
      replace(100);
    }).toThrow();
    expect(() => {
      replace(100, 1000);
    }).toThrow();

    replace(300, 0);
    expect(data.value).toStrictEqual([300, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    // 检查当前页缓存
    let cache = queryCache(getter(page.value, pageSize.value));
    expect(cache.list).toStrictEqual([300, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    // 正向顺序替换
    replace(400, 8);
    expect(data.value).toStrictEqual([300, 1, 2, 3, 4, 5, 6, 7, 400, 9]);
    // 逆向顺序替换
    replace(500, -4);
    expect(data.value).toStrictEqual([300, 1, 2, 3, 4, 5, 500, 7, 400, 9]);
  });

  test('paginated data replace item by another item', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list-with-search', {
        params: {
          page,
          pageSize
        }
      });
    const { data, onSuccess, total, replace } = usePagination((p, ps) => getter(p, ps), {
      total: res => res.total,
      data: res => res.list
    });

    let currentList = generateContinuousNumbers(9, 0, i => {
      let n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual(currentList);
    expect(total.value).toBe(300);

    // 需要使用对象的相同引用定位替换位置
    expect(() => {
      replace({ id: 100, word: 'zzz' }, { id: 2, word: 'ccc' });
    }).toThrow('[alova/usePagination]item is not found in list');

    replace({ id: 100, word: 'zzz' }, data.value[2]);
    expect(data.value[2]).toStrictEqual({ id: 100, word: 'zzz' });
  });

  test('paginated data insert item without preload', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, pageSize, insert, onSuccess } = usePagination(getter, {
      data: res => res.list,
      preloadNextPage: false,
      preloadPreviousPage: false,
      initialPage: 2 // 默认从第2页开始
    });

    await untilCbCalled(onSuccess, 150); // 预留请求和fetch的时间

    // 检查预加载缓存
    setCache(getter(page.value + 1, pageSize.value), cache => {
      expect(!!cache).toBeFalsy();
    });
    setCache(getter(page.value - 1, pageSize.value), cache => {
      expect(!!cache).toBeFalsy();
    });

    setMockListData(data => {
      data.splice(20, 1, 122);
      return data;
    });
    insert(300);
    expect(data.value).toStrictEqual([300, 10, 11, 12, 13, 14, 15, 16, 17, 18]);

    // 预加载设置为false了，因此不会fetch前后一页的数据
    await untilCbCalled(setTimeout, 100);
    setCache(getter(page.value - 1, pageSize.value), cache => {
      expect(!!cache).toBeFalsy();
    });
    setCache(getter(page.value + 1, pageSize.value), cache => {
      expect(!!cache).toBeFalsy();
    });
  });

  test('paginated data insert item by another item', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list-with-search', {
        params: {
          page,
          pageSize
        }
      });
    const { data, onSuccess, total, insert } = usePagination((p, ps) => getter(p, ps), {
      total: res => res.total,
      data: res => res.list
    });

    let currentList = generateContinuousNumbers(9, 0, i => {
      let n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual(currentList);
    expect(total.value).toBe(300);

    // 需要使用对象的相同引用定位替换位置
    expect(() => {
      insert({ id: 100, word: 'zzz' }, { id: 2, word: 'ccc' });
    }).toThrow('[alova/usePagination]item is not found in list');

    insert({ id: 100, word: 'zzz' }, data.value[2]); // 插入到索引2的后面
    expect(data.value[3]).toStrictEqual({ id: 100, word: 'zzz' });
  });

  test('paginated data remove item in preload mode', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, pageSize, total, remove, onFetchSuccess } = usePagination(getter, {
      data: res => res.list,
      initialPage: 2, // 默认从第2页开始
      initialPageSize: 4
    });

    await untilCbCalled(setTimeout, 150); // 预留请求和fetch的时间

    // 检查预加载缓存
    let cache = queryCache(getter(page.value + 1, pageSize.value));
    expect(!!cache).toBeTruthy();
    cache = queryCache(getter(page.value - 1, pageSize.value));
    expect(!!cache).toBeTruthy();

    let totalPrev = total.value;
    // 删除第二项，将会用下一页的数据补位，并重新拉取上下一页的数据
    remove(1);
    remove(1);
    setMockListData(data => {
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.splice(5, 2);
      return data;
    });

    expect(data.value).toStrictEqual([4, 7, 8, 9]);
    expect(total.value).toBe((totalPrev = totalPrev - 2));
    // 当前页缓存要保持一致
    cache = queryCache(getter(page.value, pageSize.value));
    expect(cache.list).toStrictEqual([4, 7, 8, 9]);

    const mockFn = jest.fn();
    onFetchSuccess(mockFn);

    // 请求发送了，但还没响应（响应有50ms延迟），此时再一次删除，期望还可以使用原缓存且中断请求
    await untilCbCalled(setTimeout, 20);
    remove(2);
    setMockListData(data => {
      data.splice(6, 1);
      return data;
    });
    expect(data.value).toStrictEqual([4, 7, 9, 10]);
    expect(total.value).toBe((totalPrev = totalPrev - 1));
    // 检查下一页缓存
    cache = queryCache(getter(page.value + 1, pageSize.value));
    expect(cache.list).toStrictEqual([11]); // 已经被使用了3项了

    await untilCbCalled(setTimeout, 200); // 等待重新fetch
    expect(data.value).toStrictEqual([4, 7, 9, 10]);
    expect(mockFn).toHaveBeenCalledTimes(1); // 有一次下页的fetch被取消，因此只有一次
    // 检查是否重新fetch了前后一页的数据
    await untilCbCalled(setTimeout, 100);
    cache = queryCache(getter(page.value - 1, pageSize.value));
    expect(cache.list).toStrictEqual([0, 1, 2, 3]);
    cache = queryCache(getter(page.value + 1, pageSize.value));
    expect(cache.list).toStrictEqual([11, 12, 13, 14]);

    // 同步操作的项数超过pageSize时，移除的数据将被恢复，并重新请求当前页数据
    remove(0);
    remove(0);
    remove(0);
    remove(0);
    remove(0);
    expect(data.value).toStrictEqual([4, 7, 9, 10]); // 数据被恢复
    setMockListData(data => {
      // 模拟数据中同步删除
      data.splice(4, 5);
      return data;
    });
    const mockFn2 = jest.fn();
    onFetchSuccess(mockFn2);

    await untilCbCalled(setTimeout, 100);
    expect(data.value).toStrictEqual([12, 13, 14, 15]);
    expect(total.value).toBe((totalPrev = totalPrev - 5));
    expect(mockFn2).toHaveBeenCalledTimes(1); // 只有下页的预加载触发
    cache = queryCache(getter(page.value - 1, pageSize.value));
    expect(cache.list).toStrictEqual([0, 1, 2, 3]);
    cache = queryCache(getter(page.value + 1, pageSize.value));
    expect(cache.list).toStrictEqual([16, 17, 18, 19]);
  });

  test('paginated data remove item by another item', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list-with-search', {
        params: {
          page,
          pageSize
        }
      });
    const { data, onFetchSuccess, total, remove } = usePagination((p, ps) => getter(p, ps), {
      total: res => res.total,
      data: res => res.list
    });

    let currentList = generateContinuousNumbers(9, 0, i => {
      let n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    await untilCbCalled(onFetchSuccess);
    expect(data.value).toStrictEqual(currentList);
    expect(total.value).toBe(300);

    // 需要使用对象的相同引用定位替换位置
    expect(() => {
      remove({ id: 2, word: 'ccc' });
    }).toThrow('[alova/usePagination]item is not found in list');

    remove(data.value[2]); // 移除到索引为2的项
    await untilCbCalled(setTimeout, 10);
    currentList = generateContinuousNumbers(10, 0, i => {
      let n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    currentList.splice(2, 1);
    expect(data.value).toStrictEqual(currentList);
  });

  // 当操作了数据重新fetch但还未响应时，翻页到了正在fetch的页，此时也需要更新界面
  test('should update data when fetch current page', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, total, remove } = usePagination(getter, {
      data: res => res.list,
      initialPage: 2, // 默认从第2页开始
      initialPageSize: 4
    });

    await untilCbCalled(setTimeout, 150); // 预留请求和fetch的时间
    remove(1);
    remove(1);
    setMockListData(data => {
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.splice(5, 2);
      return data;
    });

    // 正在重新fetch下一页数据，但还没响应（响应有50ms延迟），此时翻页到下一页
    await untilCbCalled(setTimeout, 20);
    page.value++;

    await untilCbCalled(setTimeout, 5);
    expect(data.value).toStrictEqual([10, 11]); // 有两项用于填补前一页数据了
    expect(total.value).toBe(298);

    await untilCbCalled(setTimeout, 200); // 等待fetch响应
    expect(data.value).toStrictEqual([10, 11, 12, 13]);

    // 再次返回前一页，移除的数据不应该存在
    page.value--;
    await untilCbCalled(setTimeout, 5);
    expect(data.value).toStrictEqual([4, 7, 8, 9]);
  });

  test('should use new total data when remove items and go to adjacent page', async () => {
    const alovaInst = createMockAlova();
    const min = ref(0);
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize,
          min: min.value
        }
      });

    const { page, total, remove } = usePagination(getter, {
      data: res => res.list,
      watchingStates: [min],
      initialPage: 2, // 默认从第2页开始
      initialPageSize: 4
    });

    await untilCbCalled(setTimeout, 150); // 预留请求和fetch的时间

    let totalPrev = total.value;
    // 删除两项，前后页的total也会同步更新
    remove(1);
    remove(1);
    setMockListData(data => {
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.splice(5, 2);
      return data;
    });
    expect(total.value).toBe(totalPrev - 2);

    page.value--;
    // 等待刷新数据
    await untilCbCalled(setTimeout, 100);
    expect(total.value).toBe(totalPrev - 2);

    page.value += 2;
    // 等待刷新数据
    await untilCbCalled(setTimeout, 150);
    expect(total.value).toBe(totalPrev - 2);

    // 改变筛选条件将使用最新的total
    min.value = 100;
    await untilCbCalled(setTimeout, 150); // 预留请求和fetch的时间
    expect(total.value).toBe(200);
    // 删除一条
    remove(1);
    setMockListData(data => {
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.splice(0, 1);
      return data;
    });
    expect(total.value).toBe(199);

    // 条件改回去
    await untilCbCalled(setTimeout, 10); // 需要延迟一会儿再继续操作
    min.value = 0;
    await untilCbCalled(setTimeout, 100);
    expect(total.value).toBe(totalPrev - 3);
  });

  test('paginated data remove short list item without preload', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list-short', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, pageSize, total, remove, onSuccess } = usePagination(getter, {
      data: res => res.list,
      total: res => res.total,
      initialPage: 3, // 默认从第3页开始
      initialPageSize: 4,
      preloadNextPage: false,
      preloadPreviousPage: false
    });

    await untilCbCalled(onSuccess);
    let totalPrev = total.value;
    remove(1);
    setMockShortListData(data => {
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.splice(9, 1);
      return data;
    });
    expect(data.value).toStrictEqual([8]);
    expect(total.value).toBe((totalPrev = totalPrev - 1));
    // 当前页缓存要保持一致
    setCache(getter(page.value, pageSize.value), cache => {
      expect(cache.list).toStrictEqual([8]);
    });

    remove(0);
    setMockShortListData(data => {
      data.splice(8, 1);
      return data;
    });
    await untilCbCalled(onSuccess); // 最后一页没有数据项了，自动设置为前一页
    expect(page.value).toBe(2);
    expect(data.value).toStrictEqual([4, 5, 6, 7]);
    expect(total.value).toBe(totalPrev - 1);
  });

  test('should refresh current page and will not prefetch when close cache', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list-short', {
        localCache: 0,
        params: {
          page,
          pageSize
        }
      });

    const { data, page, pageSize, replace, remove, onSuccess, onFetchSuccess, insert } = usePagination(getter, {
      data: res => res.list,
      total: res => res.total,
      initialPage: 2,
      initialPageSize: 4
    });

    const mockFn = jest.fn();
    onFetchSuccess(mockFn);
    await untilCbCalled(onSuccess);

    // 删除数据
    remove(1);
    setMockShortListData(data => {
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.splice(5, 1);
      return data;
    });

    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual([4, 6, 7, 8]);
    // 当前页缓存要保持一致
    let cache = queryCache(getter(page.value, pageSize.value));
    expect(cache).toBeUndefined();

    // 插入数据，插入时不会刷新数据
    insert(100, 0);
    setMockShortListData(data => {
      data.splice(4, 0, 100);
      return data;
    });
    expect(data.value).toStrictEqual([100, 4, 6, 7]);

    // 替换数据
    replace(200, 1);
    setMockShortListData(data => {
      data.splice(5, 1, 200);
      return data;
    });
    expect(data.value).toStrictEqual([100, 200, 6, 7]);
    // method没有设置缓存时，不会触发数据拉取
    expect(mockFn).not.toBeCalled();
  });

  // 下拉加载更多相关
  test('load more mode paginated data. and change page/pageSize', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, pageSize, isLastPage, onSuccess } = usePagination(getter, {
      total: () => undefined,
      data: res => res.list,
      append: true,
      preloadNextPage: false,
      preloadPreviousPage: false
    });

    await untilCbCalled(onSuccess);
    expect(page.value).toBe(1);
    expect(pageSize.value).toBe(10);
    expect(data.value.length).toBe(pageSize.value);
    expect(data.value[0]).toBe(0);
    expect(isLastPage.value).toBeFalsy();

    // 检查预加载缓存
    await untilCbCalled(setTimeout, 100);
    setCache(getter(page.value + 1, pageSize.value), cache => {
      expect(!!cache).toBeFalsy();
    });

    page.value++;
    await untilCbCalled(onSuccess);
    expect(page.value).toBe(2);
    expect(pageSize.value).toBe(10);
    expect(data.value.length).toBe(pageSize.value * 2);
    expect(data.value[0]).toBe(0);
    expect(data.value[data.value.length - 1]).toBe(19);
    expect(isLastPage.value).toBeFalsy();

    // 检查预加载缓存
    await untilCbCalled(setTimeout, 100);
    setCache(getter(page.value + 1, pageSize.value), cache => {
      expect(!!cache).toBeFalsy();
    });

    // 最后一页
    page.value = 31;
    await untilCbCalled(onSuccess);
    expect(isLastPage.value).toBeTruthy();
  });

  test('load more paginated data with conditions search', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize, keyword) =>
      alovaInst.Get('/list-with-search', {
        params: {
          page,
          pageSize,
          keyword
        }
      });
    const keyword = ref('');
    const { page, data, onSuccess } = usePagination((p, ps) => getter(p, ps, keyword.value), {
      watchingStates: [keyword],
      total: () => undefined,
      data: res => res.list,
      append: true
    });

    await untilCbCalled(onSuccess);
    expect(data.value[0]).toStrictEqual({ id: 0, word: 'aaa' });
    expect(data.value[data.value.length - 1]).toStrictEqual({ id: 9, word: 'aaa' });

    page.value++;
    await untilCbCalled(onSuccess);
    expect(data.value.length).toBe(20);
    expect(data.value[0]).toStrictEqual({ id: 0, word: 'aaa' });
    expect(data.value[data.value.length - 1]).toStrictEqual({ id: 19, word: 'bbb' });

    keyword.value = 'bbb';
    await untilCbCalled(onSuccess);
    data.value.forEach(({ word }) => expect(word).toBe('bbb'));
    expect(data.value[0]).toStrictEqual({ id: 1, word: 'bbb' });
    expect(data.value.length).toBe(10);
  });

  test('load more mode paginated data refersh page by page number', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, onSuccess, refresh } = usePagination(getter, {
      total: () => undefined,
      data: res => res.list,
      append: true,
      preloadNextPage: false,
      preloadPreviousPage: false
    });

    await untilCbCalled(onSuccess);
    expect(data.value[0]).toBe(0);
    expect(data.value[data.value.length - 1]).toBe(9);

    page.value++;
    await untilCbCalled(onSuccess);
    expect(data.value[0]).toBe(0);
    expect(data.value[data.value.length - 1]).toBe(19);

    setMockListData(data => {
      data.splice(0, 1, 100);
      return data;
    });

    expect(() => {
      refresh(100);
    }).toThrow();

    refresh(1);
    await untilCbCalled(onSuccess); // append模式下将使用send函数重新请求数据
    expect(data.value).toStrictEqual(generateContinuousNumbers(19, 0, { 0: 100 }));
    expect(data.value.length).toBe(20);

    setMockListData(data => {
      data.splice(12, 1, 1200);
      return data;
    });
  });

  test('load more mode paginated data refersh page by item', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list-with-search', {
        params: {
          page,
          pageSize
        }
      });
    const { page, data, onSuccess, total, refresh } = usePagination((p, ps) => getter(p, ps), {
      total: res => res.total,
      data: res => res.list,
      append: true
    });

    await untilCbCalled(onSuccess);
    let currentList = generateContinuousNumbers(9, 0, i => {
      let n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    expect(data.value).toStrictEqual(currentList);
    expect(total.value).toBe(300);

    page.value++;
    await untilCbCalled(onSuccess);
    currentList = generateContinuousNumbers(19, 0, i => {
      let n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    expect(data.value).toStrictEqual(currentList);

    setMockListWithSearchData(data => {
      data.splice(12, 1, { id: 100, word: 'zzz' });
      return data;
    });

    refresh(data.value[12]);
    await untilCbCalled(onSuccess);
    currentList[12] = { id: 100, word: 'zzz' };
    expect(data.value).toStrictEqual(currentList);
  });

  test('load more mode paginated data operate items with remove/insert/replace(open preload)', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, total, pageCount, remove, insert, replace } = usePagination(getter, {
      total: () => undefined,
      data: res => res.list,
      initialPage: 2, // 默认从第2页开始
      initialPageSize: 4
    });

    await untilCbCalled(setTimeout, 150);
    expect(total.value).toBeUndefined();
    expect(pageCount.value).toBeUndefined();
    remove(1);
    remove(1);
    insert(100, 0);
    replace(200, 2);
    setMockListData(data => {
      // 模拟数据中同步删除，这样fetch的数据校验才正常
      data.splice(5, 2);
      data.splice(4, 0, 100);
      data.splice(6, 1, 200);
      return data;
    });
    expect(data.value).toStrictEqual([100, 4, 200, 8]);
    expect(total.value).toBeUndefined();
    expect(pageCount.value).toBeUndefined();

    page.value++;
  });

  test('load more mode paginated data remove item without preload', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, pageSize, onSuccess, onFetchSuccess, remove } = usePagination(getter, {
      total: () => undefined,
      data: res => res.list,
      append: true,
      preloadNextPage: false,
      preloadPreviousPage: false,
      initialPageSize: 4
    });

    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual([0, 1, 2, 3]);

    // 下一页没有缓存的情况下，将会重新请求刷新列表
    remove(0);
    remove(0);
    setMockListData(data => {
      // 模拟数据中同步删除
      data.splice(0, 2);
      return data;
    });

    expect(data.value).toStrictEqual([0, 1, 2, 3]);
    const mockFn = jest.fn();
    onFetchSuccess(mockFn);

    await untilCbCalled(setTimeout, 100);
    expect(data.value).toStrictEqual([2, 3, 4, 5]);
    expect(mockFn.mock.calls.length).toBe(0);
    setCache(getter(page.value - 1, pageSize.value), cache => {
      expect(!!cache).toBeFalsy();
    });
    setCache(getter(page.value + 1, pageSize.value), cache => {
      expect(!!cache).toBeFalsy();
    });
  });

  test('load more mode reload paginated data', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, onSuccess, reload } = usePagination(getter, {
      total: () => undefined,
      data: res => res.list,
      append: true,
      initialPageSize: 4
    });

    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual([0, 1, 2, 3]);
    setMockListData(data => {
      data.splice(0, 1, 100);
      return data;
    });
    reload();
    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual([100, 1, 2, 3]);

    page.value++;
    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual([100, 1, 2, 3, 4, 5, 6, 7]);

    reload();
    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual([100, 1, 2, 3]);
  });

  test("load more mode paginated data don't need to preload when go to last page", async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list-short', {
        params: {
          page,
          pageSize
        }
      });

    const { data, page, pageSize, onSuccess } = usePagination(getter, {
      total: () => undefined,
      data: res => res.list,
      append: true,
      initialPage: 2,
      initialPageSize: 4
    });

    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual([4, 5, 6, 7]);

    page.value++;
    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual([4, 5, 6, 7, 8, 9]);

    // 已经到最后一页了，不需要再预加载下一页数据了
    await untilCbCalled(setTimeout, 100);
    setCache(getter(page.value + 1, pageSize.value), cache => {
      expect(cache).toBeUndefined();
    });
  });

  test('should access actions by middleware actionDelegation', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list-short', {
        localCache: 0,
        params: {
          page,
          pageSize
        }
      });

    const { onSuccess } = usePagination(getter, {
      total: () => undefined,
      data: res => res.list,
      append: true,
      initialPage: 2,
      initialPageSize: 4,
      middleware: actionDelegationMiddleware('test_page')
    });

    const successFn = jest.fn();
    onSuccess(successFn);
    await untilCbCalled(onSuccess);
    expect(successFn).toHaveBeenCalledTimes(1);

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

    await untilCbCalled(onSuccess);
    expect(successFn).toHaveBeenCalledTimes(2);
  });

  test('should update list data when call update function that returns in hook', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { loading, onSuccess, data, update } = usePagination(getter, {
      total: () => undefined,
      data: res => res.list,
      append: true,
      initialPage: 2,
      initialPageSize: 4
    });

    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual([4, 5, 6, 7]);
    update({
      loading: true
    });
    expect(loading.value).toBeTruthy();

    update({
      data: []
    });
    expect(data.value).toStrictEqual([]);
  });

  test('should set initial data to data and total', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        }
      });

    const { data, total } = usePagination(getter, {
      total: res => res.total,
      data: res => res.list,
      initialData: {
        list: [1, 2, 3],
        total: 3
      },
      immediate: false,
      initialPage: 2,
      initialPageSize: 4
    });

    expect(data.value).toStrictEqual([1, 2, 3]);
    expect(total.value).toBe(3);
  });

  test('can resend request when encounter with an error', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize) =>
      alovaInst.Get('/list', {
        params: {
          page,
          pageSize
        },
        transformData: () => {
          throw new Error('mock error');
        }
      });

    const { onError, onComplete, reload } = usePagination(getter, {
      total: res => res.total,
      data: res => res.list
    });
    const errorFn = jest.fn();
    const completeFn = jest.fn();
    onError(errorFn);
    onComplete(completeFn);

    await untilCbCalled(setTimeout, 200);
    expect(errorFn).toHaveBeenCalledTimes(1);
    expect(completeFn).toHaveBeenCalledTimes(1);

    reload();
    await untilCbCalled(setTimeout, 200);
    expect(errorFn).toHaveBeenCalledTimes(2);
    expect(completeFn).toHaveBeenCalledTimes(2);

    reload();
    await untilCbCalled(setTimeout, 200);
    expect(errorFn).toHaveBeenCalledTimes(3);
    expect(completeFn).toHaveBeenCalledTimes(3);
  });

  test('should use the data of last request when set `abortLast` to true', async () => {
    const alovaInst = createMockAlova();
    const getter = (page, pageSize, keyword) =>
      alovaInst.Get('/list-with-search', {
        params: {
          page,
          pageSize,
          keyword
        }
      });
    const keyword = ref('');
    const { data, onSuccess, total } = usePagination((p, ps) => getter(p, ps, keyword.value), {
      watchingStates: [keyword],
      abortLast: true,
      data: res => res.list
    });
    const successFn = jest.fn();
    onSuccess(successFn);
    let currentList = generateContinuousNumbers(9, 0, i => {
      let n = i % 3;
      return {
        id: i,
        word: ['aaa', 'bbb', 'ccc'][n]
      };
    });
    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual(currentList);
    expect(total.value).toBe(300);

    keyword.value = 'bbb';
    await new Promise(resolve => setTimeout(resolve, 40));
    keyword.value = '';
    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual(currentList);
    expect(total.value).toBe(300);
    expect(successFn).toHaveBeenCalledTimes(2);
  });
});
