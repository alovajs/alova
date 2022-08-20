import {
  createAlova,
  useRequest,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import GlobalFetch from '../../../src/predefine/GlobalFetch';
import { AlovaRequestAdapterConfig } from '../../../typings';
import { Result } from '../result.type';
import server from '../../server';


beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
type AdapterConfig = AlovaRequestAdapterConfig<any, any, RequestInit, Headers>;
function getInstance(
  beforeRequestExpect?: (config: AdapterConfig) => void,
  responseExpect?: (jsonPromise: Promise<any>, config: AdapterConfig) => void,
  resErrorExpect?: (err: Error, config: AdapterConfig) => void,
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
      onSuccess: (response, config) => {
        const jsonPromise = response.json();
        responseExpect && responseExpect(jsonPromise, config);
        return jsonPromise;
      },
      onError: (err, config) => {
        resErrorExpect && resErrorExpect(err, config);
      }
    }
  });
}

describe('request response hook', function() {
  test('`beforeRequest` hook will receive the request params', async () => {
    const alova = getInstance(
      config => {
        expect(config.url).toBe('/unit-test');
        expect(config.params).toEqual({ a: 'a', b: 'str' });
        expect(config.headers).toEqual({
          'Content-Type': 'application/json'
        });
        expect(config.timeout).toBe(10000);
      },
    );
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
    const alova = getInstance(
      config => {
        config.extra = {
          a: 1,
          b: 2
        };
      },
      async (jsonPromise, config) => {
        const result = await jsonPromise;
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({ a: 'a', b: 'str' });
        expect(config.extra).toEqual({ a: 1, b: 2 });
      }
    );
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
    const alova = getInstance(
      config => {
        config.extra = {
          a: 1,
          b: 2
        };
      },
      undefined,
      async (error, config) => {
        expect(error).not.toBeUndefined();
        expect(config.extra).toEqual({ a: 1, b: 2 });
      }
    );
    alova.Get('/unit-test-404');
  });
});