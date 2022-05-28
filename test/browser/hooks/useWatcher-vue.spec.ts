import {
  createAlova,
  VueHook,
  GlobalFetch,
  useWatcher,
} from '../../../src';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { RequestConfig } from '../../../typings';
import { GetData, Result } from '../result.type';
import server from '../../server';
import { ref } from 'vue';
import Method from '../../../src/methods/Method';

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
  it('should send request when change value', done => {
    const alova = getInstance();
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    let currentGet: Method<any, any, any, any>;
    const {
      loading,
      data,
      progress,
      error,
      onSuccess,
    } = useWatcher(() => {
      currentGet = alova.Get<GetData, Result>('/unit-test', {
        params: { num: mutateNum.value, str: mutateStr.value },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
        transformData: result => result.data,
        staleTime: 100 * 1000,
      });
      return currentGet;
    }, [mutateNum, mutateStr]);
    const initialData = () => {
      expect(loading.value).toBeFalsy();
      expect(data.value).toBeUndefined();
      expect(progress.value).toBe(0);
      expect(error.value).toBeUndefined();
    };
    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    initialData();
    setTimeout(() => {
      initialData();
      // 当监听状态改变时触发请求，且两个状态都变化只会触发一次请求
      mutateNum.value = 1;
      mutateStr.value = 'b';
    }, 2000);
    const mockCallback = jest.fn(() => {});
    onSuccess(mockCallback);

    const successTimesFns = [() => {
      expect(loading.value).toBeFalsy();
      expect(data.value.path).toBe('/unit-test');
      expect(data.value.params.num).toBe('1');
      expect(data.value.params.str).toBe('b');
      expect(progress.value).toBe(0);
      expect(error.value).toBeUndefined();
      // 缓存有值
      const cacheData = getResponseCache('http://localhost:3000', key(currentGet));
      expect(cacheData.path).toBe('/unit-test');
      expect(cacheData.params).toEqual({ num: '1', str: 'b' });
      expect(mockCallback.mock.calls.length).toBe(1);
      mutateNum.value = 2;
      mutateStr.value = 'c';
    }, () => {
      expect(data.value.params.num).toBe('2');
      expect(data.value.params.str).toBe('c');
      const cacheData = getResponseCache('http://localhost:3000', key(currentGet));
      expect(cacheData.params).toEqual({ num: '2', str: 'c' });
      expect(mockCallback.mock.calls.length).toBe(2);
      done();
    }];

    // 根据触发次数来运行不同回调函数
    let watchTimes = 0;
    onSuccess(() => {
      successTimesFns[watchTimes]();
      watchTimes++;
    });
  });
});