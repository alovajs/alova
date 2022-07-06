import {
  createAlova,
  useRequest,
  GlobalFetch,
  invalidateCache,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
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
    baseURL: 'http://localhost:3000/',
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

describe('invalitate cached response data', () => {
  test('It will use the default cache time when not set the cache time with `GET`', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result>('/unit-test', {
      transformData: data => data.data,
    });
    const firstState = useRequest(Get);
    await new Promise(resolve => firstState.responser.success(resolve));
    const cachedData = getResponseCache(alova.id, key(Get));
    expect(cachedData).toEqual({ path: '/unit-test', method: 'GET', params: {} });
  });

  test('the cached response data should be removed', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result>('/unit-test', {
      localCache: 100000,
      transformData: data => data.data,
    });
    const firstState = useRequest(Get);
    await new Promise(resolve => firstState.responser.success(resolve));
    let cachedData = getResponseCache(alova.id, key(Get));
    expect(cachedData).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    invalidateCache(Get);
    cachedData = getResponseCache(alova.id, key(Get));
    expect(cachedData).toBeUndefined();
  });
});