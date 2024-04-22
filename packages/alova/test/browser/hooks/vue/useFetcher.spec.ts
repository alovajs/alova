import { getAlovaInstance } from '#/utils';
import { useFetcher, useRequest } from '@/index';
import VueHook from '@/predefine/VueHook';
import { getResponseCache } from '@/storage/responseCache';
import { key } from '@/utils/helper';
import { Result, untilCbCalled } from 'root/testUtils';
import { FetcherType } from '~/typings';

describe('use useFetcher hook to fetch data', function () {
  test('should hit cached response when fetch data with default config', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const createGet = (params: Record<string, string>) =>
      alova.Get('/unit-test-count', {
        params,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        transformData(result: Result) {
          return result.data;
        },
        localCache: 100 * 1000
      });

    const Get1 = createGet({ a: '1', b: '2', countKey: 'a' });
    const { data, onSuccess } = useRequest(Get1);

    // fetcher默认不强制请求，会命中缓存
    const { fetching, downloading, error, fetch, onSuccess: onFetchSuccess } = useFetcher<FetcherType<typeof alova>>();
    expect(fetching.value).toBeFalsy();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(data.value.params.count).toBe(0);
    // 缓存有值
    let cacheData = getResponseCache(alova.id, key(Get1));
    expect(cacheData.params).toEqual({ a: '1', b: '2', countKey: 'a', count: 0 });

    fetch(Get1);
    // 缓存会被命中，不会发出请求
    expect(fetching.value).toBeFalsy();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onFetchSuccess);
    expect(data.value.params.count).toBe(0);
    expect(fetching.value).toBeFalsy();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    cacheData = getResponseCache(alova.id, key(Get1));
    expect(cacheData.params).toEqual({ a: '1', b: '2', countKey: 'a', count: 0 });
  });

  test('should replace cached response when force fetch data', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const createGet = (params: Record<string, string>) =>
      alova.Get('/unit-test-count', {
        params,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        transformData(result: Result) {
          return result.data;
        },
        localCache: 100 * 1000
      });

    const Get1 = createGet({ a: '1', b: '2', countKey: 'b' });
    const { data, onSuccess } = useRequest(Get1);
    const {
      fetching,
      downloading,
      error,
      fetch,
      onSuccess: onFetchSuccess
    } = useFetcher<FetcherType<typeof alova>>({ force: true }); // 忽略缓存强制请求
    expect(fetching.value).toBeFalsy();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(data.value.params.count).toBe(0);
    // 缓存有值
    let cacheData = getResponseCache(alova.id, key(Get1));
    expect(cacheData.params).toEqual({ a: '1', b: '2', countKey: 'b', count: 0 });

    fetch(Get1);
    // 因强制请求，请求会被发出并且缓存重新被更新
    expect(fetching.value).toBeTruthy();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onFetchSuccess);
    expect(data.value.params.count).toBe(1);
    expect(fetching.value).toBeFalsy();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    cacheData = getResponseCache(alova.id, key(Get1));
    expect(cacheData.params).toEqual({ a: '1', b: '2', countKey: 'b', count: 1 });
  });

  test('args in fetch should pass to the force function', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const createGet = (params: Record<string, string>) =>
      alova.Get('/unit-test-count', {
        params,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        transformData(result: Result) {
          return result.data;
        },
        localCache: 100 * 1000
      });

    const Get1 = createGet({ a: '1', b: '2', countKey: 'c' });
    await Get1.send();

    const mockFn = jest.fn();
    const {
      fetching,
      fetch,
      onSuccess: onFetchSuccess
    } = useFetcher<FetcherType<typeof alova>>({
      force(p1, p2) {
        mockFn();
        expect(p1).toBeTruthy();
        expect(p2).toBeFalsy();
        return true;
      }
    });
    // 缓存有值
    let cacheData = getResponseCache(alova.id, key(Get1));
    expect(cacheData.params).toEqual({ a: '1', b: '2', countKey: 'c', count: 0 });

    fetch(Get1, true, false);
    // 因强制请求，请求会被发出并且缓存重新被更新
    expect(fetching.value).toBeTruthy();

    await untilCbCalled(onFetchSuccess);
    expect(fetching.value).toBeFalsy();
    cacheData = getResponseCache(alova.id, key(Get1));
    expect(cacheData.params).toEqual({ a: '1', b: '2', countKey: 'c', count: 1 });
    expect(mockFn).toHaveBeenCalled();
  });

  test('should returns a promise when call function fetch', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const createGet = (params: Record<string, string>) =>
      alova.Get('/unit-test-count', {
        params,
        localCache: 0,
        transformData(result: Result) {
          return result.data;
        }
      });

    const get1 = createGet({ a: '1', b: '2', countKey: 'gg' });
    const { data, onSuccess } = useRequest(get1);
    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { a: '1', b: '2', countKey: 'gg', count: 0 }
    });

    const { fetch } = useFetcher<FetcherType<typeof alova>>();
    const res = await fetch(get1);

    expect(data.value).toStrictEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { a: '1', b: '2', countKey: 'gg', count: 1 }
    });
    expect(res).toStrictEqual(data.value);
  });

  test('should update states when call update returns in useFetcher', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });

    const { fetching, error, update } = useFetcher<FetcherType<typeof alova>>();
    update({
      fetching: true,
      error: new Error('custom fetch error')
    });
    expect(fetching.value).toBeTruthy();
    expect(error.value?.message).toBe('custom fetch error');
  });

  test('should not update states when useFetcher with updateState is false', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const createGet = (params: Record<string, string>) =>
      alova.Get('/unit-test-count', {
        params,
        localCache: 5 * 60 * 1000,
        transformData(result: Result) {
          return result.data;
        }
      });

    const { data, onSuccess, send } = useRequest(params => createGet(params || { page: '1', countKey: 'pagination' }));
    await untilCbCalled(onSuccess);
    const { fetch, fetching, error } = useFetcher<FetcherType<typeof alova>>({ updateState: false });
    let res = await fetch(createGet({ page: '2', countKey: 'pagination' }));

    expect(fetching.value).toBeFalsy();
    expect(error.value).toBeFalsy();

    expect(data.value).toStrictEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { page: '1', countKey: 'pagination', count: 0 }
    });

    expect(res).toStrictEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { page: '2', countKey: 'pagination', count: 1 }
    });

    send({ page: '2', countKey: 'pagination' });
    await untilCbCalled(onSuccess);
    send({ page: '1', countKey: 'pagination' });
    await untilCbCalled(onSuccess);
    res = await fetch(createGet({ page: '2', countKey: 'pagination' }));

    expect(fetching.value).toBeFalsy();
    expect(error.value).toBeFalsy();

    expect(data.value).toStrictEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { page: '1', countKey: 'pagination', count: 0 }
    });
  });

  test('should update states when useFetcher without updateState', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const createGet = (params: Record<string, string>) =>
      alova.Get('/unit-test-count', {
        params,
        localCache: 5 * 60 * 1000,
        transformData(result: Result) {
          return result.data;
        }
      });

    const { data, onSuccess, send } = useRequest(params => createGet(params || { page: '1', countKey: 'pagination1' }));
    await untilCbCalled(onSuccess);
    const { fetch, fetching, error } = useFetcher<FetcherType<typeof alova>>();
    let res = await fetch(createGet({ page: '2', countKey: 'pagination1' }));

    expect(fetching.value).toBeFalsy();
    expect(error.value).toBeFalsy();

    expect(data.value).toStrictEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { page: '1', countKey: 'pagination1', count: 0 }
    });

    expect(res).toStrictEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { page: '2', countKey: 'pagination1', count: 1 }
    });

    send({ page: '2', countKey: 'pagination1' });
    await untilCbCalled(onSuccess);
    send({ page: '1', countKey: 'pagination1' });
    await untilCbCalled(onSuccess);
    res = await fetch(createGet({ page: '2', countKey: 'pagination1' }));

    expect(fetching.value).toBeFalsy();
    expect(error.value).toBeFalsy();

    expect(res).toStrictEqual(data.value);
  });
});
