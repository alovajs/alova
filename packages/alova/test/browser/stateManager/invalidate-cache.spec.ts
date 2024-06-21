import { getAlovaInstance } from '#/utils';
import { invalidateCache, queryCache } from '@/index';
import { Result } from 'root/testUtils';

describe('invalitate cached response data', () => {
  test('it will use the default cache time when not set the cache time with `GET`', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await Get;
    const cachedData = await queryCache(Get, {
      policy: 'l1'
    });
    expect(cachedData).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} });
  });

  test('the cached response data should be removed', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: 100000,
      transform: ({ data }: Result) => data
    });
    await Get;
    let cachedData = await queryCache(Get, {
      policy: 'l1'
    });
    expect(cachedData).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} });
    await invalidateCache(Get);
    cachedData = await queryCache(Get, {
      policy: 'l1'
    });
    expect(cachedData).toBeUndefined();
  });

  test('cache will be cleard when invalidateCache is called without params', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      cacheFor: Infinity,
      transform: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test-count', {
      params: { countKey: 'c' },
      cacheFor: Infinity,
      transform: ({ data }: Result) => data
    });

    await Promise.all([Get1, Get2]);
    // 此时响应数据来自网络请求
    expect(Get1.fromCache).toBeFalsy();
    expect(Get2.fromCache).toBeFalsy();

    // 检查缓存情况
    const [data1, data2] = await Promise.all([Get1, Get2]);
    // 此时响应数据来自缓存
    expect(Get1.fromCache).toBeTruthy();
    expect(Get2.fromCache).toBeTruthy();

    expect(data1).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(data2).toStrictEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 0, countKey: 'c' }
    });

    await invalidateCache(); // 清空缓存

    // 缓存清空，会重新请求
    const [data11, data22] = await Promise.all([Get1, Get2]);
    // 缓存清除，此时响应数据再次来自网络请求
    expect(Get1.fromCache).toBeFalsy();
    expect(Get2.fromCache).toBeFalsy();
    expect(data11).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(data22).toStrictEqual({
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 1, countKey: 'c' }
    });
  });

  test('l2cache should also be cleard when invalidateCache is called without params', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      cacheFor: {
        mode: 'restore',
        expire: Infinity
      },
      transform: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test-count', {
      params: { countKey: 'ccc' },
      cacheFor: {
        mode: 'restore',
        expire: Infinity
      },
      transform: ({ data }: Result) => data
    });

    await Promise.all([Get1, Get2]);
    // 此时响应数据来自网络请求
    expect(Get1.fromCache).toBeFalsy();
    expect(Get2.fromCache).toBeFalsy();

    // 检查缓存情况
    const cacheGet1 = { path: '/unit-test', method: 'GET', params: {} };
    const cacheGet2 = {
      path: '/unit-test-count',
      method: 'GET',
      params: { count: 0, countKey: 'ccc' }
    };
    expect(await queryCache(Get1)).toStrictEqual(cacheGet1);
    expect(await queryCache(Get2)).toStrictEqual(cacheGet2);
    const persistentData1 = await queryCache(Get1, {
      policy: 'l2'
    });
    expect(persistentData1).toStrictEqual(cacheGet1);
    const persistentData2 = await queryCache(Get2, {
      policy: 'l2'
    });
    expect(persistentData2).toStrictEqual(cacheGet2);

    await invalidateCache(); // 清空缓存

    // 缓存清空
    expect(
      await queryCache(Get1, {
        policy: 'l1'
      })
    ).toBeUndefined();
    expect(
      await queryCache(Get2, {
        policy: 'l1'
      })
    ).toBeUndefined();
    expect(
      await queryCache(Get1, {
        policy: 'l2'
      })
    ).toBeUndefined();
    expect(
      await queryCache(Get2, {
        policy: 'l2'
      })
    ).toBeUndefined();
  });

  test('should match method even if changed method in beforeRequest', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json(),
      beforeRequestExpect(methodInstance) {
        methodInstance.config.headers = methodInstance.config.headers || {};
        methodInstance.config.headers.token = 'token';
      }
    });
    const Get1 = () =>
      alova.Get('/unit-test', {
        name: 'test10-get',
        cacheFor: Infinity,
        transform: ({ data }: Result) => data
      });
    const Get2 = () =>
      alova.Get('/unit-test', {
        name: 'test20-get',
        params: { key: 'f' },
        cacheFor: Infinity,
        transform: ({ data }: Result) => data
      });

    await Promise.all([Get1(), Get2()]);
    expect(await queryCache(Get1())).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {}
    });
    expect(await queryCache(Get2())).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: { key: 'f' }
    });
  });

  // invalidateCache 可以批量失效不同alova实例的缓存
  test('should batch invalidate the caches created by different alova instance.', async () => {
    const alova1 = getAlovaInstance();
    const alova2 = getAlovaInstance();

    const Get11 = alova1.Get('/unit-test');
    const Get12 = alova1.Get('/unit-test');
    const Get21 = alova2.Get('/unit-test');
    const Get22 = alova2.Get('/unit-test');

    await Promise.all([Get11, Get12, Get21, Get22]);
    expect(await queryCache(Get11)).not.toBeUndefined();
    expect(await queryCache(Get12)).not.toBeUndefined();
    expect(await queryCache(Get21)).not.toBeUndefined();
    expect(await queryCache(Get22)).not.toBeUndefined();

    await invalidateCache([Get11, Get12, Get21, Get22]);
    expect(await queryCache(Get11)).toBeUndefined();
    expect(await queryCache(Get12)).toBeUndefined();
    expect(await queryCache(Get21)).toBeUndefined();
    expect(await queryCache(Get22)).toBeUndefined();

    await Promise.all([Get11, Get12, Get21, Get22]);
    expect(await queryCache(Get11)).not.toBeUndefined();
    expect(await queryCache(Get12)).not.toBeUndefined();
    expect(await queryCache(Get21)).not.toBeUndefined();
    expect(await queryCache(Get22)).not.toBeUndefined();
    await invalidateCache();
    expect(await queryCache(Get11)).toBeUndefined();
    expect(await queryCache(Get12)).toBeUndefined();
    expect(await queryCache(Get21)).toBeUndefined();
    expect(await queryCache(Get22)).toBeUndefined();
  });
});
