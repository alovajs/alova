import {
  createAlova,
  VueHook,
  useRequest,
  GlobalFetch,
  invalidate,
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

describe('invalitate cached response data', function() {
  test('the cached response data should be removed', done => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result>('/unit-test', {
      staleTime: 100000,
      transformData: data => data.data,
    });
    const firstState = useRequest(Get);
    firstState.onSuccess(() => {
      let cachedData = getResponseCache(alova.id, alova.options.baseURL, key(Get));
      expect(cachedData).toEqual({ path: '/unit-test', method: 'GET', params: {} });
      invalidate(Get);
      cachedData = getResponseCache(alova.id, alova.options.baseURL, key(Get));
      expect(cachedData).toBeUndefined();
      done();
    });
  });
});