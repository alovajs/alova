import {
  createAlova,
  useRequest,
  useWatcher,
  GlobalFetch,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { AlovaRequestAdapterConfig } from '../../../typings';
import { Result } from '../result.type';
import server, { untilCbCalled } from '../../server';
import { ref } from 'vue';

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

describe('Initial data before request', function() {
  test('[useRequest]should assign the initial data to state `data`', async () => {
    const alova = getInstance();
    const Get = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data,
    });
    const {
      data,
      onSuccess
    } = useRequest(Get, {
      initialData: { method: 'NO' }
    });
    expect(data.value).toEqual({ method: 'NO' });    // 先指定了initialData，所以直接带出了initialData
    await untilCbCalled(onSuccess);
    expect(data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });    // 因为有持久化数据，因此直接带出了持久化的数据
  });

  test('[useWatcher]should assign the initial data to state `data`', async () => {
    const stateA = ref('a');
    const alova = getInstance();
    const Get = alova.Get('/unit-test', {
      transformData: ({data}: Result) => data,
    });
    const {
      data,
      onSuccess
    } = useWatcher(() => Get, [stateA], {
      initialData: { method: 'NO' },
      immediate: true
    });
    expect(data.value).toEqual({ method: 'NO' });    // 先指定了initialData，所以直接带出了initialData
    await untilCbCalled(onSuccess);
    expect(data.value).toEqual({ path: '/unit-test', method: 'GET', params: {} });    // 因为有持久化数据，因此直接带出了持久化的数据
  });
});