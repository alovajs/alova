import { AlovaXHRAdapter, getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { createAlova, Method, useRequest } from '@/index';
import VueHook from '@/predefine/VueHook';
import { getResponseCache } from '@/storage/responseCache';
import { key } from '@/utils/helper';
import { xhrRequestAdapter } from '@alova/adapter-xhr';
import { baseURL } from '~/test/mockServer';

// 其他请求方式测试
describe('Test other methods without GET', function () {
  test("should throws a throw when hook handler didn't get a method instance", () => {
    getAlovaInstance(VueHook);
    const errMsg = '[alova]hook handler must be a method instance or a function that returns method instance';
    expect(() => {
      (useRequest as any)();
    }).toThrow(errMsg);
    expect(() => {
      (useRequest as any)('123');
    }).toThrow(errMsg);
    expect(() => {
      (useRequest as any)(() => {});
    }).toThrow(errMsg);
    expect(() => {
      (useRequest as any)(() => 456);
    }).toThrow(errMsg);
  });

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

  test('should download file and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter() as AlovaXHRAdapter,
      statesHook: VueHook,
      responded({ data }) {
        return data;
      },
      cacheLogger: null
    });

    const Get = alovaInst.Get('/unit-test-download', {
      enableDownload: true,
      responseType: 'blob'
    });

    const { loading, data, uploading, downloading, error, onSuccess } = useRequest(Get);
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeInstanceOf(Blob);
    expect(uploading.value).toEqual({ total: 0, loaded: 0 });
    expect(downloading.value).toEqual({ total: 451268, loaded: 451268 });
    expect(error.value).toBeUndefined();

    // 有缓存的情况下，不再有下载信息
    const { downloading: downloading2, onSuccess: onSuccess2 } = useRequest(Get);
    await untilCbCalled(onSuccess2);
    expect(downloading2.value).toEqual({ total: 0, loaded: 0 });
  });
});
