import {
  createAlova,
  useRequest,
  GlobalFetch,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
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

describe('cache data', function() {
  test('should hit the cache data when re request the same url with the same arguments', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result>('/unit-test', {
      localCache: 500,
      transformData: data => data.data,
    });
    const firstState = useRequest(Get);
    await new Promise(resolve => firstState.responser.success(() => resolve(1)));
    const secondState = useRequest(Get);
    expect(secondState.loading.value).toBe(false);    // 因为使用缓存，所以不会发起请求，loading不会改变
    await new Promise(resolve => setTimeout(resolve, 0));
    // 使用缓存时，将会立即获得数据
    expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });

    await new Promise(resolve => setTimeout(resolve, 600));
    const thirdState = useRequest(Get);
    expect(thirdState.loading.value).toBe(true);    // 因为缓存已过期，所以会重新发起请求，loading会改变
  });

  test('cache data wouldn\'t be invalid when set cacheTime to `Infinity`', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result>('/unit-test', {
      localCache: Infinity,
      transformData: data => data.data,
    });
    const firstState = useRequest(Get);
    await new Promise(resolve => firstState.responser.success(() => resolve(1)));
    const secondState = useRequest(Get);
    expect(secondState.loading.value).toBe(false);    // 因为使用缓存，所以不会发起请求，loading不会改变
    await new Promise(resolve => setTimeout(resolve, 0));
    // 使用缓存时，将会立即获得数据
    expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });

    await new Promise(resolve => setTimeout(resolve, 1000));
    const thirdState = useRequest(Get);
    expect(thirdState.loading.value).toBe(false);    // 因为缓存已过期，所以会重新发起请求，loading会改变
  });
});