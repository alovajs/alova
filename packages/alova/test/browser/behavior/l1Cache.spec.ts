import { getAlovaInstance } from '#/utils';
import { invalidateCache, queryCache } from '@/index';
import { Result, delay } from 'root/testUtils';

describe('l1cache cache data', () => {
  test('should default has 300000ms for GET request', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });

    // GET requests no longer have default cache settings
    const Get = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    await Get;
    expect(await queryCache(Get)).not.toBeUndefined();

    // POST not cache default
    const Post = alova.Post('/unit-test');
    await Post;
    expect(await queryCache(Post)).toBeUndefined();
  });
  test("change the default cache's setting globally", async () => {
    const alova = getAlovaInstance({
      cacheFor: {
        POST: 300000
      },
      responseExpect: r => r.json()
    });

    // GET requests no longer have default cache settings
    const Get = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    await Get;
    expect(await queryCache(Get)).toBeUndefined();

    // POST is cached
    const Post = alova.Post('/unit-test', undefined, {
      transformData: ({ data }: Result) => data
    });
    await Post;
    expect(await queryCache(Post)).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: {}
    });
  });

  test('should hit the cache data when re-request the same url with the same parameters', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: 1000,
      transformData: ({ data }: Result) => data
    });
    await Get;
    expect(Get.fromCache).toBeFalsy();
    expect(await queryCache(Get)).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} });
    await Get;
    // When using cache, data will be obtained immediately
    expect(Get.fromCache).toBeTruthy();

    await invalidateCache(Get);
    await Get;
    expect(Get.fromCache).toBeFalsy(); // Because the cache has been deleted, the request will be reissued
  });

  test('param localCache can also set to be a Date instance', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const expireDate = new Date();
    expireDate.setTime(expireDate.getTime() + 500);
    const Get = alova.Get('/unit-test', {
      cacheFor: expireDate,
      transformData: ({ data }: Result) => data
    });
    await Get;
    expect(Get.fromCache).toBeFalsy();
    expect(await queryCache(Get)).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} });
    await Get;
    // When using cache, data will be obtained immediately
    expect(Get.fromCache).toBeTruthy();

    await delay(600);
    await Get;
    expect(Get.fromCache).toBeFalsy(); // Because the cache has been deleted, the request will be reissued
  });

  test("cache data wouldn't be invalid when set localCache to `Infinity`", async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: Infinity,
      transformData: ({ data }: Result) => data
    });

    await Get;
    expect(Get.fromCache).toBeFalsy();
    expect(await queryCache(Get)).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} });
    await Get;
    // When using cache, data will be obtained immediately
    expect(Get.fromCache).toBeTruthy();

    await delay(1000);
    await Get;
    expect(Get.fromCache).toBeTruthy(); // Because the cache has not expired, the cached data will continue to be used and the loading will not change.
  });

  test('cache data will be invalid when set localCache to 0', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: 0,
      transformData: ({ data }: Result) => data
    });
    await Get;
    expect(Get.fromCache).toBeFalsy();
    await Get;
    // The cache is not set and the request will be initiated again.
    expect(Get.fromCache).toBeFalsy();
  });

  test('cache data will be invalid when set localCache to null', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: null,
      transformData: ({ data }: Result) => data
    });
    await Get;
    expect(Get.fromCache).toBeFalsy();
    await Get;
    // The cache is not set and the request will be initiated again.
    expect(Get.fromCache).toBeFalsy();
  });
});
