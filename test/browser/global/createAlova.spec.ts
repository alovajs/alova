import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { createAlova, Method, useRequest } from '@/index';
import GlobalFetch from '@/predefine/GlobalFetch';
import VueHook from '@/predefine/VueHook';

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
    expect(mockFn).toBeCalled();
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

  test('`beforeRequest` hook support async function', async () => {
    const alova = createAlova({
      baseURL: 'http://localhost:3000',
      statesHook: VueHook,
      requestAdapter: GlobalFetch(),
      beforeRequest: async () => {
        throw new Error('error in beforeRequest');
      },
      responded: r => r.json()
    });
    const Get = alova.Get<Result>('/unit-test');

    const { onError } = useRequest(Get);
    const errEvent = await untilCbCalled(onError);
    expect(errEvent.error.message).toBe('error in beforeRequest');
    await expect(Get.send()).rejects.toThrow('error in beforeRequest');
  });

  test('`responsed-onSuccess` hook will receive the method param', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        expect(method).toBeInstanceOf(Method);
        method.extra = {
          a: 1,
          b: 2
        };
      },
      responseExpect: async (r, method) => {
        const result = await r.json();
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({ a: 'a', b: 'str' });
        expect(method.extra).toEqual({ a: 1, b: 2 });
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
        method.extra = {
          a: 1,
          b: 2
        };
      },
      responded: async (r, method) => {
        const result = await r.json();
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({ a: 'a', b: 'str' });
        expect(method.extra).toEqual({ a: 1, b: 2 });
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

  test('`responsed-onError` hook will receive the method param', async () => {
    const mockFn = jest.fn();
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: method => {
        method.extra = {
          a: 1,
          b: 2
        };
      },
      resErrorExpect: (error, method) => {
        expect(error).not.toBeUndefined();
        expect(method.extra).toEqual({ a: 1, b: 2 });
        mockFn();
      }
    });
    const Get = alova.Get('/unit-test-error');
    await Get.send();
    expect(mockFn).toBeCalled();
  });

  test('should throw async error in `responsed-onError` hook', async () => {
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

  test("shouldn't global error cb when responsed cb throw Error", async () => {
    const mockFn = jest.fn();
    const alova = getAlovaInstance(VueHook, {
      responseExpect: async () => {
        throw new Error('test error from responsed');
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
    const { onError } = useRequest(Get);
    await untilCbCalled(onError);
    expect(mockFn.mock.calls.length).toBe(0);
  });

  test("shouldn't emit global error cb when responsed cb return rejected Promise", async () => {
    const mockFn = jest.fn();
    const alova = getAlovaInstance(VueHook, {
      responseExpect: async () => {
        return Promise.reject(new Error('test error from responsed'));
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
    const { onError } = useRequest(Get);
    await untilCbCalled(onError);
    expect(mockFn.mock.calls.length).toBe(0);
  });

  test("shouldn't emit responsed instead onError when request error", async () => {
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
    expect(mockFn).not.toBeCalled();
  });
});
