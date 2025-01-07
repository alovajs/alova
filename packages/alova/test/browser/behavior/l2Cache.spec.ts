import { getAlovaInstance } from '#/utils';
import { invalidateCache, queryCache } from '@/index';
import { removeWithCacheAdapter } from '@/storage/cacheWrapper';
import { Result, delay } from 'root/testUtils';
import { DetailCacheConfig } from '~/typings';

beforeEach(() => {
  invalidateCache();
});
describe('l2cache cache data', () => {
  test('should all POST request will be cached when set `cacheFor` globally', async () => {
    const alova = getAlovaInstance({
      cacheFor: {
        POST: {
          mode: 'restore',
          expire: 300000
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
    const Post1 = alova.Post('/unit-test', undefined, {
      transform: ({ data }: Result) => data
    });
    await Post1;
    expect(await queryCache(Post1, { policy: 'l1' })).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: ''
    });
    expect(await queryCache(Post1, { policy: 'l2' })).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: ''
    });

    // POST is cached
    const Post2 = alova.Post(
      '/unit-test',
      { p1: 's1' },
      {
        transform: ({ data }: Result) => data
      }
    );
    await Post2;
    expect(await queryCache(Post2, { policy: 'l1' })).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: { p1: 's1' }
    });
    expect(await queryCache(Post2, { policy: 'l2' })).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: { p1: 's1' }
    });
  });

  test('should set the memory and restore cache to the different cached time globally', async () => {
    const expireFn = vi.fn();
    const alova = getAlovaInstance({
      cacheFor: {
        POST: {
          mode: 'restore',
          expire: ({ mode }) => {
            expireFn();
            return mode === 'memory' ? 10 : 600;
          }
        }
      },
      responseExpect: r => r.json()
    });

    const Post1 = alova.Post('/unit-test', undefined, {
      transform: ({ data }: Result) => data
    });
    await Post1;
    await delay(50); // let the l1 cache expired
    expect(await queryCache(Post1, { policy: 'l1' })).toBeUndefined();
    expect(await queryCache(Post1, { policy: 'l2' })).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: ''
    });
    expect(expireFn).toHaveBeenCalledTimes(2);
  });

  test('should set the memory and restore cache to the different cached time requestly', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });

    const expireFn = vi.fn();
    const Post1 = alova.Post('/unit-test', undefined, {
      cacheFor: {
        mode: 'restore',
        expire: ({ mode }) => {
          expireFn();
          return mode === 'memory' ? 10 : 600;
        }
      },
      transform: ({ data }: Result) => data
    });
    await Post1;
    await delay(50); // let the l1 cache expired
    expect(await queryCache(Post1, { policy: 'l1' })).toBeUndefined();
    expect(await queryCache(Post1, { policy: 'l2' })).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {},
      data: ''
    });
    expect(expireFn).toHaveBeenCalledTimes(2);
  });

  test('l2cache data will restore to l1cache even if the l1cache of the same key is invalid', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: {
        expire: 10 * 1000,
        mode: 'restore',
        tag: 'v1'
      },
      transform: ({ data }: Result) => data
    });
    await Get;
    // Clear the cache first to simulate the scenario after the browser is refreshed. At this time, the persistent data will be assigned to the data state first and a request will be initiated.
    await removeWithCacheAdapter(alova.id, Get.key, alova.l1Cache);

    // After setting to restore, even if the local cache fails, the persistent data will be automatically restored to the cache, so the cache will be hit.
    await Get;
    expect(Get.fromCache).toBeTruthy();
  });

  test('should use the same expire timestamp when restore cache to l1cache', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: {
        expire: 500,
        mode: 'restore',
        tag: 'v10'
      },
      transform: ({ data }: Result) => data
    });

    await Get;
    // After clearing the cache, request it to be restored to the memory cache after 400 milliseconds. If the cache time is consistent, the memory cache will expire after 100 milliseconds.
    await removeWithCacheAdapter(alova.id, Get.key, alova.l1Cache);
    await delay(400);
    Get.send();
    await delay(150);
    expect(await queryCache(Get)).toBeUndefined();
  });

  test('expire param can also be set a Date instance', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const expireDate = new Date();
    expireDate.setHours(23, 59, 59, 999);
    const Get = alova.Get('/unit-test', {
      cacheFor: {
        expire: expireDate,
        mode: 'restore',
        tag: 'v1'
      },
      transform: ({ data }: Result) => data
    });
    await Get;

    // Clear the cache first to simulate the scenario after the browser is refreshed. At this time, the persistent data will be assigned to the data state first and a request will be initiated.
    removeWithCacheAdapter(alova.id, Get.key, alova.l1Cache);

    // After setting to restore, even if the local cache fails, the persistent data will be automatically restored to the cache in the macro, so the cache will be hit.
    await Get;
    expect(Get.fromCache).toBeTruthy();
  });

  test('expire param can also be set a Date instance', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: {
        expire: Infinity,
        mode: 'restore'
      },
      transform: ({ data }: Result) => data
    });
    await Get;

    // Simulated for a long time later.
    const nowFn = Date.now;
    Date.now = () => nowFn() + 10000000000;
    await Get;
    expect(Get.fromCache).toBeTruthy();

    Date.now = nowFn;
  });

  test('l2cache data will invalid when param `tag` of alova instance is changed', async () => {
    const alova = getAlovaInstance({
      cacheFor: {
        GET: {
          expire: 100 * 1000,
          mode: 'restore'
        }
      },
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await Get;

    // Clear the cache first to simulate the scenario after the browser is refreshed. At this time, the persistent data will be assigned to the data state first and a request will be initiated.
    removeWithCacheAdapter(alova.id, Get.key, alova.l1Cache);
    (alova.options.cacheFor?.GET as DetailCacheConfig<any>).tag = 'v3'; // Modify tag
    const Get2 = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });

    // After the tag of the alova instance is changed, the persistent data will be invalid, so the request will be re-initiated.
    await Get2;
    expect(Get2.fromCache).toBeFalsy();
  });

  test('l2cache data will invalid when `methodInstance` param `tag` is changed', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: {
        expire: 100 * 1000,
        mode: 'restore'
      },
      transform: ({ data }: Result) => data
    });
    await Get;

    // Clear the cache first to simulate the scenario after the browser is refreshed. At this time, the persistent data will be assigned to the data state first and a request will be initiated.
    removeWithCacheAdapter(alova.id, Get.key, alova.l1Cache);
    const Get2 = alova.Get('/unit-test', {
      cacheFor: {
        expire: 100 * 1000,
        mode: 'restore',
        tag: 'v2'
      },
      transform: ({ data }: Result) => data
    });

    // After the tag is changed, the persistent data will become invalid, so the request will be re-initiated, and the value of data will become undefined.
    await Get2;
    expect(Get2.fromCache).toBeFalsy();
  });

  test('should ignore l1Cache and l2Cache when forceRequest is true', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const Get = () =>
      alova.Get('/unit-test-random', {
        cacheFor: {
          expire: 100 * 1000,
          mode: 'restore'
        }
      });

    const result1 = await Get();
    const result2 = await Get().send(false);
    const result3 = await Get().send(true);

    expect(result1).toStrictEqual(result2);
    expect(result1).not.toStrictEqual(result3);
  });
});
