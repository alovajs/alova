import { delay, getAlovaInstance, Result, untilCbCalled } from '#/utils';
import xhrRequestAdapter from '#/xhrRequestAdapter';
import { createAlova, Method, useRequest } from '@/index';
import GlobalFetch from '@/predefine/GlobalFetch';
import VueHook from '@/predefine/VueHook';
import { getResponseCache } from '@/storage/responseCache';
import { key } from '@/utils/helper';
import { baseURL } from '~/test/mockServer';

// 其他请求方式测试
describe('Test other methods without GET', function () {
  test('send POST', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        expect(method).toBeInstanceOf(Method);
        const config = method.config;
        expect(method.url).toBe('/unit-test');
        expect(config.params).toStrictEqual({ a: 'a', b: 'str' });
        expect(method.data).toStrictEqual({ post1: 'a' });
        (method.data as Record<string, any>).post2 = 'b';
        expect(config.headers).toStrictEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
      responseExpect: async (r, method) => {
        expect(method).toBeInstanceOf(Method);
        const res = await r.json();
        const { data } = res;
        expect(data.path).toBe('/unit-test');
        expect(data.data).toStrictEqual({ post1: 'a', post2: 'b' });
        expect(data.params).toStrictEqual({ a: 'a', b: 'str' });
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
          expect(data.params).toStrictEqual({ a: 'a', b: 'str' });
          expect(data.data).toStrictEqual({ post1: 'a', post2: 'b' });
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
    expect(data.value.params).toStrictEqual({ a: 'a', b: 'str' });
    expect(data.value.data).toStrictEqual({ post1: 'a', post2: 'b' });
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
        expect(config.params).toStrictEqual({ a: 'a', b: 'str' });
        expect(method.data).toStrictEqual({ post1: 'a' });
        (method.data as Record<string, any>).post2 = 'b';
        expect(config.headers).toStrictEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
      responseExpect: async r => {
        const res = await r.json();
        const { data } = res;
        expect(data.path).toBe('/unit-test');
        expect(data.data).toStrictEqual({ post1: 'a', post2: 'b' });
        expect(data.params).toStrictEqual({ a: 'a', b: 'str' });
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
          expect(data.params).toStrictEqual({ a: 'a', b: 'str' });
          expect(data.data).toStrictEqual({ post1: 'a', post2: 'b' });
          return data;
        },
        localCache: 100 * 1000
      }
    );
    const { loading, data, downloading, error, onSuccess } = useRequest(Delete);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toStrictEqual({ a: 'a', b: 'str' });
    expect(data.value.data).toStrictEqual({ post1: 'a', post2: 'b' });
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
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
        expect(config.params).toStrictEqual({ a: 'a', b: 'str' });
        expect(method.data).toStrictEqual({ post1: 'a' });
        (method.data as Record<string, any>).post2 = 'b';
        expect(config.headers).toStrictEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
      responseExpect: async r => {
        const res = await r.json();
        const { data } = res;
        expect(data.path).toBe('/unit-test');
        expect(data.data).toStrictEqual({ post1: 'a', post2: 'b' });
        expect(data.params).toStrictEqual({ a: 'a', b: 'str', c: '3' });
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
          expect(data.params).toStrictEqual({ a: 'a', b: 'str', c: '3' });
          expect(data.data).toStrictEqual({ post1: 'a', post2: 'b' });
          return data;
        },
        localCache: 100 * 1000
      }
    );
    const { loading, data, downloading, error, onSuccess } = useRequest(Put);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toStrictEqual({ a: 'a', b: 'str', c: '3' });
    expect(data.value.data).toStrictEqual({ post1: 'a', post2: 'b' });
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
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
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toStrictEqual({});
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
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
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toStrictEqual({});
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
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
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toStrictEqual({ a: 'a', b: 'str' });
    expect(data.value.data).toStrictEqual({ patch1: 'p' });
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    // 没有缓存值
    const cacheData = getResponseCache(alova.id, key(Patch));
    expect(cacheData).toBeUndefined();
  });

  test('should download file and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter,
      statesHook: VueHook,
      responded({ data }) {
        return data;
      },
      cacheLogger: null
    });

    const Get = alovaInst.Get('/unit-test-download', {
      responseType: 'blob'
    });

    const { loading, data, uploading, downloading, error, onSuccess } = useRequest(Get);
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeInstanceOf(Blob);
    expect(uploading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(downloading.value).toStrictEqual({ total: 451268, loaded: 451268 });
    expect(error.value).toBeUndefined();

    // 上传/下载回调解绑会在事件响应后触发，所以等10ms再验证是否解绑
    await delay(10);
    expect(Get.dhs).toHaveLength(0);

    // 有缓存的情况下，不再有下载信息
    const { downloading: downloading2, onSuccess: onSuccess2 } = useRequest(Get);
    await untilCbCalled(onSuccess2);
    expect(downloading2.value).toStrictEqual({ total: 0, loaded: 0 });
  });

  test('should abort the file downloading when abort request', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter,
      statesHook: VueHook,
      responded({ data }) {
        return data;
      },
      cacheLogger: null
    });

    const Get = alovaInst.Get('/unit-test-download', {
      responseType: 'blob'
    });

    const { error, abort, onError } = useRequest(Get);
    delay(3).then(abort);
    const e = await untilCbCalled(onError);
    expect(error.value).toStrictEqual(e.error);
  });

  test('should not add slash at the end when sending with empty url', async () => {
    const alova = createAlova({
      baseURL: baseURL + '/unit-test',
      requestAdapter: GlobalFetch(),
      statesHook: VueHook,
      async responded(r, method) {
        expect(method).toBeInstanceOf(Method);
        const res = await r.json();
        const { data } = res;
        expect(data.path).toBe('/unit-test');
        return res;
      },
      cacheLogger: null
    });

    const Getter = alova.Get('', {
      params: { a: 'a', b: 'str' },
      transformData({ code, data }: Result<'/unit-test'>) {
        expect(code).toBe(200);
        return data;
      }
    });
    const { loading, data, error, onSuccess } = useRequest(Getter);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toStrictEqual({ a: 'a', b: 'str' });
    expect(error.value).toBeUndefined();
  });
});
