import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { useFetcher, useRequest } from '@/index';
import VueHook from '@/predefine/VueHook';
import { getResponseCache } from '@/storage/responseCache';
import { key } from '@/utils/helper';
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
    expect(mockFn).toBeCalled();
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
});
