import { useRequest } from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getAlovaInstance, mockServer, untilCbCalled } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('request response hook', function () {
  test('`beforeRequest` hook will receive the request params', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: config => {
        expect(config.url).toBe('/unit-test');
        expect(config.params).toEqual({ a: 'a', b: 'str' });
        expect(config.headers).toEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
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
    useRequest(Get);
  });

  test('`responsed-onSuccess` hook will receive the config param', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: config => {
        config.extra = {
          a: 1,
          b: 2
        };
      },
      responseExpect: async (r, config) => {
        const result = await r.json();
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({ a: 'a', b: 'str' });
        expect(config.extra).toEqual({ a: 1, b: 2 });
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
    useRequest(Get);
  });

  test('`responsed-onError` hook will receive the config param', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect: config => {
        config.extra = {
          a: 1,
          b: 2
        };
      },
      resErrorExpect: async (error, config) => {
        expect(error).not.toBeUndefined();
        expect(config.extra).toEqual({ a: 1, b: 2 });
      }
    });
    const Get = alova.Get('/unit-test-404');
    useRequest(Get);
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
      transformData(result: Result, _) {
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
      transformData(result: Result, _) {
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
      }
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-error', {
      localCache: {
        expire: 100 * 1000
      }
    });
    const firstState = useRequest(Get);
    await untilCbCalled(firstState.onSuccess);
    expect(mockFn.mock.calls.length).toBe(0);
  });
});
