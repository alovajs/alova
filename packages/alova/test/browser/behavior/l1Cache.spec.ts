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
      transform: ({ data }: Result) => data
    });
    await Get;
    expect(await queryCache(Get)).not.toBeUndefined();

    // POST not cache default
    const Post = alova.Post('/unit-test');
    await Post;
    expect(await queryCache(Post)).toBeUndefined();
  });

  test('should disable the global cache', async () => {
    const alova1 = getAlovaInstance({
      responseExpect: r => r.json(),
      cacheFor: null
    });

    // disable GET cache
    const Get1 = alova1.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await Get1;
    expect(await queryCache(Get1)).toBeUndefined();

    // disable POST cache
    const Post1 = alova1.Post('/unit-test');
    await Post1;
    expect(await queryCache(Post1)).toBeUndefined();

    const alova2 = getAlovaInstance({
      responseExpect: r => r.json(),
      cacheFor: {
        GET: 0
      }
    });

    // disable GET cache
    const Get2 = alova2.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await Get2;
    expect(await queryCache(Get2)).toBeUndefined();

    // disable POST cache
    const Post2 = alova2.Post('/unit-test');
    await Post2;
    expect(await queryCache(Post2)).toBeUndefined();

    const alova3 = getAlovaInstance({
      responseExpect: r => r.json(),
      cacheFor: {
        GET: null
      }
    });

    // disable GET cache
    const Get3 = alova3.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await Get3;
    expect(await queryCache(Get3)).toBeUndefined();

    // disable POST cache
    const Post3 = alova3.Post('/unit-test');
    await Post3;
    expect(await queryCache(Post3)).toBeUndefined();
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
      transform: ({ data }: Result) => data
    });
    await Get;
    expect(await queryCache(Get)).toBeUndefined();

    // POST is cached
    const Post = alova.Post('/unit-test', undefined, {
      transform: ({ data }: Result) => data
    });
    await Post;
    expect(await queryCache(Post)).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: ''
    });

    // the `cacheFor` also set to an object
    const alova2 = getAlovaInstance({
      cacheFor: {
        POST: {
          mode: 'memory',
          expire: 300000
        }
      },
      responseExpect: r => r.json()
    });

    // GET requests no longer have default cache settings
    const Get2 = alova2.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await Get2;
    expect(await queryCache(Get2)).toBeUndefined();

    // POST is cached
    const Post2 = alova2.Post('/unit-test', undefined, {
      transform: ({ data }: Result) => data
    });
    await Post2;
    expect(await queryCache(Post2)).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: ''
    });
  });

  test('should the `cacheFor` also can set to be a Date object', async () => {
    const alova = getAlovaInstance({
      cacheFor: {
        POST: new Date(Date.now() + 300000)
      },
      responseExpect: r => r.json()
    });

    // GET requests no longer have default cache settings
    const Get = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await Get;
    expect(await queryCache(Get)).toBeUndefined();

    // POST is cached
    const Post = alova.Post('/unit-test', undefined, {
      transform: ({ data }: Result) => data
    });
    await Post;
    expect(await queryCache(Post)).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: ''
    });

    // the `cacheFor` also set to an object
    const alova2 = getAlovaInstance({
      cacheFor: {
        POST: {
          mode: 'memory',
          expire: new Date(Date.now() + 300000)
        }
      },
      responseExpect: r => r.json()
    });

    // GET requests no longer have default cache settings
    const Get2 = alova2.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await Get2;
    expect(await queryCache(Get2)).toBeUndefined();

    // POST is cached
    const Post2 = alova2.Post('/unit-test', undefined, {
      transform: ({ data }: Result) => data
    });
    await Post2;
    expect(await queryCache(Post2)).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: ''
    });
  });

  test('should use the return value to be expired time when set method type to a function', async () => {
    const expireFn = vi.fn();
    const alova = getAlovaInstance({
      cacheFor: {
        POST: {
          mode: 'memory',
          expire: ({ method, mode }) => {
            expireFn(method, mode);
            return Date.now() + 300000;
          }
        }
      },
      responseExpect: r => r.json()
    });

    // GET requests no longer have default cache settings
    const Get = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await Get;
    expect(await queryCache(Get)).toBeUndefined();

    // POST is cached
    const Post = alova.Post('/unit-test', undefined, {
      transform: ({ data }: Result) => data
    });
    await Post;
    expect(await queryCache(Post)).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: ''
    });
    expect(expireFn).toHaveBeenCalledWith(Post, 'memory');
  });

  test('should hit the cache data when re-request the same url with the same parameters', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: 1000,
      transform: ({ data }: Result) => data
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

  test("shouldn't the cache object and return object refer the same reference value", async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: 1000,
      transform: ({ data }: Result) => data
    });
    const response = await Get;
    const cacheData = await queryCache(Get);
    expect(response).not.toBe(cacheData);
    response.path = '/unit-test-modified';
    expect(response).not.toStrictEqual(cacheData);

    const alova2 = getAlovaInstance();
    const Get2 = alova2.Get<Response>('/unit-test', {
      cacheFor: 1000
    });
    const response2 = await Get2;
    const cacheData2 = await queryCache(Get2);
    expect(response2).toBeInstanceOf(Response);
    expect(cacheData2).toBeInstanceOf(Response);
    expect(response2).toBe(cacheData2);

    const Get3 = alova2.Get('/unit-test?a=1', {
      cacheFor: 1000,
      transform() {
        return null;
      }
    });
    const response3 = await Get3;
    const cacheData3 = await queryCache(Get3);
    expect(response3).toBeNull();
    expect(cacheData3).toBeUndefined();
  });

  test('param cacheFor can also set to be a Date instance', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const expireDate = new Date();
    expireDate.setTime(expireDate.getTime() + 500);
    const Get = alova.Get('/unit-test', {
      cacheFor: expireDate,
      transform: ({ data }: Result) => data
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

  test("cache data wouldn't be invalid when set cacheFor to `Infinity`", async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: Infinity,
      transform: ({ data }: Result) => data
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

  test('cache data will be invalid when set cacheFor to 0', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: 0,
      transform: ({ data }: Result) => data
    });
    await Get;
    expect(Get.fromCache).toBeFalsy();
    await Get;
    // The cache is not set and the request will be initiated again.
    expect(Get.fromCache).toBeFalsy();
  });

  test('cache data will be invalid when set cacheFor to null', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: null,
      transform: ({ data }: Result) => data
    });
    await Get;
    expect(Get.fromCache).toBeFalsy();
    await Get;
    // The cache is not set and the request will be initiated again.
    expect(Get.fromCache).toBeFalsy();
  });
});
