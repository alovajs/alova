import {
  createAlova,
  GlobalFetch,
  set,
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

describe('manual set cache response data', function() {
  test('the cache response data should be saved', () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result>('/unit-test', {
      staleTime: 100000,
      transformData: data => data.data,
    });
    set(Get, {
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '1'
      },
    });
    expect(getResponseCache(alova.id, key(Get))).toEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        manual: '1'
      },
    });
  });
});