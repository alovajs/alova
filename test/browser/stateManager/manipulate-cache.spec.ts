import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { queryCache, setCache, useRequest } from '@/index';
import VueHook from '@/predefine/VueHook';
import { getPersistentResponse, persistResponse } from '@/storage/responseStorage';
import { key } from '@/utils/helper';

const alova = getAlovaInstance(VueHook, {
  responseExpect: r => r.json()
});
describe('manipulate cache', function () {
  test('the cache response data should be saved', () => {
    const Get = alova.Get('/unit-test', {
      localCache: 100 * 1000,
      transformData: ({ data }: Result) => data
    });

    // 没有缓存时为undefined
    setCache(Get, data => {
      expect(data).toBeUndefined();
      return undefined; // 返回undefined或不返回时，取消缓存修改
    });

    setCache(Get, {
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '1'
      }
    });

    expect(queryCache(Get)).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '1'
      }
    });
  });

  test('batch set response data', async () => {
    const Get1 = alova.Get('/unit-test', {
      name: 'test-get1',
      params: { a: 1 },
      localCache: 100 * 1000,
      transformData: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test', {
      name: 'test-get1',
      params: { a: 2 },
      localCache: 100 * 1000,
      transformData: ({ data }: Result) => data
    });
    await Promise.all([Get1.send(), Get2.send()]);

    expect(queryCache(Get1)).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '1'
      }
    });
    expect(queryCache(Get2)).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '2'
      }
    });

    // 通过传入数组设置
    setCache([Get1, Get2], {
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '123'
      }
    });
    expect(queryCache(Get1)).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '123'
      }
    });
    expect(queryCache(Get2)).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '123'
      }
    });

    // 通过通配符名称设置
    setCache('test-get1', {
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '456'
      }
    });
    expect(queryCache(Get1)).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '456'
      }
    });
    expect(queryCache(Get2)).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '456'
      }
    });
  });

  test('batch update response data', async () => {
    const Get1 = alova.Get('/unit-test', {
      name: 'test-get2',
      params: { a: 55 },
      localCache: 100 * 1000,
      transformData: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test', {
      name: 'test-get2',
      params: { a: 100 },
      localCache: 100 * 1000,
      transformData: ({ data }: Result) => data
    });
    await Promise.all([Get1.send(), Get2.send()]);

    expect(queryCache(Get1)).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '55'
      }
    });
    expect(queryCache(Get2)).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '100'
      }
    });

    // 更新以上两个请求的缓存
    const mockfn = jest.fn();
    setCache<Result['data']>('test-get2', cache => {
      if (!cache) {
        return;
      }
      cache.params.a = 'update';
      mockfn();
      return cache;
    });
    expect(queryCache(Get1)).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: 'update'
      }
    });
    expect(queryCache(Get2)).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: 'update'
      }
    });
    expect(mockfn).toBeCalledTimes(2); // 只有两个被匹配

    const mockfn2 = jest.fn();
    await Get2.send();
    setCache<Result['data']>('test-get2', cache => {
      if (!cache) {
        return;
      }
      cache.params.a = 'update2';
      mockfn2();
      return cache;
    });
    expect(mockfn).toBeCalledTimes(2); // 相同的Method请求不会被多次匹配
  });

  test('update will be canceled when callback return undefined', async () => {
    const Get1 = alova.Get('/unit-test', {
      params: { a: 200 },
      localCache: 100 * 1000,
      transformData: ({ data }: Result) => data
    });
    await Get1.send();

    expect(queryCache(Get1)).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '200'
      }
    });

    // 更新函数返回undefined时，表示中断更新
    const mockfn = jest.fn();
    setCache(Get1, () => {
      mockfn();
    });
    expect(queryCache(Get1)).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '200'
      }
    });
    expect(mockfn).toBeCalledTimes(1); // 执行了一次
  });

  test('should also replace storaged data when using method instance with `placeholder`', async () => {
    const Get1 = alova.Get('/unit-test', {
      params: { a: 200 },
      localCache: {
        mode: 'placeholder',
        expire: 100 * 1000
      },
      transformData: ({ data }: Result) => data
    });
    await Get1.send();

    setCache(Get1, rawData => {
      if (rawData) {
        rawData.path = 'changed';
        return rawData;
      }
    });
    expect(queryCache(Get1)).toEqual({
      path: 'changed',
      method: 'GET',
      params: {
        a: '200'
      }
    });
    expect(getPersistentResponse(alova.id, key(Get1), alova.storage)).toEqual({
      path: 'changed',
      method: 'GET',
      params: {
        a: '200'
      }
    });
  });

  test('should also replace storaged data when using method instance with `restore`', async () => {
    const Get1 = alova.Get('/unit-test', {
      params: { a: 200 },
      localCache: {
        mode: 'restore',
        expire: 100 * 1000
      },
      transformData: ({ data }: Result) => data
    });
    await Get1.send();

    setCache(Get1, rawData => {
      if (rawData) {
        rawData.path = 'changed';
        return rawData;
      }
      return undefined;
    });
    expect(queryCache(Get1)).toEqual({
      path: 'changed',
      method: 'GET',
      params: {
        a: '200'
      }
    });
    expect(getPersistentResponse(alova.id, key(Get1), alova.storage)).toEqual({
      path: 'changed',
      method: 'GET',
      params: {
        a: '200'
      }
    });
  });

  test('should get persistent cache', () => {
    const Get = alova.Get('/unit-test', {
      params: {
        ccc: '555'
      },
      localCache: 100 * 1000,
      transformData: ({ data }: Result) => data
    });

    // 持久化自定义缓存
    persistResponse(
      alova.id,
      key(Get),
      {
        data: 'persisted'
      },
      Infinity,
      alova.storage
    );
    expect(queryCache(Get)).toEqual({
      data: 'persisted'
    });
  });

  test('queryCache can only get the first cache', async () => {
    const Get1 = alova.Get('/unit-test', {
      name: 'test-get3',
      params: { a: 1000 },
      localCache: 100 * 1000,
      transformData: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test', {
      name: 'test-get3',
      params: { a: 2000 },
      localCache: 100 * 1000,
      transformData: ({ data }: Result) => data
    });
    await Promise.all([Get1.send(), Get2.send()]);

    expect(queryCache('test-get3')).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '1000'
      }
    });
    // 未匹配到时返回undefined
    expect(queryCache('test-get222')).toBeUndefined();
  });

  // 通过设置localCache为函数，将缓存变为受控状态，可以自定义返回需要使用的缓存数据
  test('should hit the controlled cache when localCache is common function', async () => {
    const mockControlledCache = {
      path: 'local-controlled',
      params: {},
      method: 'Get'
    };
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1000 },
      localCache() {
        return mockControlledCache;
      },
      transformData: ({ data }: Result) => data
    });
    const { onSuccess, data } = useRequest(Get1);
    const event = await untilCbCalled(onSuccess);
    expect(event.fromCache).toBeTruthy();
    expect(event.data).toStrictEqual(mockControlledCache);
    expect(data.value).toStrictEqual(mockControlledCache);

    const rawData = await Get1.send();
    expect(rawData).toStrictEqual(mockControlledCache);
  });
  test('localCache can also be a async function', async () => {
    const mockControlledCache = {
      path: 'local-controlled',
      params: {},
      method: 'Get'
    };
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1000 },
      async localCache() {
        await new Promise(resolve => {
          setTimeout(resolve, 200);
        });
        return mockControlledCache;
      },
      transformData: ({ data }: Result) => data
    });
    const { onSuccess, data } = useRequest(Get1);
    const event = await untilCbCalled(onSuccess);
    expect(event.fromCache).toBeTruthy();
    expect(event.data).toStrictEqual(mockControlledCache);
    expect(data.value).toStrictEqual(mockControlledCache);

    const rawData = await Get1.send();
    expect(rawData).toStrictEqual(mockControlledCache);
  });

  test('should continue send request when localCache function is return undefined', async () => {
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1000 },
      async localCache() {
        return undefined;
      },
      transformData: ({ data }: Result) => data
    });
    const { onSuccess } = useRequest(Get1);
    const event = await untilCbCalled(onSuccess);
    expect(event.fromCache).toBeFalsy();
    expect(event.data).toStrictEqual({
      path: '/unit-test',
      params: { a: '1000' },
      method: 'GET'
    });
  });

  test('should emit onError when localCache throws a error', async () => {
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1000 },
      localCache() {
        throw new Error('error in localCache');
      },
      transformData: ({ data }: Result) => data
    });
    const { onError } = useRequest(Get1);
    const event = await untilCbCalled(onError);
    expect(event.error.message).toBe('error in localCache');

    await expect(Get1.send()).rejects.toThrow('error in localCache');
  });
});
