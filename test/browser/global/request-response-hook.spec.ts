import {
  useRequest,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { Result } from '../result.type';
import { mockServer, getAlovaInstance } from '../../utils';


beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('request response hook', function() {
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
        'Content-Type': 'application/json',
      },
      localCache: 100 * 1000,
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
      responseExpect: async (jsonPromise, config) => {
        const result = await jsonPromise;
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({ a: 'a', b: 'str' });
        expect(config.extra).toEqual({ a: 1, b: 2 });
      }
    });
    alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      localCache: 100 * 1000,
    });
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
    alova.Get('/unit-test-404');
  });
});