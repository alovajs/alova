import { getAlovaInstance } from '#/utils';
import { createAlova, globalConfig, invalidateCache, queryCache } from '@/index';
import adapterFetch from '@/predefine/adapterFetch';
import { Result } from 'root/testUtils';
import { AlovaGlobalCacheAdapter } from '~/typings';

const baseURL = process.env.NODE_BASE_URL as string;
// Clear cache before each processing to avoid mutual influence
beforeEach(async () => {
  await invalidateCache();
});
describe('auto invalitate cached response data', () => {
  test("shouldn't invalidate cache when source method not hit target method", async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const targetGet = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data,
      hitSource: ['a1', /^a2/, alova.Post('/unit-test', { a: 1 })]
    });
    await targetGet;

    const sourcePost = alova.Post(
      '/unit-test',
      { a: 2 },
      {
        name: 'a5'
      }
    );

    await sourcePost.send();
    expect(await queryCache(targetGet)).not.toBeUndefined();
  });

  test('should invalidate cache when hit with the key of source method', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const targetGet = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data,
      hitSource: alova.Post('/unit-test', { a: 1 })
    });
    await targetGet;

    const sourcePost = alova.Post('/unit-test', { a: 1 });
    await sourcePost;
    expect(await queryCache(targetGet)).toBeUndefined();
  });

  test('should invalidate cache when equal with source name', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const targetGet = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data,
      hitSource: 'a1'
    });
    await targetGet;

    const sourcePost = alova.Post(
      '/unit-test',
      {},
      {
        name: 'a1'
      }
    );

    await sourcePost;
    expect(await queryCache(targetGet)).toBeUndefined();
  });

  test('should invalidate cache when the regexp match with source name', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const targetGet = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data,
      hitSource: /^a2/
    });
    await targetGet;

    const sourcePost = alova.Post(
      '/unit-test',
      {},
      {
        name: 'a2fegea5'
      }
    );
    await sourcePost;
    expect(await queryCache(targetGet)).toBeUndefined();
  });

  test('should invalidate cache when hit one of source flags', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const targetGet = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data,
      hitSource: ['a1', /^a2/, alova.Post('/unit-test', { a: 1 })]
    });

    // Send request and save snapshot and cache
    await targetGet;
    let sourcePost = alova.Post(
      '/unit-test',
      {},
      {
        name: 'a1'
      }
    );
    await sourcePost;
    expect(await queryCache(targetGet)).toBeUndefined();

    // Request again and generate cache
    await targetGet;
    sourcePost = alova.Post(
      '/unit-test',
      {},
      {
        name: 'a2sdyfisdkafj'
      }
    );
    await sourcePost;
    expect(await queryCache(targetGet)).toBeUndefined();

    // Request again and generate cache
    await targetGet;
    sourcePost = alova.Post('/unit-test', { a: 1 });
    await sourcePost;
    expect(await queryCache(targetGet)).toBeUndefined();
  });

  test('should invalidate cache from l2cache', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });

    // Set up a request to be stored in the L2 cache
    const targetGetFromL2Cache = alova.Get('/unit-test', {
      hitSource: 'get-l2cache',
      cacheFor: {
        expire: 60 * 60 * 1000, // 1 hour
        mode: 'restore' // Stored in L2 cache
      }
    });
    await targetGetFromL2Cache;
    expect(await queryCache(targetGetFromL2Cache)).not.toBeUndefined();

    // Send a request that will invalidate the L2 cache
    const sourcePost = alova.Post('/unit-test', { a: 1 }, { name: 'get-l2cache' });
    await sourcePost;

    // Expect L2 cache to be invalidated
    expect(await queryCache(targetGetFromL2Cache)).toBeUndefined();
  });

  test("shouldn't remove corresponding cache keys when they are fail to invalidate cache", async () => {
    let l1Cache = {} as Record<string, any>;
    let i = 0;
    const l1CacheAdapter = {
      set(key: string, value: any) {
        l1Cache[key] = value;
      },
      get: (key: string) => l1Cache[key],
      remove(key: string) {
        if (i === 0) {
          throw new Error('remove failed');
        }
        delete l1Cache[key];
      },
      clear: () => {
        l1Cache = {};
      }
    };
    const alova = createAlova({
      baseURL,
      requestAdapter: adapterFetch(),
      responded: r => r.json(),
      l1Cache: l1CacheAdapter
    });

    const sourcePost = alova.Post('/unit-test', { a: 1 });

    // Set up a cached request in the alova1 instance
    const targetGet1 = alova.Get('/unit-test', {
      hitSource: ['poster-abc', /^abc$ig/, sourcePost]
    });
    // Set up a cached request in the alova1 instance
    const targetGet2 = alova.Get('/unit-test', {
      params: {
        abge: 1
      },
      hitSource: ['poster-abc', /^abc$ig/, sourcePost]
    });

    await targetGet1;
    await targetGet2;
    expect(await queryCache(targetGet1)).not.toBeUndefined();
    expect(await queryCache(targetGet2)).not.toBeUndefined();

    await sourcePost;
    expect(await queryCache(targetGet1)).not.toBeUndefined();
    expect(await queryCache(targetGet2)).not.toBeUndefined();

    i += 1;
    await sourcePost;
    expect(await queryCache(targetGet1)).toBeUndefined();
    expect(await queryCache(targetGet2)).toBeUndefined();
  });

  test('should default invalidate cache from another alova instance', async () => {
    // Create two independent Alova instances
    const alova1 = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const alova2 = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const sourcePost = alova2.Post('/unit-test', { a: 1 });

    // Set up a cached request in the alova1 instance
    const targetGet = alova1.Get('/unit-test', {
      hitSource: [sourcePost]
    });
    await targetGet;
    expect(await queryCache(targetGet)).not.toBeUndefined();

    // Sending a cache-invalidating request to the alova2 instance
    await sourcePost;

    // Expect cache in alova1 instance to be invalidated
    expect(await queryCache(targetGet)).toBeUndefined();
  });

  test('should only invalidate cache from the same alova instance when set `autoHitCache` to `self`', async () => {
    globalConfig({
      autoHitCache: 'self'
    });

    const l1CacheAdapter = () => {
      let l1Cache = {} as Record<string, any>;
      return {
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
      } as AlovaGlobalCacheAdapter;
    };

    // Create two independent Alova instances
    const alova1 = createAlova({
      baseURL,
      requestAdapter: adapterFetch(),
      responded: r => r.json(),
      l1Cache: l1CacheAdapter()
    });
    const alova2 = createAlova({
      baseURL,
      requestAdapter: adapterFetch(),
      responded: r => r.json(),
      l1Cache: l1CacheAdapter()
    });

    // Sending a cache-invalidating request to the alova1 instance
    const sourcePostInAlova1 = alova1.Post(
      '/unit-test',
      { a: 1 },
      {
        name: 'source-post567'
      }
    );

    // Set up a cached request in the alova1 instance
    const targetGetInAlova1 = alova1.Get('/unit-test', {
      hitSource: ['source-post567']
    });
    await targetGetInAlova1;
    expect(await queryCache(targetGetInAlova1)).not.toBeUndefined();

    // Set up a cached request in the alova2 instance
    const targetGetInAlova2 = alova2.Get('/unit-test', {
      hitSource: ['source-post567']
    });
    await targetGetInAlova2;
    expect(await queryCache(targetGetInAlova2)).not.toBeUndefined();

    await sourcePostInAlova1;

    // Expect cache in alova1 instance to be invalidated
    expect(await queryCache(targetGetInAlova1)).toBeUndefined();
    // Expect cache in alova2 instance not to be invalidated
    expect(await queryCache(targetGetInAlova2)).not.toBeUndefined();
  });

  test("shouldn't invalidate any cache when set `autoHitCache` to `close`", async () => {
    globalConfig({
      // Turn off automatic cache invalidation
      autoHitCache: 'close'
    });

    // Create two independent Alova instances
    const alova1 = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const alova2 = getAlovaInstance({
      responseExpect: r => r.json()
    });

    // Set up a cached request in the alova1 instance
    const targetGetInAlova1 = alova1.Get('/unit-test');
    await targetGetInAlova1;
    expect(await queryCache(targetGetInAlova1)).not.toBeUndefined();

    // Set up a cached request in the alova2 instance
    const targetGetInAlova2 = alova2.Get('/unit-test', {
      params: { a: '123' }
    });
    await targetGetInAlova2;
    expect(await queryCache(targetGetInAlova2)).not.toBeUndefined();

    // Sending a request in the alova1 instance that would otherwise invalidate the cache
    const sourcePostInAlova1 = alova1.Post(
      '/unit-test',
      { a: 1 },
      {
        hitSource: [targetGetInAlova1, targetGetInAlova2]
      }
    );
    await sourcePostInAlova1;

    // Sending a request in the alova2 instance that would otherwise invalidate the cache
    const sourcePostInAlova2 = alova2.Post(
      '/unit-test',
      { a: 555 },
      {
        hitSource: [targetGetInAlova1, targetGetInAlova2]
      }
    );
    await sourcePostInAlova2;

    // It is expected that the cache in both instances has not been invalidated
    expect(await queryCache(targetGetInAlova1)).not.toBeUndefined();
    expect(await queryCache(targetGetInAlova2)).not.toBeUndefined();
  });
});
