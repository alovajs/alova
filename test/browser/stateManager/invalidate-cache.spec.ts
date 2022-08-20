import {
  createAlova,
  useRequest,
  invalidateCache,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import GlobalFetch from '../../../src/predefine/GlobalFetch';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { AlovaRequestAdapterConfig } from '../../../typings';
import { Result } from '../result.type';
import server, { untilCbCalled } from '../../server';
import Method from '../../../src/Method';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
function getInstance(
  beforeRequestExpect?: (config: AlovaRequestAdapterConfig<any, any, RequestInit, Headers>) => void,
  responseExpect?: (jsonPromise: Promise<any>) => void,
  resErrorExpect?: (err: Error) => void,
) {
  return createAlova({
    baseURL: 'http://localhost:3000/',
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

describe('invalitate cached response data', () => {
  test('It will use the default cache time when not set the cache time with `GET`', async () => {
    const alova = getInstance();
    const Get = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data,
    });
    const firstState = useRequest(Get);
    await untilCbCalled(firstState.onSuccess);
    const cachedData = getResponseCache(alova.id, key(Get));
    expect(cachedData).toEqual({ path: '/unit-test', method: 'GET', params: {} });
  });

  test('the cached response data should be removed', async () => {
    const alova = getInstance();
    const Get = alova.Get('/unit-test', {
      localCache: 100000,
      transformData: ({ data }: Result) => data,
    });
    const firstState = useRequest(Get);
    await untilCbCalled(firstState.onSuccess);
    let cachedData = getResponseCache(alova.id, key(Get));
    expect(cachedData).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    invalidateCache(Get);
    cachedData = getResponseCache(alova.id, key(Get));
    expect(cachedData).toBeUndefined();
  });

  test('cache will be cleard when invalidateCache is called without params', async () => {
    const alova = getInstance();
    const Get1 = alova.Get('/unit-test', {
      localCache: Infinity,
      transformData: ({data}: Result) => data,
    });
    const Get2 = alova.Get('/unit-test-count', {
      params: { countKey: 'c'},
      localCache: Infinity,
      transformData: ({data}: Result) => data,
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    await Promise.all([
      untilCbCalled(firstState.onSuccess),
      untilCbCalled(secondState.onSuccess)
    ]);

    // 检查缓存情况
    const firstState2 = useRequest(Get1);
    expect(firstState2.loading.value).toBeFalsy();
    const secondState2 = useRequest(Get2);
    expect(secondState2.loading.value).toBeFalsy();
    await Promise.all([
      untilCbCalled(firstState2.onSuccess),
      untilCbCalled(secondState2.onSuccess)
    ]);
    expect(firstState2.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState2.data.value).toEqual({ path: '/unit-test-count', method: 'GET', params: { count: 0, countKey: 'c' } });

    invalidateCache();    // 清空缓存

    // 缓存清空，会重新请求
    const firstState3 = useRequest(Get1);
    expect(firstState3.loading.value).toBeTruthy();
    const secondState3 = useRequest(Get2);
    expect(secondState3.loading.value).toBeTruthy();
    await Promise.all([
      untilCbCalled(firstState3.onSuccess),
      untilCbCalled(secondState3.onSuccess)
    ]);
    expect(firstState3.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState3.data.value).toEqual({ path: '/unit-test-count', method: 'GET', params: { count: 1, countKey: 'c' } });
  });

  test('cache will be removed when invalidateCache is called with specific string', async () => {
    const alova = getInstance();
    const Get1 = alova.Get('/unit-test', {
      name: 'test-get1',
      localCache: Infinity,
      transformData: ({data}: Result) => data,
    });
    const Get2 = alova.Get('/unit-test-count', {
      name: 'test-get2',
      params: { countKey: 'd'},
      localCache: Infinity,
      transformData: ({data}: Result) => data,
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    expect(firstState.loading.value).toBeTruthy();
    expect(secondState.loading.value).toBeTruthy();
    await Promise.all([
      untilCbCalled(firstState.onSuccess),
      untilCbCalled(secondState.onSuccess)
    ]);

    // 检查缓存情况
    const firstState2 = useRequest(Get1);
    expect(firstState2.loading.value).toBeFalsy();
    const secondState2 = useRequest(Get2);
    expect(secondState2.loading.value).toBeFalsy();
    await Promise.all([
      untilCbCalled(firstState2.onSuccess),
      untilCbCalled(secondState2.onSuccess)
    ]);
    expect(firstState2.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState2.data.value).toEqual({ path: '/unit-test-count', method: 'GET', params: { count: 0, countKey: 'd' } });

    invalidateCache('test-get1');    // 删除test-get1缓存

    // 缓存清空，会重新请求
    const firstState3 = useRequest(Get1);
    expect(firstState3.loading.value).toBeTruthy();
    const secondState3 = useRequest(Get2);
    expect(secondState3.loading.value).toBeFalsy();   // 还有缓存，不会发起请求
    await Promise.all([
      untilCbCalled(firstState3.onSuccess),
      untilCbCalled(secondState3.onSuccess)
    ]);
    expect(secondState3.data.value).toEqual({ path: '/unit-test-count', method: 'GET', params: { count: 0, countKey: 'd' } });
  });

  test('cache will be removed that invalidateCache\'s regexp matches', async () => {
    const alova = getInstance();
    const Get1 = alova.Get('/unit-test', {
      name: 'test-get1',
      localCache: Infinity,
      transformData: ({data}: Result) => data,
    });
    const Get2 = alova.Get('/unit-test-count', {
      name: 'test-get2',
      params: { countKey: 'e'},
      localCache: Infinity,
      transformData: ({data}: Result) => data,
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    await Promise.all([
      untilCbCalled(firstState.onSuccess),
      untilCbCalled(secondState.onSuccess)
    ]);

    // 检查缓存情况
    const firstState2 = useRequest(Get1);
    expect(firstState2.loading.value).toBeFalsy();
    const secondState2 = useRequest(Get2);
    expect(secondState2.loading.value).toBeFalsy();
    await Promise.all([
      untilCbCalled(firstState2.onSuccess),
      untilCbCalled(secondState2.onSuccess)
    ]);
    expect(firstState2.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState2.data.value).toEqual({ path: '/unit-test-count', method: 'GET', params: { count: 0, countKey: 'e' } });

    invalidateCache(/^test-get/);    // 删除匹配名称的缓存

    // 缓存清空，会重新请求
    const firstState3 = useRequest(Get1);
    expect(firstState3.loading.value).toBeTruthy();
    const secondState3 = useRequest(Get2);
    expect(secondState3.loading.value).toBeTruthy();
    await Promise.all([
      untilCbCalled(firstState3.onSuccess),
      untilCbCalled(secondState3.onSuccess)
    ]);
    expect(firstState3.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState3.data.value).toEqual({ path: '/unit-test-count', method: 'GET', params: { count: 1, countKey: 'e' } });
  });


  test('cache will be removed that invalidateCache\'s regexp matches and filter one', async () => {
    const alova = getInstance();
    const Get1 = alova.Get('/unit-test', {
      name: 'test1-get',
      localCache: Infinity,
      transformData: ({data}: Result) => data,
    });
    const Get2 = alova.Get('/unit-test-count', {
      name: 'test2-get',
      params: { countKey: 'f'},
      localCache: Infinity,
      transformData: ({data}: Result) => data,
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    await Promise.all([
      untilCbCalled(firstState.onSuccess),
      untilCbCalled(secondState.onSuccess)
    ]);

    // 检查缓存情况
    const firstState2 = useRequest(Get1);
    expect(firstState2.loading.value).toBeFalsy();
    const secondState2 = useRequest(Get2);
    expect(secondState2.loading.value).toBeFalsy();
    await Promise.all([
      untilCbCalled(firstState2.onSuccess),
      untilCbCalled(secondState2.onSuccess)
    ]);
    expect(firstState2.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState2.data.value).toEqual({ path: '/unit-test-count', method: 'GET', params: { count: 0, countKey: 'f' } });

    const mockfn = jest.fn(() => {});
    invalidateCache({
      name: /^test(.)-get/,
      filter: (method, index, ary) => {
        mockfn();
        expect(method instanceof Method).toBeTruthy();
        expect(ary.length).toBe(2);
        return index === 1;
      },
    });    // 删除匹配名称的缓存

    expect(mockfn.mock.calls.length).toBe(2);

    // Get2的缓存会被清空，会重新请求
    const firstState3 = useRequest(Get1);
    expect(firstState3.loading.value).toBeFalsy();
    const secondState3 = useRequest(Get2);
    expect(secondState3.loading.value).toBeTruthy();
    await Promise.all([
      untilCbCalled(firstState3.onSuccess),
      untilCbCalled(secondState3.onSuccess)
    ]);
    expect(firstState3.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState3.data.value).toEqual({ path: '/unit-test-count', method: 'GET', params: { count: 1, countKey: 'f' } });
  });

  test('shouldn\'t throw error when not match any one', async () => {
    const alova = getInstance();
    const Get1 = alova.Get('/unit-test', {
      name: 'test-get1',
      localCache: Infinity,
      transformData: ({data}: Result) => data,
    });
    const Get2 = alova.Get('/unit-test-count', {
      name: 'test-get2',
      params: { countKey: 'g'},
      localCache: Infinity,
      transformData: ({data}: Result) => data,
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    expect(firstState.loading.value).toBeTruthy();
    expect(secondState.loading.value).toBeTruthy();
    await Promise.all([
      untilCbCalled(firstState.onSuccess),
      untilCbCalled(secondState.onSuccess)
    ]);

    // 检查缓存情况
    const firstState2 = useRequest(Get1);
    expect(firstState2.loading.value).toBeFalsy();
    const secondState2 = useRequest(Get2);
    expect(secondState2.loading.value).toBeFalsy();
    await Promise.all([
      untilCbCalled(firstState2.onSuccess),
      untilCbCalled(secondState2.onSuccess)
    ]);
    expect(firstState2.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState2.data.value).toEqual({ path: '/unit-test-count', method: 'GET', params: { count: 0, countKey: 'g' } });

    invalidateCache('test');    // 不会匹配任何缓存，因此不会失效缓存

    // 没有失效任何缓存，不会重新请求
    const firstState3 = useRequest(Get1);
    expect(firstState3.loading.value).toBeFalsy();
    const secondState3 = useRequest(Get2);
    expect(secondState3.loading.value).toBeFalsy();
    await Promise.all([
      untilCbCalled(firstState3.onSuccess),
      untilCbCalled(secondState3.onSuccess)
    ]);
    expect(secondState3.data.value).toEqual({ path: '/unit-test-count', method: 'GET', params: { count: 0, countKey: 'g' } });
  });
});