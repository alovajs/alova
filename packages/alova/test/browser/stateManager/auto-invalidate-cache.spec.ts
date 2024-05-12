import { getAlovaInstance } from '#/utils';
import { createAlova, globalConfig, invalidateCache, queryCache } from '@/index';
import adapterFetch from '@/predefine/adapterFetch';
import { Result } from 'root/testUtils';
import { AlovaGlobalCacheAdapter } from '~/typings';

const baseURL = process.env.NODE_BASE_URL as string;
// 每次处理前清空缓存，避免互相影响
beforeEach(async () => {
  await invalidateCache();
});
describe('auto invalitate cached response data', () => {
  test("shouldn't invalidate cache when source method not hit target method", async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const targetGet = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data,
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
      transformData: ({ data }: Result) => data,
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
      transformData: ({ data }: Result) => data,
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
      transformData: ({ data }: Result) => data,
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
      transformData: ({ data }: Result) => data,
      hitSource: ['a1', /^a2/, alova.Post('/unit-test', { a: 1 })]
    });

    // 发送请求并保存快照和缓存
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

    // 再次请求并生成缓存
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

    // 再次请求并生成缓存
    await targetGet;
    sourcePost = alova.Post('/unit-test', { a: 1 });
    await sourcePost;
    expect(await queryCache(targetGet)).toBeUndefined();
  });

  test('should invalidate cache from l2cache', async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });

    // 设置一个存储在 L2 缓存中的请求
    const targetGetFromL2Cache = alova.Get('/unit-test', {
      hitSource: 'get-l2cache',
      cacheFor: {
        expire: 60 * 60 * 1000, // 1 小时
        mode: 'restore' // 存储在 L2 缓存中
      }
    });
    await targetGetFromL2Cache;
    expect(await queryCache(targetGetFromL2Cache)).not.toBeUndefined();

    // 发送一个会使 L2 缓存失效的请求
    const sourcePost = alova.Post('/unit-test', { a: 1 }, { name: 'get-l2cache' });
    await sourcePost;

    // 期望 L2 缓存被失效
    expect(await queryCache(targetGetFromL2Cache)).toBeUndefined();
  });

  test("shouldn't remove corresponding cache keys when they are fail to invalidate cache", async () => {
    let l1Cache = {} as Record<string, any>;
    let i = 0;
    const alova = createAlova({
      baseURL,
      requestAdapter: adapterFetch(),
      responded: r => r.json(),
      l1Cache: {
        set(key, value) {
          l1Cache[key] = value;
        },
        get: key => l1Cache[key],
        remove(key) {
          if (i === 0) {
            return;
          }
          delete l1Cache[key];
        },
        clear: () => {
          l1Cache = {};
        }
      }
    });

    const sourcePost = alova.Post('/unit-test', { a: 1 });

    // 在 alova1 实例中设置一个带缓存的请求
    const targetGet1 = alova.Get('/unit-test', {
      hitSource: ['poster-abc', /^abc$ig/, sourcePost]
    });
    // 在 alova1 实例中设置一个带缓存的请求
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
    console.log(l1Cache);

    await sourcePost;
    expect(await queryCache(targetGet1)).not.toBeUndefined();
    expect(await queryCache(targetGet2)).not.toBeUndefined();

    i += 1;
    await sourcePost;
    expect(await queryCache(targetGet1)).toBeUndefined();
    expect(await queryCache(targetGet2)).toBeUndefined();
  });

  test('should default invalidate cache from another alova instance', async () => {
    // 创建两个独立的 Alova 实例
    const alova1 = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const alova2 = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const sourcePost = alova2.Post('/unit-test', { a: 1 });

    // 在 alova1 实例中设置一个带缓存的请求
    const targetGet = alova1.Get('/unit-test', {
      hitSource: [sourcePost]
    });
    await targetGet;
    expect(await queryCache(targetGet)).not.toBeUndefined();

    // 在 alova2 实例中发送一个会使缓存失效的请求
    await sourcePost;

    // 期望 alova1 实例中的缓存被失效
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

    // 创建两个独立的 Alova 实例
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

    // 在 alova1 实例中发送一个会使缓存失效的请求
    const sourcePostInAlova1 = alova1.Post(
      '/unit-test',
      { a: 1 },
      {
        name: 'source-post567'
      }
    );

    // 在 alova1 实例中设置一个带缓存的请求
    const targetGetInAlova1 = alova1.Get('/unit-test', {
      hitSource: ['source-post567']
    });
    await targetGetInAlova1;
    expect(await queryCache(targetGetInAlova1)).not.toBeUndefined();

    // 在 alova2 实例中设置一个带缓存的请求
    const targetGetInAlova2 = alova2.Get('/unit-test', {
      hitSource: ['source-post567']
    });
    await targetGetInAlova2;
    expect(await queryCache(targetGetInAlova2)).not.toBeUndefined();

    await sourcePostInAlova1;

    // 期望 alova1 实例中的缓存被失效
    expect(await queryCache(targetGetInAlova1)).toBeUndefined();
    // 期望 alova2 实例中的缓存未被失效
    expect(await queryCache(targetGetInAlova2)).not.toBeUndefined();
  });

  test("shouldn't invalidate any cache when set `autoHitCache` to `close`", async () => {
    globalConfig({
      // 关闭自动失效缓存功能
      autoHitCache: 'close'
    });

    // 创建两个独立的 Alova 实例
    const alova1 = getAlovaInstance({
      responseExpect: r => r.json()
    });
    const alova2 = getAlovaInstance({
      responseExpect: r => r.json()
    });

    // 在 alova1 实例中设置一个带缓存的请求
    const targetGetInAlova1 = alova1.Get('/unit-test');
    await targetGetInAlova1;
    expect(await queryCache(targetGetInAlova1)).not.toBeUndefined();

    // 在 alova2 实例中设置一个带缓存的请求
    const targetGetInAlova2 = alova2.Get('/unit-test', {
      params: { a: '123' }
    });
    await targetGetInAlova2;
    expect(await queryCache(targetGetInAlova2)).not.toBeUndefined();

    // 在 alova1 实例中发送一个原本会使缓存失效的请求
    const sourcePostInAlova1 = alova1.Post(
      '/unit-test',
      { a: 1 },
      {
        hitSource: [targetGetInAlova1, targetGetInAlova2]
      }
    );
    await sourcePostInAlova1;

    // 在 alova2 实例中发送一个原本会使缓存失效的请求
    const sourcePostInAlova2 = alova2.Post(
      '/unit-test',
      { a: 555 },
      {
        hitSource: [targetGetInAlova1, targetGetInAlova2]
      }
    );
    await sourcePostInAlova2;

    // 期望两个实例中的缓存都未被失效
    expect(await queryCache(targetGetInAlova1)).not.toBeUndefined();
    expect(await queryCache(targetGetInAlova2)).not.toBeUndefined();
  });
});
