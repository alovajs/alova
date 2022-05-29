import {
  createAlova,
  VueHook,
  GlobalFetch,
  useController,
} from '../../../src';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { RequestConfig } from '../../../typings';
import { GetData, Result } from '../result.type';
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
    storage: localStorage,
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

describe('use useController hook to send GET with vue', function() {
  it('should send request after call function send', done => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result>('/unit-test?firstArg=arg', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      transformData(result, _) {
        expect(result.code).toBe(200);
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({
          firstArg: 'arg',
          a: 'a',
          b: 'str'
        });
        return result.data;
      },
      staleTime: 100 * 1000,
    });
    const {
      loading,
      data,
      progress,
      error,
      send,
      onSuccess,
    } = useController(Get);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(progress.value).toBe(0);
    expect(error.value).toBeUndefined();
    send();
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(progress.value).toBe(0);
    expect(error.value).toBeUndefined();
    onSuccess(() => {
      try {
        expect(loading.value).toBeFalsy();
        expect(data.value.path).toBe('/unit-test');
        expect(data.value.params).toEqual({ firstArg: 'arg', a: 'a', b: 'str' });
        expect(progress.value).toBe(0);
        expect(error.value).toBeUndefined();
        // 缓存有值
        const cacheData = getResponseCache(alova.id, 'http://localhost:3000', key(Get));
        expect(cacheData.path).toBe('/unit-test');
        expect(cacheData.params).toEqual({ firstArg: 'arg', a: 'a', b: 'str' });
      } catch (error) {}
      done();
    });
  });
});