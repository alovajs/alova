import {
  createAlova,
  useRequest,
  GlobalFetch,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { AlovaRequestAdapterConfig } from '../../../typings';
import { Result } from '../result.type';
import server, { untilCbCalled } from '../../server';


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
      onSuccess: response => {
        const jsonPromise = response.json();
        responseExpect && responseExpect(jsonPromise);
        return jsonPromise;
      },
      onError: err => {
        resErrorExpect && resErrorExpect(err);
      }
    }
  });
}

describe('use useRequet hook to send GET with vue', function() {
  test('init and send get request', async () => {
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
      onSuccess,
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    const rawData = await untilCbCalled(onSuccess);
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
  });

  test('send get with request error', async () => {
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
      onError
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    const err = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeInstanceOf(Error);
    expect(error.value).toBe(err);

    // 请求错误无缓存
    const cacheData = getResponseCache(alova.id, key(Get));
    expect(cacheData).toBeUndefined();
  });

  test('send get with responseCallback error', async () => {
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
      onError
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    const err = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeInstanceOf(Object);
    expect(error.value).toBe(err);
  });

  test('abort request when timeout', async () => {
    const alova = getInstance(undefined, undefined, error => {
      console.log('error timeout', error.message);
      expect(error.message).toMatch(/network timeout/);
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-10s', {  timeout: 500 });
    const {
      loading,
      data,
      error,
      onError
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    const err = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeInstanceOf(Object);
    expect(error.value).toBe(err);
  });

  test('manual abort request', async () => {
    const alova = getInstance(undefined, undefined, error => {
      console.log('manual abort', error.message);
      expect(error.message).toMatch(/user aborted a request/);
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-10s');
    const {
      loading,
      data,
      error,
      abort,
      onError
    } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
    setTimeout(abort, 100);

    const err = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeInstanceOf(Object);
    expect(error.value).toBe(err);
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
      onSuccess,
      onComplete
    } = useRequest((index: number) => getGetter(index), {
      immediate: false,
    });

    onSuccess((data, index) => {
      console.log('success passed params', index);
      expect(data.path).toBe('/unit-test');
      expect(index.toString()).toMatch(/3|5/);
    });
    onComplete(index => {
      console.log('complete passed params', index);
      expect(index.toString()).toMatch(/3|5/);
    });

    // 延迟一会儿发送请求
    await untilCbCalled(setTimeout, 500);
    let rawData = await send(3);
    expect(rawData.path).toBe('/unit-test');
    expect(rawData.params.index).toEqual('3');
    await untilCbCalled(setTimeout, 500); // 等待响应
    expect(data.value.params.index).toBe('3');
    
    rawData = await send(5);
    expect(rawData.params.index).toEqual('5');
    await untilCbCalled(setTimeout, 500); // 等待响应
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
      onError,
      onComplete
    } = useRequest((index: number) => getGetter(index), {
      immediate: false,
    });

    onError((err, index) => {
      console.log('error passed params', index);
      expect(err.message).toMatch(/404/);
      expect(index.toString()).toMatch(/3|5/);
    });
    onComplete(index => {
      expect(index.toString()).toMatch(/3|5/);
    });

    // 延迟一会儿发送请求
    await untilCbCalled(setTimeout, 500);
    try {
      const data = await send(3);
      expect(data.path).toBe('/unit-test');
      expect(data.params.index).toEqual('3');
    } catch (err: any) {
      expect(err.message).toMatch(/404/);
    }
  });

  test('shouldn\'t be changed when modify states', () => {
    const alova = getInstance();
    const Get = alova.Get('/unit-test');
    const {
      data,
      loading,
      error,
    } = useRequest(Get);

    console.log('测试vue状态是否可以修改，请忽略该警告');
    data.value = 'hello';
    expect(data.value).toBeUndefined();
    console.log('测试vue状态是否可以修改，请忽略该警告');
    loading.value = false;
    expect(loading.value).toBeTruthy();
    console.log('测试vue状态是否可以修改，请忽略该警告');
    error.value = new Error('custom error');
    expect(error.value).toBeUndefined();
  });
});