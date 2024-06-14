import { getAlovaInstance } from '#/utils';
import { useFetcher, useRequest } from '@/index';
import VueHook from '@/statesHook/vue';
import { queryCache } from 'alova';
import { Result, untilCbCalled } from 'root/testUtils';
import { FetcherType } from '~/typings';

describe('use useFetcher hook to fetch data', () => {
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
        cacheFor: 100 * 1000
      });

    const Get1 = createGet({ a: '1', b: '2', countKey: 'a' });
    const { data, onSuccess } = useRequest(Get1);

    // fetcher默认不强制请求，会命中缓存
    const { loading, downloading, error, fetch, onSuccess: onFetchSuccess } = useFetcher<FetcherType<typeof alova>>();
    expect(loading.value).toBeFalsy();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(data.value.params.count).toBe(0);
    // 缓存有值
    let cacheData = await queryCache(Get1);
    expect(cacheData?.params).toEqual({ a: '1', b: '2', countKey: 'a', count: 0 });

    fetch(Get1);
    // 缓存会被命中，不会发出请求
    expect(loading.value).toBeFalsy();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onFetchSuccess);
    expect(data.value.params.count).toBe(0);
    expect(loading.value).toBeFalsy();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    cacheData = await queryCache(Get1);
    expect(cacheData?.params).toEqual({ a: '1', b: '2', countKey: 'a', count: 0 });
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
        cacheFor: 100 * 1000
      });

    const Get1 = createGet({ a: '1', b: '2', countKey: 'b' });
    const { data, onSuccess } = useRequest(Get1);
    const { loading, error, fetch, onSuccess: onFetchSuccess } = useFetcher<FetcherType<typeof alova>>({ force: true }); // 忽略缓存强制请求
    expect(loading.value).toBeFalsy();
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(data.value.params.count).toBe(0);
    // 缓存有值
    let cacheData = await queryCache(Get1);
    expect(cacheData?.params).toEqual({ a: '1', b: '2', countKey: 'b', count: 0 });

    fetch(Get1);
    await untilCbCalled(setTimeout, 10);
    // 因强制请求，请求会被发出并且缓存重新被更新
    expect(loading.value).toBeTruthy();
    expect(error.value).toBeUndefined();

    await untilCbCalled(onFetchSuccess);
    expect(data.value.params.count).toBe(1);
    expect(loading.value).toBeFalsy();
    expect(error.value).toBeUndefined();
    cacheData = await queryCache(Get1);
    expect(cacheData?.params).toEqual({ a: '1', b: '2', countKey: 'b', count: 1 });
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
        cacheFor: 100 * 1000
      });

    const Get1 = createGet({ a: '1', b: '2', countKey: 'c' });
    await Get1.send();

    const mockFn = jest.fn();
    const {
      loading,
      fetch,
      onSuccess: onFetchSuccess
    } = useFetcher<FetcherType<typeof alova>>({
      force({ sendArgs: [p1, p2] }) {
        mockFn();
        expect(p1).toBeTruthy();
        expect(p2).toBeFalsy();
        return true;
      }
    });
    // 缓存有值
    let cacheData = await queryCache(Get1);
    expect(cacheData?.params).toEqual({ a: '1', b: '2', countKey: 'c', count: 0 });

    fetch(Get1, true, false);
    await untilCbCalled(setTimeout, 10);
    // 因强制请求，请求会被发出并且缓存重新被更新
    expect(loading.value).toBeTruthy();

    await untilCbCalled(onFetchSuccess);
    expect(loading.value).toBeFalsy();
    cacheData = await queryCache(Get1);
    expect(cacheData?.params).toEqual({ a: '1', b: '2', countKey: 'c', count: 1 });
    expect(mockFn).toHaveBeenCalled();
  });

  test('should returns a promise when call function fetch', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const createGet = (params: Record<string, string>) =>
      alova.Get('/unit-test-count', {
        params,
        cacheFor: 0,
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

    const { loading, error, update } = useFetcher<FetcherType<typeof alova>>();
    update({
      loading: true,
      error: new Error('custom fetch error')
    });
    expect(loading.value).toBeTruthy();
    expect(error.value?.message).toBe('custom fetch error');
  });

  test('should not update states when useFetcher with updateState is false', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const createGet = (params: Record<string, string>) =>
      alova.Get('/unit-test-count', {
        params,
        cacheFor: 5 * 60 * 1000,
        transformData(result: Result) {
          return result.data;
        }
      });

    const { data, onSuccess, send } = useRequest(params => createGet(params || { page: '1', countKey: 'pagination' }));
    await untilCbCalled(onSuccess);
    const { fetch, loading, error } = useFetcher<FetcherType<typeof alova>>({ updateState: false });
    let res = await fetch(createGet({ page: '2', countKey: 'pagination' }));

    expect(loading.value).toBeFalsy();
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

    expect(loading.value).toBeFalsy();
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
        cacheFor: 5 * 60 * 1000,
        transformData(result: Result) {
          return result.data;
        }
      });

    const { data, onSuccess, send } = useRequest(params => createGet(params || { page: '1', countKey: 'pagination1' }));
    await untilCbCalled(onSuccess);
    const { fetch, loading, error } = useFetcher<FetcherType<typeof alova>>();
    let res = await fetch(createGet({ page: '2', countKey: 'pagination1' }));

    expect(loading.value).toBeFalsy();
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

    expect(loading.value).toBeFalsy();
    expect(error.value).toBeFalsy();

    expect(res).toStrictEqual(data.value);
  });
});
