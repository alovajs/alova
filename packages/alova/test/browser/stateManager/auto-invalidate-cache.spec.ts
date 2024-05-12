import { getAlovaInstance } from '#/utils';
import { queryCache } from '@/index';
import { Result } from 'root/testUtils';

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
});
