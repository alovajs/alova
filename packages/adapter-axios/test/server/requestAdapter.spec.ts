import { createAlova, useRequest } from 'alova';
import VueHook from 'alova/vue';
import { untilCbCalled } from 'root/testUtils';
import { axiosRequestAdapter } from '../../src';
import { Result } from '../result.type';

const baseURL = process.env.NODE_BASE_URL as string;
describe('request adapter in SSR', () => {
  test("shouldn't request but loading is true", async () => {
    const alova = createAlova({
      baseURL,
      requestAdapter: axiosRequestAdapter(),
      statesHook: VueHook,
      timeout: 100000
    });
    const Get = alova.Get<Result>('/unit-test', {
      params: { a: 'a', b: 'str' }
    });
    const { loading, data, downloading, error } = useRequest(Get, {
      initialData: {}
    });
    expect(loading.value).toBeTruthy();
    expect(data.value).toStrictEqual({});
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    // 200ms后依然为请求前状态
    await untilCbCalled(setTimeout, 200);
    expect(loading.value).toBeTruthy();
    expect(data.value).toStrictEqual({});
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
  });
});
