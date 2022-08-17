import {
  createAlova,
  GlobalFetch,
  useFetcher,
  useRequest,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { AlovaRequestAdapterConfig } from '../../../typings';
import { Result } from '../result.type';
import server, { untilCbCalled } from '../../server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
function getInstance(
  beforeRequestExpect?: (config: AlovaRequestAdapterConfig<any, any, RequestInit, Headers>) => void,
  responseExpect?: (jsonPromise: Promise<any>) => void,
  resErrorExpect?: (err: Error) => void,
) {
  return createAlova({
    baseURL: 'http://localhost:3000',
    timeout: 3000,
    statesHook: VueHook,
    requestAdapter: GlobalFetch(),
    beforeRequest(config) {
      beforeRequestExpect && beforeRequestExpect(config);
      return config;
    },
    responsed: {
      onSuccess: response => {
        const jsonPromise = response.json();
        responseExpect && responseExpect(jsonPromise);
        return jsonPromise;
      },
      onError: err => {
        resErrorExpect && resErrorExpect(err);
      }
    }
  });
}

describe('use useFetcher hook to fetch data', function() {
  test('should hit cached response when fetch data with default config', async () => {
    const alova = getInstance();
    const createGet = (params: Record<string, string>) => alova.Get('/unit-test-count', {
      params,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData(result: Result, _) {
        return result.data;
      },
      localCache: 100 * 1000,
    });

    const Get1 = createGet({ a: '1', b: '2', countKey: 'a'});
    const {
      data,
      onSuccess
    } = useRequest(Get1);

    const {
      fetching,
      downloading,
      error,
      fetch,
      onSuccess: onFetchSuccess,
    } = useFetcher(alova);   // 默认不强制请求，会命中缓存
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
    const alova = getInstance();
    const createGet = (params: Record<string, string>) => alova.Get('/unit-test-count', {
      params,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData(result: Result, _) {
        return result.data;
      },
      localCache: 100 * 1000,
    });

    const Get1 = createGet({ a: '1', b: '2', countKey: 'b'});
    const {
      data,
      onSuccess
    } = useRequest(Get1);

    const {
      fetching,
      downloading,
      error,
      fetch,
      onSuccess: onFetchSuccess,
    } = useFetcher(alova, { force: true });   // 忽略缓存强制请求
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