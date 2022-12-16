import { ref } from 'vue';
import { useWatcher } from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getAlovaInstance, mockServer, untilCbCalled } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('useWatcher middleware', function () {
  test('should send request synchronously when set a sync middleware function', async () => {
    const alova = getAlovaInstance(VueHook);
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });
    const stateA = ref(0);
    const { loading, error, onSuccess, data, send } = useWatcher(() => getGetterObj, [stateA], {
      middleware: async (context, next) => {
        expect(context.method).toBe(getGetterObj);
        await next();
      }
    });

    stateA.value++;
    let rawData = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(rawData.path).toBe('/unit-test');
    expect(error.value).toBeUndefined();

    rawData = await send();
    expect(rawData.path).toBe('/unit-test');
  });

  test('should send request until async middleware function is called', async () => {
    const alova = getAlovaInstance(VueHook);
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });

    const stateA = ref(0);
    const { loading, onSuccess } = useWatcher(() => getGetterObj, [stateA], {
      middleware: async (_, next) => {
        await untilCbCalled(setTimeout, 500);
        await next();
      },
      immediate: true
    });
    expect(loading.value).toBeFalsy(); // 延迟1秒发送请求，表示异步发送请求，因此loading为false
    let startTs = Date.now();
    const rawData = await untilCbCalled(onSuccess);
    let endTs = Date.now();
    expect(!!rawData).toBeTruthy();
    expect(endTs - startTs).toBeGreaterThanOrEqual(500);

    stateA.value++;
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    endTs = Date.now();
    expect(endTs - startTs).toBeGreaterThanOrEqual(500);
  });

  test("shouldn't send request when not call next in middleware function", async () => {
    const alova = getAlovaInstance(VueHook);
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });

    const stateA = ref(0);
    const { loading, data, onSuccess, send } = useWatcher(() => getGetterObj, [stateA], {
      middleware: async () => {},
      immediate: true
    });

    const mockFn = jest.fn();
    onSuccess(mockFn);
    // middleware中未调用next，因此不会发送请求
    expect(loading.value).toBeFalsy();
    await untilCbCalled(setTimeout, 1000);
    expect(mockFn).toBeCalledTimes(0);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();

    stateA.value++;
    await untilCbCalled(setTimeout, 1000);
    expect(mockFn).toBeCalledTimes(0);

    const rawData = await send();
    expect(rawData).toBeUndefined();
  });
});
