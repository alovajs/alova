import { getAlovaInstance } from '#/utils';
import { queryCache } from '@/index';
import { removeWithCacheAdapter } from '@/storage/cacheWrapper';
import { Result, delay } from 'root/testUtils';
import { DetailCacheConfig } from '~/typings';

describe('l2cache cache data', () => {
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
      transformData: ({ data }: Result) => data
    });
    await Get;
    // Clear the cache first to simulate the scenario after the browser is refreshed. At this time, the persistent data will be assigned to the data state first and a request will be initiated.
    await removeWithCacheAdapter(alova.id, Get.__key__, alova.l1Cache);

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
      transformData: ({ data }: Result) => data
    });

    await Get;
    // After clearing the cache, request it to be restored to the memory cache after 400 milliseconds. If the cache time is consistent, the memory cache will expire after 100 milliseconds.
    await removeWithCacheAdapter(alova.id, Get.__key__, alova.l1Cache);
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
      transformData: ({ data }: Result) => data
    });
    await Get;

    // Clear the cache first to simulate the scenario after the browser is refreshed. At this time, the persistent data will be assigned to the data state first and a request will be initiated.
    removeWithCacheAdapter(alova.id, Get.__key__, alova.l1Cache);

    // After setting to restore, even if the local cache fails, the persistent data will be automatically restored to the cache in the macro, so the cache will be hit.
    await Get;
    expect(Get.fromCache).toBeTruthy();
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
      transformData: ({ data }: Result) => data
    });
    await Get;

    // Clear the cache first to simulate the scenario after the browser is refreshed. At this time, the persistent data will be assigned to the data state first and a request will be initiated.
    removeWithCacheAdapter(alova.id, Get.__key__, alova.l1Cache);
    (alova.options.cacheFor?.GET as DetailCacheConfig).tag = 'v3'; // Modify tag
    const Get2 = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
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
      transformData: ({ data }: Result) => data
    });
    await Get;

    // Clear the cache first to simulate the scenario after the browser is refreshed. At this time, the persistent data will be assigned to the data state first and a request will be initiated.
    removeWithCacheAdapter(alova.id, Get.__key__, alova.l1Cache);
    const Get2 = alova.Get('/unit-test', {
      cacheFor: {
        expire: 100 * 1000,
        mode: 'restore',
        tag: 'v2'
      },
      transformData: ({ data }: Result) => data
    });

    // After the tag is changed, the persistent data will become invalid, so the request will be re-initiated, and the value of data will become undefined.
    await Get2;
    expect(Get2.fromCache).toBeFalsy();
  });
});
