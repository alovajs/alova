import { getAlovaInstance } from '#/utils';
import { createAlova, Method, queryCache } from '@/index';
import adapterFetch from '@/predefine/adapterFetch';
import { delay, Result, untilReject } from 'root/testUtils';

const baseURL = process.env.NODE_BASE_URL as string;
describe('createAlova', () => {
  test('it can customize alova id', async () => {
    const alova1 = createAlova({
      requestAdapter: adapterFetch()
    });
    const alova2 = createAlova({
      id: 'alova-1',
      requestAdapter: adapterFetch()
    });
    expect(alova1.id).toBe('1');
    expect(alova2.id).toBe('alova-1');
  });

  test('baseURL can not be set and use complete url set in method to send request', async () => {
    const alova = createAlova({
      cacheLogger: null,
      requestAdapter: adapterFetch()
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
      cacheLogger: null,
      requestAdapter: adapterFetch()
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

  test('`cacheFor` can be set with null to disable all cache', async () => {
    const alova = getAlovaInstance({
      cacheFor: null
    });
    const Get = alova.Get<Response>('/unit-test');
    expect(Get.config.cacheFor).toBeUndefined();
    await Get;
    expect(Get.fromCache).toBeFalsy();

    const Post = alova.Post<Response>('/unit-test');
    expect(Post.config.cacheFor).toBeUndefined();
    await Post;
    expect(Post.fromCache).toBeFalsy();
  });

  test('`beforeRequest` hook will receive the request params', async () => {
    const mockFn = vi.fn();
    const alova = getAlovaInstance({
      beforeRequestExpect: method => {
        expect(method).toBeInstanceOf(Method);
        const { config } = method;
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
      cacheFor: 100 * 1000
    });
    await Get;
    expect(mockFn).toHaveBeenCalled();
  });

  test('should use the newest params to request modified in `beforeRequest` hook', async () => {
    const alova = createAlova({
      requestAdapter: adapterFetch(),
      beforeRequest: method => {
        method.url = '/unit-test';
        method.config.params = {
          a: 7,
          b: 8
        };
        method.config.headers = {
          newHeader: 123
        };
        method.baseURL = 'http://localhost:3000';
      },
      responded: r => r.json()
    });
    const Get = alova.Get<Result>('/unknown', {
      params: { a: 'a', b: 'str' },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await Get;
    expect(result).toStrictEqual({
      code: 200,
      msg: '',
      data: {
        path: '/unit-test',
        method: 'GET',
        params: { a: '7', b: '8' }
      }
    });
  });

  test('`beforeRequest` hook support async function', async () => {
    const alova = createAlova({
      baseURL: 'http://localhost:3000',
      cacheLogger: null,
      requestAdapter: adapterFetch(),
      beforeRequest: async method => {
        await delay(200);
        method.config.params = {
          a: 7,
          b: 8
        };
      },
      responded: r => r.json()
    });
    const Get = alova.Get<Result>('/unit-test');
    const { data } = await Get;
    expect(data).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '7',
        b: '8'
      }
    });
  });

  test('should promise reject when `beforeRequest` hook throws an error', async () => {
    const alova = createAlova({
      baseURL: 'http://localhost:3000',
      cacheLogger: null,
      requestAdapter: adapterFetch(),
      beforeRequest: method => {
        if (method.config.params.async) {
          return Promise.reject(new Error('reject in beforeRequest'));
        }
        throw new Error('error in beforeRequest');
      },
      responded: r => r.json()
    });
    const Get = (async = true) =>
      alova.Get<Result>('/unit-test', {
        params: { async }
      });

    // beforeRequest asynchronous function test
    await expect(Get()).rejects.toThrow('reject in beforeRequest');

    // beforeRequest synchronization function test
    await expect(Get(false)).rejects.toThrow('error in beforeRequest');
  });

  test('`responded-onSuccess` hook will receive the requesting method instance', async () => {
    const mockFn = vi.fn();
    const alova = getAlovaInstance({
      beforeRequestExpect: method => {
        expect(method).toBeInstanceOf(Method);
        method.meta = {
          a: 1,
          b: 2
        };
      },
      responseExpect: async (r, method) => {
        mockFn(method);
        return r.json();
      }
    });
    const Get = alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      cacheFor: 100 * 1000
    });
    await Get;
    expect(mockFn).toHaveBeenCalledTimes(1);
    const respondedMethod = mockFn.mock.calls[0][0];
    expect(respondedMethod).toBeInstanceOf(Method);
    expect(respondedMethod.meta).toStrictEqual({ a: 1, b: 2 });
  });

  test('You can also use `responded` to handle global response success event', async () => {
    const mockFn = vi.fn();
    const alova = createAlova({
      baseURL: 'http://localhost:3000',
      cacheLogger: null,
      requestAdapter: adapterFetch(),
      beforeRequest: method => {
        expect(method).toBeInstanceOf(Method);
        method.meta = {
          a: 1,
          b: 2
        };
      },
      responded: async (r, method) => {
        mockFn(method);
        return r.json();
      }
    });
    const Get = alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      cacheFor: 100 * 1000
    });
    await Get;
    expect(mockFn).toHaveBeenCalledTimes(1);
    const respondedMethod = mockFn.mock.calls[0][0];
    expect(respondedMethod).toBeInstanceOf(Method);
    expect(respondedMethod.meta).toStrictEqual({ a: 1, b: 2 });
  });

  test('`responded-onError` hook will receive the requesting method instance', async () => {
    const mockFn = vi.fn();
    const alova = getAlovaInstance({
      beforeRequestExpect: method => {
        method.meta = {
          a: 1,
          b: 2
        };
      },
      resErrorExpect: (error, method) => {
        mockFn(error, method);
      }
    });
    await alova.Get('/unit-test-error');
    expect(mockFn).toHaveBeenCalledTimes(1);
    const [error, errorMethod] = mockFn.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(errorMethod).toBeInstanceOf(Method);
    expect(errorMethod.meta).toEqual({ a: 1, b: 2 });
  });

  test('should throws an async error in `responded-onError` hook', async () => {
    const alova = getAlovaInstance({
      resErrorExpect: async () => {
        await new Promise(resolve => {
          setTimeout(resolve, 200);
        });
        throw new Error('async error');
      }
    });
    const Get = alova.Get('/unit-test-error');
    await expect(Get).rejects.toThrow('async error');
  });

  test('should abort request when time is exceeded the `timeout`', async () => {
    const alova = createAlova({
      baseURL,
      timeout: 10,
      requestAdapter: adapterFetch()
    });
    const Get = alova.Get('/unit-test-1s');
    const error = await untilReject(Get);
    expect(error.message).toBe('fetchError: network timeout');
  });

  test('should transform but not cache data when return data in `responded-onError` interceptor', async () => {
    const alova = getAlovaInstance({
      cacheFor: {
        GET: 500000
      },
      resErrorExpect: () => [1, 2, 3]
    });
    const Get = alova.Get('/unit-test-error', {
      transform: (arr: number[]) => arr.map(item => item * 2)
    });
    const arr = await Get;
    expect(arr).toStrictEqual([2, 4, 6]);
    expect(await queryCache(Get)).toBeUndefined();
  });

  test("shouldn't call global error callback when responded callback throws an error", async () => {
    const mockFn = vi.fn();
    const alova = getAlovaInstance({
      responseExpect: () => {
        throw new Error('test error from responded');
      },
      resErrorExpect: () => {
        mockFn();
      }
    });

    const Get = alova.Get('/unit-test');
    const error = await untilReject(Get);
    expect(error.message).toBe('test error from responded');
    expect(mockFn).not.toHaveBeenCalled();
  });

  test("shouldn't emit global error callback when responded callback return rejected Promise", async () => {
    const mockFn = vi.fn();
    const alova = getAlovaInstance({
      responseExpect: () => Promise.reject(new Error('test error from responded')),
      resErrorExpect: () => {
        mockFn();
      }
    });

    const Get = alova.Get('/unit-test', {
      transform(result: Result) {
        return result.data;
      }
    });
    const error = await untilReject(Get);
    expect(error.message).toBe('test error from responded');
    expect(mockFn).not.toHaveBeenCalled();
  });

  test('should emit global onError when request error', async () => {
    const mockFn = vi.fn();
    const alova = getAlovaInstance({
      responseExpect: () => {
        mockFn();
      },
      resErrorExpect: error => {
        expect(error.message).toMatch('Failed to fetch');
        throw new Error('onError called');
      }
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-error', {
      cacheFor: {
        expire: 100 * 1000
      }
    });
    await expect(Get).rejects.toThrow('onError called');
    expect(mockFn).not.toHaveBeenCalled();
  });

  test('`responded-onComplete` hook will receive the requesting method instance', async () => {
    const mockFn = vi.fn();
    const alova = getAlovaInstance({
      beforeRequestExpect: method => {
        method.meta = {
          a: 1,
          b: 2
        };
      },
      resCompleteExpect: method => {
        mockFn(method);
      }
    });
    const Get = alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      headers: {
        'Content-Type': 'application/json'
      },
      cacheFor: 100 * 1000
    });
    await Get;
    expect(mockFn).toHaveBeenCalled();
    const completeMethod = mockFn.mock.calls[0][0];
    expect(completeMethod).toBeInstanceOf(Method);
    expect(completeMethod.meta).toStrictEqual({ a: 1, b: 2 });
  });

  test('should emit onComplete when hit response cache', async () => {
    const MockFn = vi.fn();
    const alova = createAlova({
      baseURL,
      requestAdapter: adapterFetch(),
      cacheLogger: null,
      responded: {
        onComplete: method => {
          expect(method).toBeInstanceOf(Method);
          MockFn();
        }
      }
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: 1000 * 100
    });

    await Get;
    await Get;
    await Get;
    expect(MockFn).toHaveBeenCalledTimes(3);
  });

  test('should throws an async error in `responded-onComplete` hook', async () => {
    const mockFn = vi.fn();
    const alova = getAlovaInstance({
      resErrorExpect: () => 'error response',
      resCompleteExpect: () => {
        mockFn();
      }
    });
    const res = await alova.Get('/unit-test-error').send();
    expect(res).toBe('error response');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('should print cache hit message default when hit response cache', async () => {
    const logConsoleMockFn = vi.spyOn(console, 'log').mockImplementation(() => {});
    const groupCollapsedMockFn = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});
    const groupEndMockFn = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
    const alova1 = createAlova({
      baseURL,
      requestAdapter: adapterFetch(),
      responded: r => r.json()
    });

    const getter1 = alova1.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    // Request twice to hit the cache once
    await getter1;
    await getter1;
    expect(groupCollapsedMockFn).toHaveBeenCalledTimes(1);
    expect(groupEndMockFn).toHaveBeenCalledTimes(1);
    expect(logConsoleMockFn).toHaveBeenCalledTimes(3); // Each cache will call console.log 3 times
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
      cacheFor: {
        mode: 'restore',
        expire: 200000,
        tag: 'v1'
      },
      transform: ({ data }: Result) => data
    });
    // Request cached data once
    await getter2;
    await getter2;
    expect(groupCollapsedMockFn).toHaveBeenCalledTimes(2);
    expect(groupEndMockFn).toHaveBeenCalledTimes(2);
    expect(logConsoleMockFn).toHaveBeenCalledTimes(7); // Restore cache will also print tag
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

    // Will be printed in another way when console.groupCollapsed is empty
    (console as any).groupCollapsed = (console as any).groupEnd = undefined;
    await getter2;
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
    logConsoleMockFn.mockRestore();
    groupCollapsedMockFn.mockRestore();
    groupEndMockFn.mockRestore();
  });

  test("shouldn't print cache hit message when set cacheLogger to false or null", async () => {
    const logConsoleMockFn = vi.fn();
    // Eslint disable next line
    console.log = logConsoleMockFn; // Rewrite for monitoring
    const alova1 = createAlova({
      baseURL,
      requestAdapter: adapterFetch(),
      responded: r => r.json(),
      cacheLogger: false
    });

    const getter1 = alova1.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    // Request cache data twice to hit the cache once
    await getter1;
    await getter1;
    expect(logConsoleMockFn).toHaveBeenCalledTimes(0);

    const alova2 = createAlova({
      baseURL,
      requestAdapter: adapterFetch(),
      responded: r => r.json(),
      cacheLogger: null
    });
    const getter2 = alova2.Get('/unit-test', {
      params: { restore: '1' },
      cacheFor: {
        mode: 'restore',
        expire: 200000,
        tag: 'v1'
      },
      transform: ({ data }: Result) => data
    });
    // Request cache data twice to hit the cache once
    await getter2;
    await getter2;
    expect(logConsoleMockFn).toHaveBeenCalledTimes(0);
  });

  test('should emit custom cacheLogger function when set cacheLogger to a custom function', async () => {
    const loggerMockFn = vi.fn();
    const alova1 = createAlova({
      baseURL,
      requestAdapter: adapterFetch(),
      responded: r => r.json(),
      cacheLogger(response, methodInstance, mode, tag) {
        loggerMockFn(response, methodInstance, mode, tag);
      }
    });

    const getter1 = alova1.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    // Request cache data twice to hit the cache once
    await getter1;
    await getter1;
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
      cacheFor: {
        mode: 'restore',
        expire: 200000,
        tag: 'v1'
      },
      transform: ({ data }: Result) => data
    });
    // Request cached data once
    // Request cache data twice to hit the cache once
    await getter2;
    await getter2;
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
