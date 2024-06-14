import { getAlovaInstance } from '#/utils';
import { useFetcher } from '@/index';
import VueHook from '@/statesHook/vue';
import { delay, Result, untilCbCalled } from 'root/testUtils';
import { FetcherType } from '~/typings';

describe('useFetcher middleware', () => {
  test('should send request when call next immediately in middleware function', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const { loading, fetch, onSuccess } = useFetcher<FetcherType<typeof alova>>({
      middleware: async (_, next) => {
        await next();
      }
    });
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });

    fetch(getGetterObj);
    const mockFn = jest.fn();
    onSuccess(mockFn);
    await untilCbCalled(setTimeout, 10);
    expect(loading.value).toBeTruthy();
    await untilCbCalled(onSuccess);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(loading.value).toBeFalsy();
  });

  test('should send request until async middleware function is called', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const { loading, fetch, onSuccess } = useFetcher<FetcherType<typeof alova>>({
      middleware: async (_, next) => {
        await delay(1000);
        await next();
      }
    });
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });
    fetch(getGetterObj);

    expect(loading.value).toBeFalsy(); // 延迟1秒发送请求，表示异步发送请求，因此loading为false
    const startTs = Date.now();
    const rawData = await untilCbCalled(onSuccess);
    const endTs = Date.now();
    expect(!!rawData).toBeTruthy();
    expect(endTs - startTs).toBeGreaterThanOrEqual(1000);
  });

  test("shouldn't send request when not call next in middleware function", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const { loading, fetch, onSuccess } = useFetcher<FetcherType<typeof alova>>({
      middleware: async () => {}
    });
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });

    fetch(getGetterObj);
    const mockFn = jest.fn();
    onSuccess(mockFn);
    // middleware中未调用next，因此不会发送请求
    expect(loading.value).toBeFalsy();
    await delay(1000);
    expect(mockFn).toHaveBeenCalledTimes(0);
    expect(loading.value).toBeFalsy();
  });

  test('should fetch data like fetch function in returns when call fetch in middleware', async () => {
    const alova = getAlovaInstance(VueHook, {
      cacheFor: null,
      responseExpect: r => r.json()
    });

    let fetchInMiddleware: any;
    const { loading, fetch, onSuccess } = useFetcher<FetcherType<typeof alova>>({
      middleware: ({ fetch: fetchFn }, next) => {
        fetchInMiddleware = fetchFn;
        return next();
      }
    });
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });

    expect(fetchInMiddleware).toBeUndefined(); // 未发起请求时不会调用middleware
    fetch(getGetterObj);
    await untilCbCalled(setTimeout, 10);
    expect(loading.value).toBeTruthy();
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();

    fetchInMiddleware(getGetterObj);
    await untilCbCalled(setTimeout, 10);
    expect(loading.value).toBeTruthy();
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
  });
});
