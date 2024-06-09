import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { createAlova, Method, queryCache, useRequest } from '@/index';
import GlobalFetch from '@/predefine/GlobalFetch';
import VueHook from '@/predefine/VueHook';
import { baseURL } from '~/test/mockServer';

describe('createAlova', function () {
  test('baseURL can not be set and use complete url set in method to send request', async () => {
    const alova = createAlova({
      statesHook: VueHook,
      requestAdapter: GlobalFetch()
    });
    const response = await alova.Get<Response>('http://localhost:3000/unit-test').send();
    const result = await response.json();
    expect(result).toStrictEqual({
      code: 200,
      msg: '',
      data: {
        path: '/unit-test',
        method: 'GET',
        params: {}
      }
    });
  });

  test('baseURL can be set a url that contains params', async () => {
    const alova = createAlova({
      baseURL: 'http://localhost:3000/unit-test?ctrl=api/',
      statesHook: VueHook,
      requestAdapter: GlobalFetch()
    });
    const response = await alova
      .Get<Response>('/unit-test', {
        params: {
          aa: 2
        }
      })
      .send();
    const result = await response.json();
    expect(result).toStrictEqual({
      code: 200,
      msg: '',
      data: {
        path: '/unit-test',
        method: 'GET',
        params: {
          ctrl: 'api/unit-test',
          aa: '2'
        }
      }
    });
  });

  test('localCache can be set with null to disable all cache', async () => {
    const alova = getAlovaInstance(VueHook, {
      localCache: null
    });
    const Get = alova.Get<Response>('/unit-test');
    expect(Get.config.localCache).toBeUndefined();

    const { onSuccess } = useRequest(Get);
    const ev1 = await untilCbCalled(onSuccess);
    expect(ev1.fromCache).toBeFalsy();

    const { onSuccess: onSuccess2 } = useRequest(Get);
    const ev2 = await untilCbCalled(onSuccess2);
    expect(ev2.fromCache).toBeFalsy();
  });

  test('`beforeRequest` hook will receive the request params', async () => {
    const mockFn = jest.fn();
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        expect(method).toBeInstanceOf(Method);
        const config = method.config;
        expect(method.url).toBe('/unit-test');
        expect(config.params).toEqual({ a: 'a', b: 'str' });
        expect(config.headers).toEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
        mockFn();
      }
    });
    const Get = alova.Get<Result>('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      localCache: 100 * 1000
    });
    await Get.send();
    expect(mockFn).toHaveBeenCalled();
  });

  test('`beforeRequest` hook support async function', async () => {
    const alova = createAlova({
      baseURL: 'http://localhost:3000',
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      beforeRequest: async method => {
        await new Promise(resolve => {
          setTimeout(resolve, 200);
        });
        method.config.params = {
          a: 7,
          b: 8
        };
      },
      responded: r => r.json()
    });
    const Get = alova.Get<Result>('/unit-test');
    const { data } = await Get.send();
    expect(data).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '7',
        b: '8'
      }
    });
  });

  test('should emit onError when `beforeRequest` hook throws a error', async () => {
    const alova = createAlova({
      baseURL: 'http://localhost:3000',
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      beforeRequest: method => {
        if (method.config.params.async) {
          return Promise.reject(new Error('reject in beforeRequest'));
        }
        throw new Error('error in beforeRequest');
      },
      errorLogger: false,
      responded: r => r.json()
    });
    const Get = (async = true) =>
      alova.Get<Result>('/unit-test', {
        params: { async }
      });

    // beforeRequest异步函数测试
    const { onError } = useRequest(Get);
    const errEvent = await untilCbCalled(onError);
    expect(errEvent.error.message).toBe('reject in beforeRequest');
    await expect(Get().send()).rejects.toThrow('reject in beforeRequest');

    // beforeRequest同步函数测试
    const { onError: onError2 } = useRequest(Get(false));
    const errEvent2 = await untilCbCalled(onError2);
    expect(errEvent2.error.message).toBe('error in beforeRequest');
    await expect(Get(false).send()).rejects.toThrow('error in beforeRequest');
  });

  test('`responded-onSuccess` hook will receive the method param', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        expect(method).toBeInstanceOf(Method);
        method.meta = {
          a: 1,
          b: 2
        };
      },
      responseExpect: async (r, method) => {
        const result = await r.json();
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({ a: 'a', b: 'str' });
        expect(method.meta).toEqual({ a: 1, b: 2 });
      }
    });
    const Get = alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      localCache: 100 * 1000
    });
    await Get.send();
  });

  test('You can also use `responded` to handle global response event', async () => {
    const alova = createAlova({
      baseURL: 'http://localhost:3000',
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      beforeRequest: method => {
        expect(method).toBeInstanceOf(Method);
        method.meta = {
          a: 1,
          b: 2
        };
      },
      responded: async (r, method) => {
        const result = await r.json();
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({ a: 'a', b: 'str' });
        expect(method.meta).toEqual({ a: 1, b: 2 });
      }
    });
    const Get = alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      localCache: 100 * 1000
    });
    await Get.send();
  });

  test('`responded-onError` hook will receive the method param', async () => {
    const mockFn = jest.fn();
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        method.meta = {
          a: 1,
          b: 2
        };
      },
      resErrorExpect: (error, method) => {
        expect(error).not.toBeUndefined();
        expect(method.meta).toEqual({ a: 1, b: 2 });
        mockFn();
      }
    });
    const Get = alova.Get('/unit-test-error');
    await Get.send();
    expect(mockFn).toHaveBeenCalled();
  });

  test('should throws an async error in `responded-onError` hook', async () => {
    const alova = getAlovaInstance(VueHook, {
      resErrorExpect: async () => {
        await new Promise(resolve => {
          setTimeout(resolve, 200);
        });
        throw new Error('async error');
      }
    });
    const Get = alova.Get('/unit-test-error');
    await expect(Get.send()).rejects.toThrow('async error');
  });

  test('should transformData but not cache data when return data in `responded-onError` interceptor', async () => {
    const alova = getAlovaInstance(VueHook, {
      localCache: {
        GET: 500000
      },
      resErrorExpect: () => {
        return [1, 2, 3];
      }
    });
    const Get = alova.Get('/unit-test-error', {
      transformData: (arr: number[]) => arr.map(item => item * 2)
    });
    const arr = await Get.send();
    expect(arr).toStrictEqual([2, 4, 6]);
    expect(queryCache(Get)).toBeUndefined();
  });

  test("shouldn't call global error callback when responded callback throws an error", async () => {
    const mockFn = jest.fn();
    const alova = getAlovaInstance(VueHook, {
      responseExpect: () => {
        throw new Error('test error from responded');
      },
      resErrorExpect: () => {
        mockFn();
      }
    });

    const Get = alova.Get('/unit-test', {
      transformData(result: Result) {
        return result.data;
      }
    });
    const { onError, error } = useRequest(Get);
    await untilCbCalled(onError);
    expect(mockFn).not.toHaveBeenCalled();
    expect(error.value?.message).toBe('test error from responded');
  });

  test("shouldn't emit global error cb when responded cb return rejected Promise", async () => {
    const mockFn = jest.fn();
    const alova = getAlovaInstance(VueHook, {
      responseExpect: () => {
        return Promise.reject(new Error('test error from responded'));
      },
      resErrorExpect: () => {
        mockFn();
      }
    });

    const Get = alova.Get('/unit-test', {
      transformData(result: Result) {
        return result.data;
      }
    });
    const { onError, error } = useRequest(Get);
    await untilCbCalled(onError);
    expect(error.value?.message).toBe('test error from responded');
    expect(mockFn).not.toHaveBeenCalled();
  });

  test("shouldn't emit responded instead of onError when request error", async () => {
    const mockFn = jest.fn();
    const alova = getAlovaInstance(VueHook, {
      responseExpect: () => {
        mockFn();
      },
      resErrorExpect: error => {
        expect(error.message).toMatch('reason: server error');
        throw new Error('onError called');
      }
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-error', {
      localCache: {
        expire: 100 * 1000
      }
    });
    await expect(Get.send()).rejects.toThrow('onError called');
    expect(mockFn).not.toHaveBeenCalled();
  });

  test('should print error message by `console.error` by default when get a error in useHooks', async () => {
    const errorConsoleMockFn = jest.fn();
    console.error = errorConsoleMockFn; // 重写以便监听
    const alova1 = createAlova({
      baseURL,
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      responded: r => r.json()
    });

    const state1 = useRequest(alova1.Get<string, Result<string>>('/unit-test-error'));
    await untilCbCalled(state1.onError);
    expect(errorConsoleMockFn).toHaveBeenCalledTimes(1);

    const state2 = useRequest(
      alova1.Get<string, Result<string>>('/unit-test', {
        transformData: () => {
          throw new Error('error in transform data');
        }
      })
    );
    await untilCbCalled(state2.onError);
    expect(errorConsoleMockFn).toHaveBeenCalledTimes(2);

    const state3 = useRequest(
      alova1.Get<string, Result<string>>('/unit-test', {
        localCache() {
          throw new Error('error in custom localCache');
        }
      })
    );
    await untilCbCalled(state3.onError);
    expect(errorConsoleMockFn).toHaveBeenCalledTimes(3);
  });

  test('`responded-onComplete` hook will receive the method param', async () => {
    const mockFn = jest.fn();
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        method.meta = {
          a: 1,
          b: 2
        };
      },
      resCompleteExpect: method => {
        expect(method.meta).toEqual({ a: 1, b: 2 });
        mockFn();
      }
    });
    const Get = alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      localCache: 100 * 1000
    });
    await Get.send();
    expect(mockFn).toHaveBeenCalled();
  });

  test('should emit onComplete when `beforeRequest` hook throws a error', async () => {
    const alova = createAlova({
      baseURL: 'http://localhost:3000',
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      beforeRequest: method => {
        if (method.config.params.async) {
          return Promise.reject(new Error('reject in beforeRequest'));
        }
        throw new Error('error in beforeRequest');
      },
      errorLogger: false,
      responded: r => r.json()
    });
    const Get = (async = true) =>
      alova.Get<Result>('/unit-test', {
        params: { async }
      });

    // beforeRequest异步函数测试
    const { onComplete } = useRequest(Get);
    const completeEvent = await untilCbCalled(onComplete);
    expect(completeEvent.error.message).toBe('reject in beforeRequest');
    await expect(Get().send()).rejects.toThrow('reject in beforeRequest');

    // beforeRequest同步函数测试
    const { onComplete: onComplete2 } = useRequest(Get(false));
    const completeEvent2 = await untilCbCalled(onComplete2);
    expect(completeEvent2.error.message).toBe('error in beforeRequest');
    await expect(Get(false).send()).rejects.toThrow('error in beforeRequest');
  });

  test('should emit onComplete when hit response cache', async () => {
    const MockFn = jest.fn();
    const alova = createAlova({
      baseURL,
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      responded: {
        onComplete: method => {
          expect(method).toBeInstanceOf(Method);
          MockFn();
        }
      }
    });
    const Get = alova.Get('/unit-test', {
      localCache: 1000 * 100
    });

    await Get.send();
    await Get.send();
    await Get.send();
    expect(MockFn).toHaveBeenCalledTimes(3);
  });

  test('should throws an async error in `responded-onComplete` hook', async () => {
    const mockFn = jest.fn();
    const alova = getAlovaInstance(VueHook, {
      resErrorExpect: () => {
        return 'error response';
      },
      resCompleteExpect: () => {
        mockFn();
      }
    });
    const res = await alova.Get('/unit-test-error').send();
    expect(res).toBe('error response');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test("shouldn't print error message when set errorLogger to false", async () => {
    const errorConsoleMockFn = jest.fn();
    console.error = errorConsoleMockFn;
    const alova = createAlova({
      baseURL,
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      responded: r => r.json(),
      errorLogger: false
    });

    const state1 = useRequest(alova.Get<string, Result<string>>('/unit-test-error'));
    await untilCbCalled(state1.onError);
    expect(errorConsoleMockFn).not.toHaveBeenCalled();

    const state2 = useRequest(
      alova.Get<string, Result<string>>('/unit-test', {
        transformData: () => {
          throw new Error('error in transform data');
        }
      })
    );
    await untilCbCalled(state2.onError);
    expect(errorConsoleMockFn).not.toHaveBeenCalled();

    const state3 = useRequest(
      alova.Get<string, Result<string>>('/unit-test', {
        localCache() {
          throw new Error('error in custom localCache');
        }
      })
    );
    await untilCbCalled(state3.onError);
    expect(errorConsoleMockFn).not.toHaveBeenCalled();
  });

  test('should emit custom errorLogger function  when set errorLogger to a custom function', async () => {
    const errorConsoleMockFn = jest.fn();
    console.error = errorConsoleMockFn;
    const customLoggerMockFn = jest.fn();
    const alova = createAlova({
      baseURL,
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      responded: r => r.json(),
      errorLogger(error, methodInstance) {
        customLoggerMockFn();
        expect(error).toBeInstanceOf(Error);
        expect(methodInstance).toBeInstanceOf(Method);
      }
    });

    const state1 = useRequest(alova.Get<string, Result<string>>('/unit-test-error'));
    await untilCbCalled(state1.onError);
    expect(errorConsoleMockFn).not.toHaveBeenCalled();
    expect(customLoggerMockFn).toHaveBeenCalledTimes(1);

    const state2 = useRequest(
      alova.Get<string, Result<string>>('/unit-test', {
        transformData: () => {
          throw new Error('error in transform data');
        }
      })
    );
    await untilCbCalled(state2.onError);
    expect(errorConsoleMockFn).not.toHaveBeenCalled();
    expect(customLoggerMockFn).toHaveBeenCalledTimes(2);

    const state3 = useRequest(
      alova.Get<string, Result<string>>('/unit-test', {
        localCache() {
          throw new Error('error in custom localCache');
        }
      })
    );
    await untilCbCalled(state3.onError);
    expect(errorConsoleMockFn).not.toHaveBeenCalled();
    expect(customLoggerMockFn).toHaveBeenCalledTimes(3);
  });

  const groupCollapsed = console.groupCollapsed;
  const groupEnd = console.groupEnd;
  test('should print cache hit message defaultly when hit response cache', async () => {
    const logConsoleMockFn = jest.fn();
    console.log = logConsoleMockFn; // 重写以便监听
    const alova1 = createAlova({
      baseURL,
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      responded: r => r.json()
    });

    const getter1 = alova1.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    // 请求一次缓存数据
    const state1 = useRequest(getter1);
    await untilCbCalled(state1.onSuccess);

    const state2 = useRequest(getter1);
    await untilCbCalled(state2.onSuccess);
    expect(logConsoleMockFn).toHaveBeenCalledTimes(3); // 每次缓存会调用3次console.log
    const calls1 = logConsoleMockFn.mock.calls.slice(0);
    expect(calls1[0][0]).toBe('%c[Cache]');
    expect(calls1[0][2]).toStrictEqual({
      method: 'GET',
      params: {},
      path: '/unit-test'
    });
    expect(calls1[1][0]).toBe('%c[Mode]');
    expect(calls1[1][2]).toBe('memory');
    expect(calls1[2][0]).toBe('%c[Method]');
    expect(calls1[2][2]).toBeInstanceOf(Method);

    const getter2 = alova1.Get('/unit-test', {
      params: { restore: '1' },
      localCache: {
        mode: 'restore',
        expire: 200000,
        tag: 'v1'
      },
      transformData: ({ data }: Result) => data
    });
    // 请求一次缓存数据
    const state3 = useRequest(getter2);
    await untilCbCalled(state3.onSuccess);
    const state4 = useRequest(getter2);
    await untilCbCalled(state4.onSuccess);
    expect(logConsoleMockFn).toHaveBeenCalledTimes(7); // restore缓存还会打印tag
    const calls2 = logConsoleMockFn.mock.calls.slice(3);
    expect(calls2[0][0]).toBe('%c[Cache]');
    expect(calls2[0][2]).toStrictEqual({
      method: 'GET',
      params: {
        restore: '1'
      },
      path: '/unit-test'
    });
    expect(calls2[1][0]).toBe('%c[Mode]');
    expect(calls2[1][2]).toBe('restore');
    expect(calls2[2][0]).toBe('%c[Tag]');
    expect(calls2[2][2]).toBe('v1');
    expect(calls2[3][0]).toBe('%c[Method]');
    expect(calls2[3][2]).toBeInstanceOf(Method);

    // 当console.groupCollapsed为空时将以另一种形式打印
    (console as any).groupCollapsed = (console as any).groupEnd = undefined;
    const state5 = useRequest(getter2);
    await untilCbCalled(state5.onSuccess);
    expect(logConsoleMockFn).toHaveBeenCalledTimes(13);
    const calls3 = logConsoleMockFn.mock.calls.slice(7);
    const startSep = ` [HitCache]${getter2.url} `;
    expect(calls3[0][1]).toBe(startSep);
    expect(calls3[1][0]).toBe('%c[Cache]');
    expect(calls3[1][2]).toStrictEqual({
      method: 'GET',
      params: {
        restore: '1'
      },
      path: '/unit-test'
    });
    expect(calls3[2][0]).toBe('%c[Mode]');
    expect(calls3[2][2]).toBe('restore');
    expect(calls3[3][0]).toBe('%c[Tag]');
    expect(calls3[3][2]).toBe('v1');
    expect(calls3[4][0]).toBe('%c[Method]');
    expect(calls3[4][2]).toBeInstanceOf(Method);
    expect(calls3[5][1]).toBe(Array(startSep.length + 1).join('^'));
    console.groupCollapsed = groupCollapsed;
    console.groupEnd = groupEnd;
  });

  test("shouldn't print cache hit message when set cacheLogger to false or null", async () => {
    const logConsoleMockFn = jest.fn();
    console.log = logConsoleMockFn; // 重写以便监听
    const alova1 = createAlova({
      baseURL,
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      responded: r => r.json(),
      cacheLogger: false
    });

    const getter1 = alova1.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    // 请求一次缓存数据
    const state1 = useRequest(getter1);
    await untilCbCalled(state1.onSuccess);
    const state2 = useRequest(getter1);
    await untilCbCalled(state2.onSuccess);
    expect(logConsoleMockFn).toHaveBeenCalledTimes(0);

    const alova2 = createAlova({
      baseURL,
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      responded: r => r.json(),
      cacheLogger: null
    });
    const getter2 = alova2.Get('/unit-test', {
      params: { restore: '1' },
      localCache: {
        mode: 'restore',
        expire: 200000,
        tag: 'v1'
      },
      transformData: ({ data }: Result) => data
    });
    // 请求一次缓存数据
    const state3 = useRequest(getter2);
    await untilCbCalled(state3.onSuccess);
    const state4 = useRequest(getter2);
    await untilCbCalled(state4.onSuccess);
    expect(logConsoleMockFn).toHaveBeenCalledTimes(0);
  });

  test('should emit custom cacheLogger function when set cacheLogger to a custom function', async () => {
    const loggerMockFn = jest.fn();
    const alova1 = createAlova({
      baseURL,
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      responded: r => r.json(),
      cacheLogger(response, methodInstance, mode, tag) {
        loggerMockFn(response, methodInstance, mode, tag);
      }
    });

    const getter1 = alova1.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    // 请求一次缓存数据
    const state1 = useRequest(getter1);
    await untilCbCalled(state1.onSuccess);
    const state2 = useRequest(getter1);
    await untilCbCalled(state2.onSuccess);
    expect(loggerMockFn).toHaveBeenCalledTimes(1);
    const calls1 = loggerMockFn.mock.calls[0];
    expect(calls1[3]).toBeUndefined();
    expect(calls1[2]).toBe('memory');
    expect(calls1[1]).toBeInstanceOf(Method);
    expect(calls1[0]).toStrictEqual({
      method: 'GET',
      params: {},
      path: '/unit-test'
    });

    const getter2 = alova1.Get('/unit-test', {
      params: { restore: '1' },
      localCache: {
        mode: 'restore',
        expire: 200000,
        tag: 'v1'
      },
      transformData: ({ data }: Result) => data
    });
    // 请求一次缓存数据
    const state3 = useRequest(getter2);
    await untilCbCalled(state3.onSuccess);
    const state4 = useRequest(getter2);
    await untilCbCalled(state4.onSuccess);
    expect(loggerMockFn).toHaveBeenCalledTimes(2);
    const calls2 = loggerMockFn.mock.calls[1];
    expect(calls2[3]).toBe('v1');
    expect(calls2[2]).toBe('restore');
    expect(calls2[1]).toBeInstanceOf(Method);
    expect(calls2[0]).toStrictEqual({
      method: 'GET',
      params: {
        restore: '1'
      },
      path: '/unit-test'
    });
  });
});
