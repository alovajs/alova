import { useRequest } from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { getAlovaInstance, mockServer, untilCbCalled } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('auto invalitate cached response data', () => {
  test("shouldn't invalidate cache when source method not hit target method", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const targetGet = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data,
      hitSource: ['a1', /^a2/, alova.Post('/unit-test', { a: 1 })]
    });
    const firstState = useRequest(targetGet);
    await untilCbCalled(firstState.onSuccess);

    const sourcePost = alova.Post(
      '/unit-test',
      { a: 2 },
      {
        name: 'a5'
      }
    );

    await sourcePost.send();
    const cachedData = getResponseCache(alova.id, key(targetGet));
    expect(!!cachedData).toBeTruthy();
  });

  test('should invalidate cache when hit with the key of source method', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const targetGet = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data,
      hitSource: alova.Post('/unit-test', { a: 1 })
    });
    const firstState = useRequest(targetGet);
    await untilCbCalled(firstState.onSuccess);

    const sourcePost = alova.Post('/unit-test', { a: 1 });

    await sourcePost.send();
    const cachedData = getResponseCache(alova.id, key(targetGet));
    expect(!!cachedData).toBeFalsy();
  });

  test('should invalidate cache when equal with source name', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const targetGet = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data,
      hitSource: 'a1'
    });
    const firstState = useRequest(targetGet);
    await untilCbCalled(firstState.onSuccess);

    const sourcePost = alova.Post(
      '/unit-test',
      {},
      {
        name: 'a1'
      }
    );

    await sourcePost.send();
    const cachedData = getResponseCache(alova.id, key(targetGet));
    expect(!!cachedData).toBeFalsy();
  });

  test('should invalidate cache when the regexp match with source name', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const targetGet = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data,
      hitSource: /^a2/
    });
    const firstState = useRequest(targetGet);
    await untilCbCalled(firstState.onSuccess);

    const sourcePost = alova.Post(
      '/unit-test',
      {},
      {
        name: 'a2fegea5'
      }
    );

    await sourcePost.send();
    const cachedData = getResponseCache(alova.id, key(targetGet));
    expect(!!cachedData).toBeFalsy();
  });

  test('should invalidate cache when hit one of source flags', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const targetGet = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data,
      hitSource: ['a1', /^a2/, alova.Post('/unit-test', { a: 1 })]
    });

    // 发送请求并保存快照和缓存
    await targetGet.send();
    let sourcePost = alova.Post(
      '/unit-test',
      {},
      {
        name: 'a1'
      }
    );
    await sourcePost.send();
    let cachedData = getResponseCache(alova.id, key(targetGet));
    expect(!!cachedData).toBeFalsy();

    // 再次请求并生成缓存
    await targetGet.send();
    sourcePost = alova.Post(
      '/unit-test',
      {},
      {
        name: 'a2sdyfisdkafj'
      }
    );
    await sourcePost.send();
    cachedData = getResponseCache(alova.id, key(targetGet));
    expect(!!cachedData).toBeFalsy();

    // 再次请求并生成缓存
    await targetGet.send();
    sourcePost = alova.Post('/unit-test', { a: 1 });
    await sourcePost.send();
    cachedData = getResponseCache(alova.id, key(targetGet));
    expect(!!cachedData).toBeFalsy();
  });
});
