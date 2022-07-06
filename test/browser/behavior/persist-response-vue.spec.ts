import {
  createAlova,
  useRequest,
  GlobalFetch,
  cacheMode,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { RequestConfig } from '../../../typings';
import { GetData, Result } from '../result.type';
import server from '../../server';
import { getPersistentResponse } from '../../../src/storage/responseStorage';
import { key } from '../../../src/utils/helper';
import { removeResponseCache } from '../../../src/storage/responseCache';

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

describe('persist data', function() {
  test('should persist responsed data but it will send request when request again', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result>('/unit-test-count', {
      localCache: {
        expire: 500,
        mode: cacheMode.STORAGE_PLACEHOLDER
      },
      transformData: data => data.data,
    });
    const firstState = useRequest(Get);
    await new Promise(resolve => firstState.responser.success(() => resolve(null)));

    // 持久化数据里有值
    const persisitentResponse = getPersistentResponse(alova.id, key(Get), alova.storage);
    expect(persisitentResponse).toEqual({ path: '/unit-test-count', method: 'GET', params: { count: 0 } });

    // 先清除缓存，模拟浏览器刷新后的场景，此时将会把持久化数据先赋值给data状态，并发起请求
    removeResponseCache(alova.id, key(Get));
    const secondState = useRequest(Get);
    expect(secondState.data.value).toEqual({ path: '/unit-test-count', method: 'GET', params: { count: 0 } });    // 因为有持久化数据，因此直接带出了持久化的数据
    expect(secondState.loading.value).toBe(true);   // 即使有持久化数据，loading的状态也照样会是true

    await new Promise(resolve => setTimeout(resolve, 600));
    const thirdState = useRequest(Get);
    expect(thirdState.data.value).toBeUndefined();   // 持久化数据过期，所以data没有值
  });

  test('persistent data wouldn\'t be invalid when set persistTime to `Infinity`', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result>('/unit-test', {
      localCache: {
        expire: Infinity,
        mode: cacheMode.STORAGE_PLACEHOLDER
      },
      transformData: data => data.data,
    });
    const firstState = useRequest(Get);
    await new Promise(resolve => firstState.responser.success(() => resolve(null)));
    // 先清除缓存，模拟浏览器刷新后的场景，此时将会把持久化数据先赋值给data状态，并发起请求
    removeResponseCache(alova.id, key(Get));
    const secondState = useRequest(Get);
    expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });    // 因为有持久化数据，因此直接带出了持久化的数据
    expect(secondState.loading.value).toBe(true);   // 即使有持久化数据，loading的状态也照样会是true
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    const thirdState = useRequest(Get);
    expect(thirdState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });    // 持久化数据用不过期
  });


  test('persistent data will restore even if the cache of the same key is invalid', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result>('/unit-test', {
      localCache: {
        expire: 100 * 1000,
        mode: cacheMode.STORAGE_RESTORE
      },
      transformData: data => data.data,
    });
    const firstState = useRequest(Get);
    await new Promise(resolve => firstState.responser.success(() => resolve(null)));
    // 先清除缓存，模拟浏览器刷新后的场景，此时将会把持久化数据先赋值给data状态，并发起请求
    removeResponseCache(alova.id, key(Get));
    const secondState = useRequest(Get);

    // 设置为restore后，即使本地缓存失效了，也会自动将持久化数据恢复到缓存在宏，因此会命中缓存
    expect(secondState.data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });
    expect(secondState.loading.value).toBe(false);
  });
});