import { getAlovaInstance } from '#/utils';
import { createAlova, invalidateCache, queryCache, setCache } from '@/index';
import adapterFetch from '@/predefine/adapterFetch';
import { setWithCacheAdapter } from '@/storage/cacheWrapper';
import { Result } from 'root/testUtils';
import { AlovaGlobalCacheAdapter } from '~/typings';

const alova = getAlovaInstance({
  responseExpect: r => r.json()
});
describe('manipulate cache', () => {
  test('the cache response data should be saved', async () => {
    const Get = alova.Get('/unit-test', {
      cacheFor: 100 * 1000,
      transform: ({ data }: Result) => data
    });

    // It is undefined when there is no cache
    await setCache(Get, data => {
      expect(data).toBeUndefined();
      return undefined; // When undefined or no return is returned, cache modifications are cancelled.
    });

    await setCache(Get, {
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '1'
      }
    });

    expect(await queryCache(Get)).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '1'
      }
    });
  });

  test('batch set response data', async () => {
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1 },
      cacheFor: 100 * 1000,
      transform: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test', {
      params: { a: 2 },
      cacheFor: 100 * 1000,
      transform: ({ data }: Result) => data
    });
    await Promise.all([Get1, Get2]);

    expect(await queryCache(Get1)).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '1'
      }
    });
    expect(await queryCache(Get2)).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '2'
      }
    });

    // Set by passing in an array
    await setCache([Get1, Get2], {
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '123'
      }
    });
    expect(await queryCache(Get1)).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '123'
      }
    });
    expect(await queryCache(Get2)).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '123'
      }
    });
  });

  test('batch update response data', async () => {
    const Get1 = alova.Get('/unit-test', {
      params: { a: 55 },
      cacheFor: 100 * 1000,
      transform: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test', {
      params: { a: 100 },
      cacheFor: 100 * 1000,
      transform: ({ data }: Result) => data
    });
    await Promise.all([Get1, Get2]);

    expect(await queryCache(Get1)).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '55'
      }
    });
    expect(await queryCache(Get2)).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '100'
      }
    });

    // Update the cache for the above two requests
    const mockfn = vi.fn();
    await setCache([Get1, Get2], cache => {
      if (!cache) {
        return;
      }
      cache.params.a = 'update';
      mockfn();
      return cache;
    });
    expect(await queryCache(Get1)).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: 'update'
      }
    });
    expect(await queryCache(Get2)).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: 'update'
      }
    });
    expect(mockfn).toHaveBeenCalledTimes(2); // will be called twice
  });

  test('update will be canceled when callback return undefined', async () => {
    const Get1 = alova.Get('/unit-test', {
      params: { a: 200 },
      cacheFor: 100 * 1000,
      transform: ({ data }: Result) => data
    });
    await Get1;

    expect(await queryCache(Get1)).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '200'
      }
    });

    // When the update function returns undefined, it means interrupting the update.
    const mockfn = vi.fn();
    setCache(Get1, () => {
      mockfn();
    });
    expect(await queryCache(Get1)).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '200'
      }
    });
    expect(mockfn).toHaveBeenCalledTimes(1); // Executed once
  });

  test('should also replace storaged data when using method instance with `restore`', async () => {
    const Get1 = alova.Get('/unit-test', {
      params: { a: 200 },
      cacheFor: {
        mode: 'restore',
        expire: 100 * 1000
      },
      transform: ({ data }: Result) => data
    });
    await Get1;

    await setCache(Get1, rawData => {
      if (rawData) {
        rawData.path = 'changed';
        return rawData;
      }
      return undefined;
    });

    expect(await queryCache(Get1)).toStrictEqual({
      path: 'changed',
      method: 'GET',
      params: {
        a: '200'
      }
    });
    expect(
      await queryCache(Get1, {
        policy: 'l1'
      })
    ).toStrictEqual({
      path: 'changed',
      method: 'GET',
      params: {
        a: '200'
      }
    });
    expect(
      await queryCache(Get1, {
        policy: 'l2'
      })
    ).toStrictEqual({
      path: 'changed',
      method: 'GET',
      params: {
        a: '200'
      }
    });
  });

  test('should get cache from l2cache', async () => {
    const Get = alova.Get('/unit-test', {
      params: {
        ccc: '555'
      },
      cacheFor: 100 * 1000,
      transform: ({ data }: Result) => data
    });

    // Persistent custom cache
    await setCache(
      Get,
      {
        data: 'persisted'
      } as any,
      {
        policy: 'l2'
      }
    );

    // When the policy parameter is not specified, whether to obtain the L2 cache will be determined based on the `cache for` of the method instance.
    expect(await queryCache(Get)).toBeUndefined();
    // When specifying the policy parameter, the corresponding cache will be obtained
    expect(
      await queryCache(Get, {
        policy: 'l1'
      })
    ).toBeUndefined();
    expect(
      await queryCache(Get, {
        policy: 'l2'
      })
    ).toStrictEqual({
      data: 'persisted'
    });
  });

  // By setting cache for as a function, the cache becomes a controlled state, and the cache data that needs to be returned can be customized.
  test('should hit the controlled cache when cacheFor is sync function', async () => {
    const mockControlledCache = {
      path: 'local-controlled',
      params: {},
      method: 'Get'
    };
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1000 },
      cacheFor() {
        return mockControlledCache;
      },
      transform: ({ data }: Result) => data
    });
    const data = await Get1;
    expect(Get1.fromCache).toBeTruthy();
    expect(data).toStrictEqual(mockControlledCache);
  });
  test('cacheFor can also be a async function', async () => {
    const mockControlledCache = {
      path: 'local-controlled',
      params: {},
      method: 'Get'
    };
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1000 },
      async cacheFor() {
        await new Promise(resolve => {
          setTimeout(resolve, 200);
        });
        return mockControlledCache;
      },
      transform: ({ data }: Result) => data
    });
    const data = await Get1;
    expect(Get1.fromCache).toBeTruthy();
    expect(data).toStrictEqual(mockControlledCache);
  });

  test('should continue send request when cacheFor function is return undefined', async () => {
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1000 },
      async cacheFor() {
        return undefined;
      },
      transform: ({ data }: Result) => data
    });
    const data = await Get1;
    expect(Get1.fromCache).toBeFalsy();
    expect(data).toStrictEqual({
      path: '/unit-test',
      params: { a: '1000' },
      method: 'GET'
    });
  });

  test('should reject request when cacheFor throws an error', async () => {
    const Get1 = (async = true) =>
      alova.Get('/unit-test', {
        params: { a: 1000 },
        cacheFor() {
          if (async) {
            return Promise.reject(new Error('reject in cacheFor'));
          }
          throw new Error('error in cacheFor');
        },
        transform: ({ data }: Result) => data
      });
    await expect(Get1()).rejects.toThrow('reject in cacheFor');
    await expect(Get1(false)).rejects.toThrow('error in cacheFor');
  });

  test('should receive data from function `cacheFor` when `cacheFor` is a function', async () => {
    const Get1 = alova.Get('/unit-test', {
      params: { a: 5555 },
      async cacheFor() {
        return {
          path: 'local-controlled',
          params: {},
          method: 'GET'
        };
      },
      transform: ({ data }: Result) => data
    });

    expect(await queryCache(Get1)).toStrictEqual({
      path: 'local-controlled',
      params: {},
      method: 'GET'
    });
  });
  test("shouldn't set cache with method that has a functional `cacheFor` param", async () => {
    let l1Cache = {} as Record<string, any>;
    const l1CacheAdapter: AlovaGlobalCacheAdapter = {
      set(key, value) {
        l1Cache[key] = value;
      },
      get: key => l1Cache[key],
      remove(key) {
        delete l1Cache[key];
      },
      clear: () => {
        l1Cache = {};
      }
    };
    const alova = createAlova({
      requestAdapter: adapterFetch(),
      responded: r => r.json(),
      l1Cache: l1CacheAdapter
    });
    const Get1 = alova.Get('/unit-test', {
      params: { a: 5555 },
      async cacheFor() {
        return {
          path: 'local-controlled',
          params: {},
          method: 'GET'
        };
      },
      transform: ({ data }: Result) => data
    });
    await setCache(Get1, {
      path: 'custom-path',
      params: {},
      method: 'GET'
    });
    expect(Object.keys(l1Cache)).toHaveLength(0);
  });
  test("shouldn't invalidate cache with method that has a functional `cacheFor` param", async () => {
    let l1Cache = {} as Record<string, any>;
    const l1CacheAdapter: AlovaGlobalCacheAdapter = {
      set(key, value) {
        l1Cache[key] = value;
      },
      get: key => l1Cache[key],
      remove(key) {
        delete l1Cache[key];
      },
      clear: () => {
        l1Cache = {};
      }
    };
    const alova = createAlova({
      requestAdapter: adapterFetch(),
      responded: r => r.json(),
      l1Cache: l1CacheAdapter
    });
    const Get1 = alova.Get('/unit-test', {
      params: { a: 5555 },
      async cacheFor() {
        return {
          path: 'local-controlled',
          params: {},
          method: 'GET'
        };
      },
      transform: ({ data }: Result) => data
    });
    await setWithCacheAdapter(
      alova.id,
      Get1.key,
      {
        path: 'custom-path',
        params: {},
        method: 'GET'
      },
      Date.now() + 10000,
      alova.l1Cache,
      undefined
    );
    expect(Object.keys(l1Cache)).toHaveLength(1);

    await invalidateCache(Get1);
    expect(Object.keys(l1Cache)).toHaveLength(1);
  });
});
