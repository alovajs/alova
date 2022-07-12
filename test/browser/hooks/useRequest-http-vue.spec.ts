import {
  createAlova,
  useRequest,
  GlobalFetch,
  cacheMode,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { RequestConfig } from '../../../typings';
import { Result } from '../result.type';
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

describe('use useRequet hook to send GET with vue', function() {
  test('init and send get request', done => {
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
    const Get = alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData(result: Result, _) {
        expect(result.code).toBe(200);
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({ a: 'a', b: 'str' });
        return result.data;
      },
      localCache: 100 * 1000,
    });
    const {
      loading,
      data,
      downloading,
      error,
      responser,
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeNull();
    responser.success(rawData => {
      expect(loading.value).toBeFalsy();
      expect(data.value.path).toBe('/unit-test');
      expect(data.value.params).toEqual({ a: 'a', b: 'str' });
      expect(rawData.path).toBe('/unit-test');
      expect(rawData.params).toEqual({ a: 'a', b: 'str' });
      expect(downloading.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeNull();

      // 缓存有值
      const cacheData = getResponseCache(alova.id, key(Get));
      expect(cacheData.path).toBe('/unit-test');
      expect(cacheData.params).toEqual({ a: 'a', b: 'str' });
      done();
    }).error(() => {}).complete(() => {});
  });

  test('send get with request error', done => {
    const alova = getInstance(undefined, undefined, error => {
      console.log('error callback', error.message);
      expect(error.message).toMatch(/404/);
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-404', {
      localCache: {
        expire: 100 * 1000,
      }
    });
    const {
      loading,
      data,
      downloading,
      error,
      responser,
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeNull();
    responser.error((err, requestId) => {
      expect(loading.value).toBeFalsy();
      expect(data.value).toBeUndefined();
      expect(downloading.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeInstanceOf(Error);
      expect(error.value).toBe(err);
      expect(requestId.constructor).toBe(Number);

      // 请求错误无缓存
      const cacheData = getResponseCache(alova.id, key(Get));
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
      downloading,
      error,
      responser,
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeNull();
    responser.error(err => {
      expect(loading.value).toBeFalsy();
      expect(data.value).toBeUndefined();
      expect(downloading.value).toEqual({ total: 0, loaded: 0 });
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
      error,
      responser,
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeNull();
    responser.error(err => {
      expect(loading.value).toBeFalsy();
      expect(data.value).toBeUndefined();
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
      error,
      responser,
      abort
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeNull();
    setTimeout(abort, 100);
    responser.error(err => {
      expect(loading.value).toBeFalsy();
      expect(data.value).toBeUndefined();
      expect(error.value).toBeInstanceOf(Object);
      expect(error.value).toBe(err);
      done();
    });
  });

  test('it can pass custom params when call `send` function, and the function will return a Promise instance', async () => {
    const alova = getInstance();
    const getGetter = (index: number) => alova.Get('/unit-test', {
      timeout: 10000,
      transformData: ({ data }: Result<true>) => data,
      params: {
        index,
      }
    });

    const {
      data,
      send,
      responser
    } = useRequest((index: number) => getGetter(index), {
      immediate: false,
    });
    responser.success((data, index) => {
      console.log('success passed params', index);
      expect(data.path).toBe('/unit-test');
      expect(index.toString()).toMatch(/3|5/);
    }).complete((index) => {
      console.log('complete passed params', index);
      expect(index.toString()).toMatch(/3|5/);
    });

    // 延迟一会儿发送请求
    await new Promise(resolve => setTimeout(resolve, 500));
    let rawData = await send(3);
    expect(rawData.path).toBe('/unit-test');
    expect(rawData.params.index).toEqual('3');
    await new Promise(resolve => setTimeout(resolve, 500)); // 等待响应
    expect(data.value.params.index).toBe('3');
    
    rawData = await send(5);
    expect(rawData.params.index).toEqual('5');
    await new Promise(resolve => setTimeout(resolve, 500)); // 等待响应
    expect(data.value.params.index).toBe('5');
  });

  test('should throw a request error when request error at calling `send` function', async () => {
    const alova = getInstance();
    const getGetter = (index: number) => alova.Get('/unit-test-404', {
      transformData: ({ data }: Result<true>) => data,
      params: {
        index,
      }
    });

    const {
      send,
      responser
    } = useRequest((index: number) => getGetter(index), {
      immediate: false,
    });
    responser.error((err, index) => {
      console.log('error passed params', index);
      expect(err.message).toMatch(/404/);
      expect(index.toString()).toMatch(/3|5/);
    }).complete((index) => {
      expect(index.toString()).toMatch(/3|5/);
    });

    // 延迟一会儿发送请求
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const data = await send(3);
      expect(data.path).toBe('/unit-test');
      expect(data.params.index).toEqual('3');
    } catch (err: any) {
      expect(err.message).toMatch(/404/);
    }
  });
});


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
      responser,
    } = useRequest(Post);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeNull();
    responser.success(() => {
      expect(loading.value).toBeFalsy();
      expect(data.value.path).toBe('/unit-test');
      expect(data.value.params).toEqual({ a: 'a', b: 'str' });
      expect(data.value.data).toEqual({ post1: 'a', post2: 'b' });
      expect(error.value).toBeNull();

      // 缓存有值
      const cacheData = getResponseCache(alova.id, key(Post));
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
      responser
    } = useRequest(Delete);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeNull();
    responser.success(() => {
      expect(loading.value).toBeFalsy();
      expect(data.value.path).toBe('/unit-test');
      expect(data.value.params).toEqual({ a: 'a', b: 'str' });
      expect(data.value.data).toEqual({ post1: 'a', post2: 'b' });
      expect(downloading.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeNull();

      // 缓存有值
      const cacheData = getResponseCache(alova.id, key(Delete));
      expect(cacheData).toBeUndefined();
      done();
    });
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
      responser,
    } = useRequest(Put);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeNull();
    responser.success(() => {
      expect(loading.value).toBeFalsy();
      expect(data.value.path).toBe('/unit-test');
      expect(data.value.params).toEqual({ a: 'a', b: 'str', c: '3' });
      expect(data.value.data).toEqual({ post1: 'a', post2: 'b' });
      expect(downloading.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeNull();

      // 缓存有值
      const cacheData = getResponseCache(alova.id, key(Put));
      expect(cacheData).toBeUndefined();
      done();
    });
  });

  test('send HEAD', async () => {
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
      responser,
    } = useRequest(Head);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeNull();
    await new Promise(resolve => responser.success(() => resolve(1)));
    expect(loading.value).toBeFalsy();
    expect(data.value).toEqual({});
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeNull();
    // 没有缓存值
    const cacheData = getResponseCache(alova.id, key(Head));
    expect(cacheData).toBeUndefined();
  });

  test('send OPTIONS', async () => {
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
      responser,
    } = useRequest(Options);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeNull();
    await new Promise(resolve => responser.success(() => resolve(1)));
    expect(loading.value).toBeFalsy();
    expect(data.value).toEqual({});
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeNull();
    // 没有缓存值
    const cacheData = getResponseCache(alova.id, key(Options));
    expect(cacheData).toBeUndefined();
  });

  test('send PATCH', async () => {
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
      responser,
    } = useRequest(Patch);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeNull();
    await new Promise(resolve => responser.success(() => resolve(1)));
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toEqual({ a: 'a', b: 'str' });
    expect(data.value.data).toEqual({ patch1: 'p' });
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeNull();
    // 没有缓存值
    const cacheData = getResponseCache(alova.id, key(Patch));
    expect(cacheData).toBeUndefined();
  });
});