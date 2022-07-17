import {
  createAlova,
  useRequest,
  GlobalFetch,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { AlovaRequestAdapterConfig, AlovaResponseSchema } from '../../../typings';
import { Result } from '../result.type';
import server from '../../server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
function getInstance(
  beforeRequestExpect?: (config: AlovaRequestAdapterConfig<any, any, RequestInit>) => void,
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
      transformData({ data, currentData }: AlovaResponseSchema<Result>) {
        expect(data.code).toBe(200);
        expect(data.data.path).toBe('/unit-test');
        expect(data.data.params).toEqual({ a: 'a', b: 'str' });
        return data.data;
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
    expect(error.value).toBeUndefined();
    responser.success(rawData => {
      expect(loading.value).toBeFalsy();
      expect(data.value.path).toBe('/unit-test');
      expect(data.value.params).toEqual({ a: 'a', b: 'str' });
      expect(rawData.path).toBe('/unit-test');
      expect(rawData.params).toEqual({ a: 'a', b: 'str' });
      expect(downloading.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeUndefined();

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
    expect(error.value).toBeUndefined();
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
    expect(error.value).toBeUndefined();
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
    expect(error.value).toBeUndefined();
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
    expect(error.value).toBeUndefined();
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

  test.only('shouldn\'t be changed when modify states', () => {
    const alova = getInstance();
    const Get = alova.Get('/unit-test');
    const {
      data,
      loading,
      error,
    } = useRequest(Get);

    data.value = 'hello';
    expect(data.value).toBeUndefined();
    loading.value = false;
    expect(loading.value).toBeTruthy();
    error.value = new Error('custom error');
    expect(error.value).toBeUndefined();
  });
});