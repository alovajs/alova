import {
  createAlova,
  GlobalFetch,
  useRequest,
} from '../../../src';
import SvelteHook from '../../../src/predefine/SvelteHook';
import server from '../../server';
import { Result } from '../result.type';
import { AlovaRequestAdapterConfig } from '../../../typings';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
function getInstance(
  beforeRequestExpect?: (config: AlovaRequestAdapterConfig<any, any, RequestInit, Headers>) => void,
  responseExpect?: (jsonPromise: Promise<any>) => void,
  resErrorExpect?: (err: Error) => void,
) {
  return createAlova({
    baseURL: 'http://localhost:3000',
    timeout: 3000,
    statesHook: SvelteHook,
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

describe('parallel request', function() {
  test('should send all requests in the same time', () => {
    const alova = getInstance();
    const Get = alova.Get('/unit-test', {
      transformData: (result: Result, _) => result.data,
    });
    const {
      data,
      loading,
      error,
    } = useRequest(Get);
    data.subscribe(res => {
      // res
    })
    expect(!!alova).toBe(true);
  });
});