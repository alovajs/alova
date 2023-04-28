import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { Method, useRequest } from '@/index';
import VueHook from '@/predefine/VueHook';
import { getResponseCache } from '@/storage/responseCache';
import { key } from '@/utils/helper';

// 其他请求方式测试
describe('Test other methods without GET', function () {
  test('send POST', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        expect(method).toBeInstanceOf(Method);
        const config = method.config;
        expect(method.url).toBe('/unit-test');
        expect(config.params).toEqual({ a: 'a', b: 'str' });
        expect(method.data).toEqual({ post1: 'a' });
        (method.data as Record<string, any>).post2 = 'b';
        expect(config.headers).toEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
      responseExpect: async (r, method) => {
        expect(method).toBeInstanceOf(Method);
        const res = await r.json();
        const { data } = res;
        expect(data.path).toBe('/unit-test');
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        expect(data.params).toEqual({ a: 'a', b: 'str' });
        return res;
      }
    });
    const Post = alova.Post(
      '/unit-test',
      { post1: 'a' },
      {
        params: { a: 'a', b: 'str' },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        transformData({ code, data }: Result<true>) {
          expect(code).toBe(200);
          expect(data.path).toBe('/unit-test');
          expect(data.params).toEqual({ a: 'a', b: 'str' });
          expect(data.data).toEqual({ post1: 'a', post2: 'b' });
          return data;
        },
        localCache: {
          expire: 100 * 1000,
          mode: 'memory'
        }
      }
    );
    const { loading, data, error, onSuccess } = useRequest(Post);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toEqual({ a: 'a', b: 'str' });
    expect(data.value.data).toEqual({ post1: 'a', post2: 'b' });
    expect(error.value).toBeUndefined();

    // 缓存有值
    const cacheData = getResponseCache(alova.id, key(Post));
    expect(cacheData).toBeUndefined();
  });

  test('send DELETE', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        const config = method.config;
        expect(method.url).toBe('/unit-test');
        expect(config.params).toEqual({ a: 'a', b: 'str' });
        expect(method.data).toEqual({ post1: 'a' });
        (method.data as Record<string, any>).post2 = 'b';
        expect(config.headers).toEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
      responseExpect: async r => {
        const res = await r.json();
        const { data } = res;
        expect(data.path).toBe('/unit-test');
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        expect(data.params).toEqual({ a: 'a', b: 'str' });
        return res;
      }
    });
    const Delete = alova.Delete(
      '/unit-test',
      { post1: 'a' },
      {
        params: { a: 'a', b: 'str' },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        transformData({ code, data }: Result<true>) {
          expect(code).toBe(200);
          expect(data.path).toBe('/unit-test');
          expect(data.params).toEqual({ a: 'a', b: 'str' });
          expect(data.data).toEqual({ post1: 'a', post2: 'b' });
          return data;
        },
        localCache: 100 * 1000
      }
    );
    const { loading, data, downloading, error, onSuccess } = useRequest(Delete);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toEqual({ a: 'a', b: 'str' });
    expect(data.value.data).toEqual({ post1: 'a', post2: 'b' });
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    // 缓存有值
    const cacheData = getResponseCache(alova.id, key(Delete));
    expect(cacheData).toBeUndefined();
  });

  test('send PUT', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        const config = method.config;
        expect(method.url).toBe('/unit-test?c=3');
        expect(config.params).toEqual({ a: 'a', b: 'str' });
        expect(method.data).toEqual({ post1: 'a' });
        (method.data as Record<string, any>).post2 = 'b';
        expect(config.headers).toEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
      responseExpect: async r => {
        const res = await r.json();
        const { data } = res;
        expect(data.path).toBe('/unit-test');
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        expect(data.params).toEqual({ a: 'a', b: 'str', c: '3' });
        return res;
      }
    });
    const Put = alova.Put(
      '/unit-test?c=3',
      { post1: 'a' },
      {
        params: { a: 'a', b: 'str' },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        transformData({ code, data }: Result<true>) {
          expect(code).toBe(200);
          expect(data.path).toBe('/unit-test');
          expect(data.params).toEqual({ a: 'a', b: 'str', c: '3' });
          expect(data.data).toEqual({ post1: 'a', post2: 'b' });
          return data;
        },
        localCache: 100 * 1000
      }
    );
    const { loading, data, downloading, error, onSuccess } = useRequest(Put);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toEqual({ a: 'a', b: 'str', c: '3' });
    expect(data.value.data).toEqual({ post1: 'a', post2: 'b' });
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    // 缓存有值
    const cacheData = getResponseCache(alova.id, key(Put));
    expect(cacheData).toBeUndefined();
  });

  test('send HEAD', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        expect(method.type).toBe('HEAD');
      },
      responseExpect: r => r.json()
    });
    const Head = alova.Head('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      transformData(resp: Result, headers) {
        expect(headers.get('x-powered-by')).toBe('msw');
        return resp;
      }
    });
    const { loading, data, downloading, error, onSuccess } = useRequest(Head);

    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toEqual({});
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    // 没有缓存值
    const cacheData = getResponseCache(alova.id, key(Head));
    expect(cacheData).toBeUndefined();
  });

  test('send OPTIONS', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        expect(method.type).toBe('OPTIONS');
      },
      responseExpect: r => r.json()
    });
    const Options = alova.Options('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      transformData(resp: Result, headers) {
        expect(headers.get('x-powered-by')).toBe('msw');
        return resp;
      }
    });
    const { loading, data, downloading, error, onSuccess } = useRequest(Options);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toEqual({});
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    // 没有缓存值
    const cacheData = getResponseCache(alova.id, key(Options));
    expect(cacheData).toBeUndefined();
  });

  test('send PATCH', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        expect(method.type).toBe('PATCH');
      },
      responseExpect: r => r.json()
    });
    const Patch = alova.Patch(
      '/unit-test',
      { patch1: 'p' },
      {
        params: { a: 'a', b: 'str' },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        transformData(resp: Result<true>, headers) {
          expect(headers.get('x-powered-by')).toBe('msw');
          return resp.data;
        }
      }
    );
    const { loading, data, downloading, error, onSuccess } = useRequest(Patch);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toEqual({ a: 'a', b: 'str' });
    expect(data.value.data).toEqual({ patch1: 'p' });
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    // 没有缓存值
    const cacheData = getResponseCache(alova.id, key(Patch));
    expect(cacheData).toBeUndefined();
  });
});
