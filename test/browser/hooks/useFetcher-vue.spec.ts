import { useFetcher, useRequest } from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { FetcherType } from '../../../typings';
import { getAlovaInstance, mockServer, untilCbCalled } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

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
});
