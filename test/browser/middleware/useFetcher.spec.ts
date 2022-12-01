import { useFetcher } from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { FetcherType } from '../../../typings';
import { getAlovaInstance, mockServer, untilCbCalled } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('useFetcher middleware', function () {
  test('should send request synchronously when set a sync middleware function', async () => {
    const alova = getAlovaInstance(VueHook);
    const { fetching, fetch, onSuccess } = useFetcher<FetcherType<typeof alova>>({
      middleware: (context, next) => {
        expect(context.method).toBe(getGetterObj);
        next();
      }
    });
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });
    fetch(getGetterObj);

    expect(fetching.value).toBeTruthy();
    await untilCbCalled(onSuccess);
    expect(fetching.value).toBeFalsy();
  });

  test('should send request until async middleware function is called', async () => {
    const alova = getAlovaInstance(VueHook);
    const { fetching, fetch, onSuccess } = useFetcher<FetcherType<typeof alova>>({
      middleware: async (_, next) => {
        await untilCbCalled(setTimeout, 1000);
        await next();
      }
    });
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });
    fetch(getGetterObj);

    expect(fetching.value).toBeFalsy(); // 延迟1秒发送请求，表示异步发送请求，因此loading为false
    let startTs = Date.now();
    const rawData = await untilCbCalled(onSuccess);
    let endTs = Date.now();
    expect(!!rawData).toBeTruthy();
    expect(endTs - startTs).toBeGreaterThan(1000);
  });

  test("shouldn't send request when not call next in middleware function", async () => {
    const alova = getAlovaInstance(VueHook);
    const { fetching, fetch, onSuccess } = useFetcher<FetcherType<typeof alova>>({
      middleware: () => {}
    });
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });

    fetch(getGetterObj);
    const mockFn = jest.fn();
    onSuccess(mockFn);
    // middleware中未调用next，因此不会发送请求
    expect(fetching.value).toBeFalsy();
    await untilCbCalled(setTimeout, 1000);
    expect(mockFn).toBeCalledTimes(0);
    expect(fetching.value).toBeFalsy();
  });
});
