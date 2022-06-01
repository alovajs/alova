import {
  createAlova,
  VueHook,
  useRequest,
  GlobalFetch,
} from '../../../src';
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

describe('persist data', function() {
  test('should assign the persisted data to state `data`', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result>('/unit-test', {
      persistTime: 500,
      transformData: data => data.data,
    });
    const firstState = useRequest(Get);
    await new Promise(resolve => firstState.onSuccess(() => resolve(1)));
    const secondState = useRequest(Get);
    expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });    // 因为有持久化数据，因此直接带出了持久化的数据
    expect(secondState.loading.value).toBe(true);   // 即使有持久化数据，loading的状态也照样会是true

    await new Promise(resolve => setTimeout(resolve, 600));
    const thirdState = useRequest(Get);
    expect(thirdState.data.value).toBeUndefined();   // 持久化数据过期，所以data没有值
  });

  test('persisted data wouldn\'t be invalid when set persistTime to `Infinity`', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result>('/unit-test', {
      persistTime: Infinity,
      transformData: data => data.data,
    });
    const firstState = useRequest(Get);
    await new Promise(resolve => firstState.onSuccess(() => resolve(1)));
    const secondState = useRequest(Get);
    expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });    // 因为有持久化数据，因此直接带出了持久化的数据
    expect(secondState.loading.value).toBe(true);   // 即使有持久化数据，loading的状态也照样会是true
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    const thirdState = useRequest(Get);
    expect(thirdState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });    // 持久化数据用不过期
  });
});