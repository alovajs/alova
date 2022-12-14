import { invalidateCache, useRequest } from '../../../src';
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

    // ??????????????????
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

    invalidateCache(); // ????????????

    // ??????????????????????????????
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

    // ??????????????????
    expect(getResponseCache(alova.id, key(Get1))).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(getResponseCache(alova.id, key(Get2))).toEqual({ path: '/unit-test', method: 'GET', params: {} });

    invalidateCache([Get1, Get2]); // ????????????

    // ??????????????????????????????
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

    // ??????????????????
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

    invalidateCache('test-get1'); // ??????test-get1??????

    // ??????????????????????????????
    const firstState3 = useRequest(Get1);
    expect(firstState3.loading.value).toBeTruthy();
    const secondState3 = useRequest(Get2);
    expect(secondState3.loading.value).toBeFalsy(); // ?????????????????????????????????
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

    // ??????????????????
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

    invalidateCache(/^test-get/); // ???????????????????????????

    // ??????????????????????????????
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

    // ??????????????????
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
    }); // ???????????????????????????

    expect(mockfn.mock.calls.length).toBe(2);

    // Get2???????????????????????????????????????
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

    // ??????????????????
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

    invalidateCache('test'); // ???????????????????????????????????????????????????

    // ?????????????????????????????????????????????
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
});
