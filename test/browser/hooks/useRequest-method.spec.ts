import {
  createAlova,
  useRequest,
  GlobalFetch,
  cacheMode,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { AlovaRequestAdapterConfig } from '../../../typings';
import { Result } from '../result.type';
import server from '../../server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
function getInstance(
  beforeRequestExpect?: (config: AlovaRequestAdapterConfig<any, any, RequestInit, Headers>) => void,
  responseExpect?: (jsonPromise: Promise<any>) => void,
  resErrorExpect?: (err: Error) => void,
) {
  return createAlova({
    baseURL: 'http://localhost:3000',
    timeout: 3000,
    statesHook: VueHook,
    requestAdapter: GlobalFetch(),
    beforeRequest(config) {
      beforeRequestExpect && beforeRequestExpect(config);
      return config;
    },
    responsed: {
      success: response => {
        const jsonPromise = response.json();
        responseExpect && responseExpect(jsonPromise);
        return jsonPromise;
      },
      error: err => {
        resErrorExpect && resErrorExpect(err);
      }
    }
  });
}



// 其他请求方式测试
describe('Test other methods without GET', function() {
  test('send POST', done => {
    const alova = getInstance(
      config => {
        expect(config.url).toBe('/unit-test');
        expect(config.params).toEqual({ a: 'a', b: 'str' });
        expect(config.data).toEqual({ post1: 'a' });
        (config.data as Record<string, any>).post2 = 'b';
        expect(config.headers).toEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
      async jsonPromise => {
        const { data } = await jsonPromise;
        expect(data.path).toBe('/unit-test');
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        expect(data.params).toEqual({ a: 'a', b: 'str' });
      }
    );
    const Post = alova.Post('/unit-test', { post1: 'a' }, {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData({ code, data }: Result<true>, _) {
        expect(code).toBe(200);
        expect(data.path).toBe('/unit-test');
        expect(data.params).toEqual({ a: 'a', b: 'str' });
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        return data;
      },
      localCache: {
        expire: 100 * 1000,
        mode: cacheMode.MEMORY,
      }
    });
    const {
      loading,
      data,
      error,
    } = useRequest(Post, {
      onSuccess: () => {
        expect(loading.value).toBeFalsy();
        expect(data.value.path).toBe('/unit-test');
        expect(data.value.params).toEqual({ a: 'a', b: 'str' });
        expect(data.value.data).toEqual({ post1: 'a', post2: 'b' });
        expect(error.value).toBeUndefined();
  
        // 缓存有值
        const cacheData = getResponseCache(alova.id, key(Post));
        expect(cacheData).toBeUndefined();
        done();
      }
    });
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
  });

  test('send DELETE', done => {
    const alova = getInstance(
      config => {
        expect(config.url).toBe('/unit-test');
        expect(config.params).toEqual({ a: 'a', b: 'str' });
        expect(config.data).toEqual({ post1: 'a' });
        (config.data as Record<string, any>).post2 = 'b';
        expect(config.headers).toEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
      async jsonPromise => {
        const { data } = await jsonPromise;
        expect(data.path).toBe('/unit-test');
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        expect(data.params).toEqual({ a: 'a', b: 'str' });
      }
    );
    const Delete = alova.Delete('/unit-test', { post1: 'a' }, {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData({ code, data }: Result<true>, _) {
        expect(code).toBe(200);
        expect(data.path).toBe('/unit-test');
        expect(data.params).toEqual({ a: 'a', b: 'str' });
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        return data;
      },
      localCache: 100 * 1000,
    });
    const {
      loading,
      data,
      downloading,
      error,
    } = useRequest(Delete, {
      onSuccess: () => {
        expect(loading.value).toBeFalsy();
        expect(data.value.path).toBe('/unit-test');
        expect(data.value.params).toEqual({ a: 'a', b: 'str' });
        expect(data.value.data).toEqual({ post1: 'a', post2: 'b' });
        expect(downloading.value).toEqual({ total: 0, loaded: 0 });
        expect(error.value).toBeUndefined();
  
        // 缓存有值
        const cacheData = getResponseCache(alova.id, key(Delete));
        expect(cacheData).toBeUndefined();
        done();
      }
    });
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
  });

  test('send PUT', done => {
    const alova = getInstance(
      config => {
        expect(config.url).toBe('/unit-test?c=3');
        expect(config.params).toEqual({ a: 'a', b: 'str' });
        expect(config.data).toEqual({ post1: 'a' });
        (config.data as Record<string, any>).post2 = 'b';
        expect(config.headers).toEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
      async jsonPromise => {
        const { data } = await jsonPromise;
        expect(data.path).toBe('/unit-test');
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        expect(data.params).toEqual({ a: 'a', b: 'str', c: '3' });
      }
    );
    const Put = alova.Put('/unit-test?c=3', { post1: 'a' }, {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData({ code, data }: Result<true>, _) {
        expect(code).toBe(200);
        expect(data.path).toBe('/unit-test');
        expect(data.params).toEqual({ a: 'a', b: 'str', c: '3' });
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        return data;
      },
      localCache: 100 * 1000,
    });
    const {
      loading,
      data,
      downloading,
      error,
    } = useRequest(Put, {
      onSuccess: () => {
        expect(loading.value).toBeFalsy();
        expect(data.value.path).toBe('/unit-test');
        expect(data.value.params).toEqual({ a: 'a', b: 'str', c: '3' });
        expect(data.value.data).toEqual({ post1: 'a', post2: 'b' });
        expect(downloading.value).toEqual({ total: 0, loaded: 0 });
        expect(error.value).toBeUndefined();
  
        // 缓存有值
        const cacheData = getResponseCache(alova.id, key(Put));
        expect(cacheData).toBeUndefined();
        done();
      }
    });
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
  });

  test('send HEAD', done => {
    const alova = getInstance(config => {
      expect(config.method).toBe('HEAD');
    });
    const Head = alova.Head('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData(resp: Result, headers) {
        expect(headers.get('x-powered-by')).toBe('msw');
        return resp;
      },
    });
    const {
      loading,
      data,
      downloading,
      error,
    } = useRequest(Head, {
      onSuccess: () => {
        expect(loading.value).toBeFalsy();
        expect(data.value).toEqual({});
        expect(downloading.value).toEqual({ total: 0, loaded: 0 });
        expect(error.value).toBeUndefined();
        // 没有缓存值
        const cacheData = getResponseCache(alova.id, key(Head));
        expect(cacheData).toBeUndefined();
        done();
      }
    });

    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
  });

  test('send OPTIONS', done => {
    const alova = getInstance(config => {
      expect(config.method).toBe('OPTIONS');
    });
    const Options = alova.Options('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData(resp: Result, headers) {
        expect(headers.get('x-powered-by')).toBe('msw');
        return resp;
      },
    });
    const {
      loading,
      data,
      downloading,
      error,
    } = useRequest(Options, {
      onSuccess: () => {
        expect(loading.value).toBeFalsy();
        expect(data.value).toEqual({});
        expect(downloading.value).toEqual({ total: 0, loaded: 0 });
        expect(error.value).toBeUndefined();
        // 没有缓存值
        const cacheData = getResponseCache(alova.id, key(Options));
        expect(cacheData).toBeUndefined();
        done();
      }
    });
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
  });

  test('send PATCH', done => {
    const alova = getInstance(config => {
      expect(config.method).toBe('PATCH');
    });
    const Patch = alova.Patch('/unit-test', { patch1: 'p' }, {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData(resp: Result<true>, headers) {
        expect(headers.get('x-powered-by')).toBe('msw');
        return resp.data;
      },
    });
    const {
      loading,
      data,
      downloading,
      error,
    } = useRequest(Patch, {
      onSuccess: () => {
        expect(loading.value).toBeFalsy();
        expect(data.value.path).toBe('/unit-test');
        expect(data.value.params).toEqual({ a: 'a', b: 'str' });
        expect(data.value.data).toEqual({ patch1: 'p' });
        expect(downloading.value).toEqual({ total: 0, loaded: 0 });
        expect(error.value).toBeUndefined();
        // 没有缓存值
        const cacheData = getResponseCache(alova.id, key(Patch));
        expect(cacheData).toBeUndefined();
        done();
      }
    });
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
  });
});