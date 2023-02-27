import { invalidateCache, queryCache, useRequest } from '../../../src';
import Method from '../../../src/Method';
import VueHook from '../../../src/predefine/VueHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { getAlovaInstance, mockServer, untilCbCalled } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('invalitate cached response data', () => {
  test('It will use the default cache time when not set the cache time with `GET`', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    const firstState = useRequest(Get);
    await untilCbCalled(firstState.onSuccess);
    const cachedData = getResponseCache(alova.id, key(Get));
    expect(cachedData).toEqual({ path: '/unit-test', method: 'GET', params: {} });
  });

  test('the cached response data should be removed', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      localCache: 100000,
      transformData: ({ data }: Result) => data
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
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      localCache: Infinity,
      transformData: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test-count', {
      params: { countKey: 'c' },
      localCache: Infinity,
      transformData: ({ data }: Result) => data
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    await Promise.all([untilCbCalled(firstState.onSuccess), untilCbCalled(secondState.onSuccess)]);

    // 检查缓存情况
    const firstState2 = useRequest(Get1);
    expect(firstState2.loading.value).toBeFalsy();
    const secondState2 = useRequest(Get2);
    expect(secondState2.loading.value).toBeFalsy();
    await Promise.all([untilCbCalled(firstState2.onSuccess), untilCbCalled(secondState2.onSuccess)]);
    expect(firstState2.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState2.data.value).toEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 0, countKey: 'c' }
    });

    invalidateCache(); // 清空缓存

    // 缓存清空，会重新请求
    const firstState3 = useRequest(Get1);
    expect(firstState3.loading.value).toBeTruthy();
    const secondState3 = useRequest(Get2);
    expect(secondState3.loading.value).toBeTruthy();
    await Promise.all([untilCbCalled(firstState3.onSuccess), untilCbCalled(secondState3.onSuccess)]);
    expect(firstState3.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState3.data.value).toEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 1, countKey: 'c' }
    });
  });

  test('cache in method array will be removed', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      localCache: Infinity,
      transformData: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test', {
      localCache: Infinity,
      transformData: ({ data }: Result) => data
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    await Promise.all([untilCbCalled(firstState.onSuccess), untilCbCalled(secondState.onSuccess)]);

    // 检查缓存情况
    expect(getResponseCache(alova.id, key(Get1))).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(getResponseCache(alova.id, key(Get2))).toEqual({ path: '/unit-test', method: 'GET', params: {} });

    invalidateCache([Get1, Get2]); // 删除缓存

    // 缓存清空，会重新请求
    const firstState3 = useRequest(Get1);
    expect(firstState3.loading.value).toBeTruthy();
    const secondState3 = useRequest(Get2);
    expect(secondState3.loading.value).toBeTruthy();
  });

  test('cache will be removed when invalidateCache is called with specific string', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      name: 'test-get1',
      localCache: Infinity,
      transformData: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test-count', {
      name: 'test-get2',
      params: { countKey: 'd' },
      localCache: Infinity,
      transformData: ({ data }: Result) => data
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    expect(firstState.loading.value).toBeTruthy();
    expect(secondState.loading.value).toBeTruthy();
    await Promise.all([untilCbCalled(firstState.onSuccess), untilCbCalled(secondState.onSuccess)]);

    // 检查缓存情况
    const firstState2 = useRequest(Get1);
    expect(firstState2.loading.value).toBeFalsy();
    const secondState2 = useRequest(Get2);
    expect(secondState2.loading.value).toBeFalsy();
    await Promise.all([untilCbCalled(firstState2.onSuccess), untilCbCalled(secondState2.onSuccess)]);
    expect(firstState2.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState2.data.value).toEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 0, countKey: 'd' }
    });

    invalidateCache('test-get1'); // 删除test-get1缓存

    // 缓存清空，会重新请求
    const firstState3 = useRequest(Get1);
    expect(firstState3.loading.value).toBeTruthy();
    const secondState3 = useRequest(Get2);
    expect(secondState3.loading.value).toBeFalsy(); // 还有缓存，不会发起请求
    await Promise.all([untilCbCalled(firstState3.onSuccess), untilCbCalled(secondState3.onSuccess)]);
    expect(secondState3.data.value).toEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 0, countKey: 'd' }
    });
  });

  test("cache will be removed that invalidateCache's regexp matches", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      name: 'test-get1',
      localCache: Infinity,
      transformData: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test-count', {
      name: 'test-get2',
      params: { countKey: 'e' },
      localCache: Infinity,
      transformData: ({ data }: Result) => data
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    await Promise.all([untilCbCalled(firstState.onSuccess), untilCbCalled(secondState.onSuccess)]);

    // 检查缓存情况
    const firstState2 = useRequest(Get1);
    expect(firstState2.loading.value).toBeFalsy();
    const secondState2 = useRequest(Get2);
    expect(secondState2.loading.value).toBeFalsy();
    await Promise.all([untilCbCalled(firstState2.onSuccess), untilCbCalled(secondState2.onSuccess)]);
    expect(firstState2.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState2.data.value).toEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 0, countKey: 'e' }
    });

    invalidateCache(/^test-get/); // 删除匹配名称的缓存

    // 缓存清空，会重新请求
    const firstState3 = useRequest(Get1);
    expect(firstState3.loading.value).toBeTruthy();
    const secondState3 = useRequest(Get2);
    expect(secondState3.loading.value).toBeTruthy();
    await Promise.all([untilCbCalled(firstState3.onSuccess), untilCbCalled(secondState3.onSuccess)]);
    expect(firstState3.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState3.data.value).toEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 1, countKey: 'e' }
    });
  });

  test("cache will be removed that invalidateCache's regexp matches and filter one", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      name: 'test1-get',
      localCache: Infinity,
      transformData: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test-count', {
      name: 'test2-get',
      params: { countKey: 'f' },
      localCache: Infinity,
      transformData: ({ data }: Result) => data
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    await Promise.all([untilCbCalled(firstState.onSuccess), untilCbCalled(secondState.onSuccess)]);

    // 检查缓存情况
    const firstState2 = useRequest(Get1);
    expect(firstState2.loading.value).toBeFalsy();
    const secondState2 = useRequest(Get2);
    expect(secondState2.loading.value).toBeFalsy();
    await Promise.all([untilCbCalled(firstState2.onSuccess), untilCbCalled(secondState2.onSuccess)]);
    expect(firstState2.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState2.data.value).toEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 0, countKey: 'f' }
    });

    const mockfn = jest.fn(() => {});
    invalidateCache({
      name: /^test(.)-get/,
      filter: (method, index, ary) => {
        mockfn();
        expect(method instanceof Method).toBeTruthy();
        expect(ary.length).toBe(2);
        return index === 1;
      }
    }); // 删除匹配名称的缓存

    expect(mockfn.mock.calls.length).toBe(2);

    // Get2的缓存会被清空，会重新请求
    const firstState3 = useRequest(Get1);
    expect(firstState3.loading.value).toBeFalsy();
    const secondState3 = useRequest(Get2);
    expect(secondState3.loading.value).toBeTruthy();
    await Promise.all([untilCbCalled(firstState3.onSuccess), untilCbCalled(secondState3.onSuccess)]);
    expect(firstState3.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState3.data.value).toEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 1, countKey: 'f' }
    });
  });

  test("shouldn't throw error when not match any one", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      name: 'test-get1',
      localCache: Infinity,
      transformData: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test-count', {
      name: 'test-get2',
      params: { countKey: 'g' },
      localCache: Infinity,
      transformData: ({ data }: Result) => data
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    expect(firstState.loading.value).toBeTruthy();
    expect(secondState.loading.value).toBeTruthy();
    await Promise.all([untilCbCalled(firstState.onSuccess), untilCbCalled(secondState.onSuccess)]);

    // 检查缓存情况
    const firstState2 = useRequest(Get1);
    expect(firstState2.loading.value).toBeFalsy();
    const secondState2 = useRequest(Get2);
    expect(secondState2.loading.value).toBeFalsy();
    await Promise.all([untilCbCalled(firstState2.onSuccess), untilCbCalled(secondState2.onSuccess)]);
    expect(firstState2.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState2.data.value).toEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 0, countKey: 'g' }
    });

    invalidateCache('test'); // 不会匹配任何缓存，因此不会失效缓存

    // 没有失效任何缓存，不会重新请求
    const firstState3 = useRequest(Get1);
    expect(firstState3.loading.value).toBeFalsy();
    const secondState3 = useRequest(Get2);
    expect(secondState3.loading.value).toBeFalsy();
    await Promise.all([untilCbCalled(firstState3.onSuccess), untilCbCalled(secondState3.onSuccess)]);
    expect(secondState3.data.value).toEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 0, countKey: 'g' }
    });
  });

  test('should match method even if change method in beforeRequest', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json(),
      beforeRequestExpect(methodInstance) {
        methodInstance.config.headers = methodInstance.config.headers || {};
        methodInstance.config.headers.token = 'token';
      }
    });
    const Get1 = () =>
      alova.Get('/unit-test', {
        name: 'test10-get',
        localCache: Infinity,
        transformData: ({ data }: Result) => data
      });
    const Get2 = () =>
      alova.Get('/unit-test', {
        name: 'test20-get',
        params: { key: 'f' },
        localCache: Infinity,
        transformData: ({ data }: Result) => data
      });

    const firstState = useRequest(Get1());
    const secondState = useRequest(Get2());
    await Promise.all([untilCbCalled(firstState.onSuccess), untilCbCalled(secondState.onSuccess)]);

    expect(queryCache(Get1())).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {}
    });
    expect(queryCache(Get2())).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: { key: 'f' }
    });

    invalidateCache('test10-get');
    expect(queryCache(Get1())).toBeUndefined();

    invalidateCache(Get2());
    expect(queryCache(Get2())).toBeUndefined();
  });
});
