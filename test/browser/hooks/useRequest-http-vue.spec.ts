import {
  createAlova,
  VueHook,
  useRequest,
  GlobalFetch,
} from '../../../src';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { RequestConfig } from '../../../typings';
import { GetData, PostData, Result } from '../result.type';
import server from '../../server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
function getInstance(
  beforeRequestExpect?: (config: RequestConfig<any, any>) => void,
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
    responsed: [response => {
      const jsonPromise = response.json();
      responseExpect && responseExpect(jsonPromise);
      return jsonPromise;
    }, err => {
      resErrorExpect && resErrorExpect(err);
    }]
  });
}

describe('use useRequet hook to send GET with vue', function() {
  test('init data and get', done => {
    const alova = getInstance(
      config => {
        expect(config.url).toBe('/unit-test');
        expect(config.params).toEqual({ a: 'a', b: 'str' });
        expect(config.headers).toEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
      async jsonPromise => {
        const result = await jsonPromise;
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({ a: 'a', b: 'str' });
      }
    );
    const Get = alova.Get<GetData, Result>('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData(result, _) {
        expect(result.code).toBe(200);
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({ a: 'a', b: 'str' });
        return result.data;
      },
      staleTime: (result, headers, method) => {
        expect(result.code).toBe(200);
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({ a: 'a', b: 'str' });
        expect(headers).toBeInstanceOf(Object);
        expect(method).toBe('GET');
        return 100 * 1000;
      },
    });
    const {
      loading,
      data,
      download,
      error,
      onSuccess,
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    onSuccess(() => {
      expect(loading.value).toBeFalsy();
      expect(data.value.path).toBe('/unit-test');
      expect(data.value.params).toEqual({ a: 'a', b: 'str' });
      expect(download.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeUndefined();

      // 缓存有值
      const cacheData = getResponseCache(alova.id, 'http://localhost:3000', key(Get));
      expect(cacheData.path).toBe('/unit-test');
      expect(cacheData.params).toEqual({ a: 'a', b: 'str' });
      done();
    });
  });

  test('send get with request error', done => {
    const alova = getInstance(undefined, undefined, error => {
      console.log('error callback', error.message);
      expect(error.message).toMatch(/Not Found/);
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-404', {
      staleTime: 100000
    });
    const {
      loading,
      data,
      download,
      error,
      onError,
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    onError(err => {
      expect(loading.value).toBeFalsy();
      expect(data.value).toBeUndefined();
      expect(download.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeInstanceOf(Error);
      expect(error.value).toBe(err);

      // 请求错误无缓存
      const cacheData = getResponseCache(alova.id, 'http://localhost:3000', key(Get));
      expect(cacheData).toBeUndefined();
      done();
    });
  });

  test('send get with responseCallback error', done => {
    const alova = getInstance(undefined, () => {
      throw new Error('responseCallback error');
    }, error => {
      console.log('error responseCallback', error.message);
      expect(error.message).toMatch(/responseCallback error/);
    });
    const Get = alova.Get<string, Result<string>>('/unit-test');
    const {
      loading,
      data,
      download,
      error,
      onError,
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    onError(err => {
      expect(loading.value).toBeFalsy();
      expect(data.value).toBeUndefined();
      expect(download.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeInstanceOf(Object);
      expect(error.value).toBe(err);
      done();
    });
  });

  test('abort request when timeout', done => {
    const alova = getInstance(undefined, undefined, error => {
      console.log('error timeout', error.message);
      expect(error.message).toMatch(/network timeout/);
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-10s', {  timeout: 500 });
    const {
      loading,
      data,
      download,
      error,
      onError,
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    onError(err => {
      expect(loading.value).toBeFalsy();
      expect(data.value).toBeUndefined();
      expect(download.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeInstanceOf(Object);
      expect(error.value).toBe(err);
      done();
    });
  });

  test('manual abort request', done => {
    const alova = getInstance(undefined, undefined, error => {
      console.log('manual abort', error.message);
      expect(error.message).toMatch(/user aborted a request/);
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-10s');
    const {
      loading,
      data,
      download,
      error,
      onError,
      abort
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    setTimeout(abort, 100);
    onError(err => {
      expect(loading.value).toBeFalsy();
      expect(data.value).toBeUndefined();
      expect(download.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeInstanceOf(Object);
      expect(error.value).toBe(err);
      done();
    });
  });
});


// 其他请求方式测试
describe('Test other methods without GET', function() {
  // this.timeout(5000);
  test('send POST', done => {
    const alova = getInstance(
      config => {
        expect(config.url).toBe('/unit-test');
        expect(config.params).toEqual({ a: 'a', b: 'str' });
        expect(config.data).toEqual({ post1: 'a' });
        config.data.post2 = 'b';
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
    const Post = alova.Post<PostData, Result<true>>('/unit-test', { post1: 'a' }, {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData({ code, data }, _) {
        expect(code).toBe(200);
        expect(data.path).toBe('/unit-test');
        expect(data.params).toEqual({ a: 'a', b: 'str' });
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        return data;
      },
      staleTime: ({ code, data }, headers, method) => {
        expect(code).toBe(200);
        expect(data.path).toBe('/unit-test');
        expect(data.params).toEqual({ a: 'a', b: 'str' });
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        expect(headers).toBeInstanceOf(Object);
        expect(method).toBe('POST');
        return 100 * 1000;
      },
    });
    const {
      loading,
      data,
      download,
      error,
      onSuccess,
    } = useRequest(Post);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    onSuccess(() => {
      expect(loading.value).toBeFalsy();
      expect(data.value.path).toBe('/unit-test');
      expect(data.value.params).toEqual({ a: 'a', b: 'str' });
      expect(data.value.data).toEqual({ post1: 'a', post2: 'b' });
      expect(download.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeUndefined();

      // 缓存有值
      const cacheData = getResponseCache(alova.id, 'http://localhost:3000', key(Post));
      expect(cacheData).toBeUndefined();
      done();
    });
  });

  test('send DELETE', done => {
    const alova = getInstance(
      config => {
        expect(config.url).toBe('/unit-test');
        expect(config.params).toEqual({ a: 'a', b: 'str' });
        expect(config.data).toEqual({ post1: 'a' });
        config.data.post2 = 'b';
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
    const Delete = alova.Delete<PostData, Result<true>>('/unit-test', { post1: 'a' }, {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData({ code, data }, _) {
        expect(code).toBe(200);
        expect(data.path).toBe('/unit-test');
        expect(data.params).toEqual({ a: 'a', b: 'str' });
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        return data;
      },
      staleTime: ({ code, data }, headers, method) => {
        expect(code).toBe(200);
        expect(data.path).toBe('/unit-test');
        expect(data.params).toEqual({ a: 'a', b: 'str' });
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        expect(headers).toBeInstanceOf(Object);
        expect(method).toBe('DELETE');
        return 100 * 1000;
      },
    });
    const {
      loading,
      data,
      download,
      error,
      onSuccess,
    } = useRequest(Delete);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    onSuccess(() => {
      expect(loading.value).toBeFalsy();
      expect(data.value.path).toBe('/unit-test');
      expect(data.value.params).toEqual({ a: 'a', b: 'str' });
      expect(data.value.data).toEqual({ post1: 'a', post2: 'b' });
      expect(download.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeUndefined();

      // 缓存有值
      const cacheData = getResponseCache(alova.id, 'http://localhost:3000', key(Delete));
      expect(cacheData).toBeUndefined();
      done();
    });
  });

  test('send PUT', done => {
    const alova = getInstance(
      config => {
        expect(config.url).toBe('/unit-test');
        expect(config.params).toEqual({ a: 'a', b: 'str' });
        expect(config.data).toEqual({ post1: 'a' });
        config.data.post2 = 'b';
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
    const Put = alova.Put<PostData, Result<true>>('/unit-test', { post1: 'a' }, {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData({ code, data }, _) {
        expect(code).toBe(200);
        expect(data.path).toBe('/unit-test');
        expect(data.params).toEqual({ a: 'a', b: 'str' });
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        return data;
      },
      staleTime: ({ code, data }, headers, method) => {
        expect(code).toBe(200);
        expect(data.path).toBe('/unit-test');
        expect(data.params).toEqual({ a: 'a', b: 'str' });
        expect(data.data).toEqual({ post1: 'a', post2: 'b' });
        expect(headers).toBeInstanceOf(Object);
        expect(method).toBe('PUT');
        return 100 * 1000;
      },
    });
    const {
      loading,
      data,
      download,
      error,
      onSuccess,
    } = useRequest(Put);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    onSuccess(() => {
      expect(loading.value).toBeFalsy();
      expect(data.value.path).toBe('/unit-test');
      expect(data.value.params).toEqual({ a: 'a', b: 'str' });
      expect(data.value.data).toEqual({ post1: 'a', post2: 'b' });
      expect(download.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeUndefined();

      // 缓存有值
      const cacheData = getResponseCache(alova.id, 'http://localhost:3000', key(Put));
      expect(cacheData).toBeUndefined();
      done();
    });
  });

  test('send HEAD', async () => {
    const alova = getInstance(config => {
      expect(config.method).toBe('HEAD');
    });
    const Head = alova.Head<{}, Result>('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData(resp, headers) {
        expect(headers.get('x-powered-by')).toBe('msw');
        return resp;
      },
    });
    const {
      loading,
      data,
      download,
      error,
      onSuccess,
    } = useRequest(Head);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    await new Promise(resolve => onSuccess(() => resolve(1)));
    expect(loading.value).toBeFalsy();
    expect(data.value).toEqual({});
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    // 没有缓存值
    const cacheData = getResponseCache(alova.id, 'http://localhost:3000', key(Head));
    expect(cacheData).toBeUndefined();
  });

  test('send OPTIONS', async () => {
    const alova = getInstance(config => {
      expect(config.method).toBe('OPTIONS');
    });
    const Options = alova.Options<{}, Result>('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData(resp, headers) {
        expect(headers.get('x-powered-by')).toBe('msw');
        return resp;
      },
    });
    const {
      loading,
      data,
      download,
      error,
      onSuccess,
    } = useRequest(Options);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    await new Promise(resolve => onSuccess(() => resolve(1)));
    expect(loading.value).toBeFalsy();
    expect(data.value).toEqual({});
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    // 没有缓存值
    const cacheData = getResponseCache(alova.id, 'http://localhost:3000', key(Options));
    expect(cacheData).toBeUndefined();
  });

  test('send PATCH', async () => {
    const alova = getInstance(config => {
      expect(config.method).toBe('PATCH');
    });
    const Patch = alova.Patch<PostData, Result<true>>('/unit-test', { patch1: 'p' }, {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData(resp, headers) {
        expect(headers.get('x-powered-by')).toBe('msw');
        return resp.data;
      },
    });
    const {
      loading,
      data,
      download,
      error,
      onSuccess,
    } = useRequest(Patch);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    await new Promise(resolve => onSuccess(() => resolve(1)));
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toEqual({ a: 'a', b: 'str' });
    expect(data.value.data).toEqual({ patch1: 'p' });
    expect(download.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    // 没有缓存值
    const cacheData = getResponseCache(alova.id, 'http://localhost:3000', key(Patch));
    expect(cacheData).toBeUndefined();
  });
});