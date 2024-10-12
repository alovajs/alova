import { getAlovaInstance } from '#/utils';
import { useWatcher } from '@/index';
import VueHook from '@/statesHook/vue';
import { delay, Result, untilCbCalled } from 'root/testUtils';
import { ref } from 'vue';

describe('useWatcher middleware', () => {
  test('should send request synchronously when set a sync middleware function', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    const stateA = ref(0);
    const { loading, error, onSuccess, data, send } = useWatcher(() => getGetterObj, [stateA], {
      middleware: async (context, next) => {
        expect(context.method).toBe(getGetterObj);
        await next();
      }
    });

    stateA.value += 1;
    let { data: rawData } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(rawData.path).toBe('/unit-test');
    expect(error.value).toBeUndefined();

    rawData = await send();
    expect(rawData.path).toBe('/unit-test');
  });

  test('should send request until async middleware function is called', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transform: ({ data }: Result<true>) => data
    });

    const stateA = ref(0);
    const { loading, onSuccess } = useWatcher(() => getGetterObj, [stateA], {
      middleware: async (_, next) => {
        await delay(500);
        await next();
      },
      immediate: true
    });
    expect(loading.value).toBeTruthy();
    let startTs = Date.now();
    const rawData = await untilCbCalled(onSuccess);
    let endTs = Date.now();
    expect(!!rawData).toBeTruthy();
    expect(endTs - startTs).toBeGreaterThanOrEqual(500);

    stateA.value += 1;
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    endTs = Date.now();
    expect(endTs - startTs).toBeGreaterThanOrEqual(500);
  });

  test("shouldn't send request when not call next in middleware function", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transform: ({ data }: Result<true>) => data
    });

    const stateA = ref(0);
    const { loading, data, onSuccess, send } = useWatcher(() => getGetterObj, [stateA], {
      middleware: async () => {},
      immediate: true
    });

    const mockFn = jest.fn();
    onSuccess(mockFn);
    // middleware中未调用next，因此不会发送请求
    expect(loading.value).toBeTruthy();
    await delay(1000);
    expect(mockFn).toHaveBeenCalledTimes(0);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();

    stateA.value += 1;
    await delay(1000);
    expect(mockFn).toHaveBeenCalledTimes(0);

    const rawData = await send();
    expect(rawData).toBeUndefined();
  });
});
