import { getAlovaInstance } from '#/utils';
import { useWatcher } from '@/index';
import VueHook from '@/statesHook/vue';
import { queryCache, setCache } from 'alova';
import { Result, delay, untilCbCalled } from 'root/testUtils';
import { computed, reactive, ref } from 'vue';

describe('use useWatcher hook to send GET with vue', () => {
  test('should specify at least one watching state', () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    expect(() => useWatcher(() => alova.Get<Result>('/unit-test'), [])).toThrow();
  });
  test('should send request when change value', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 100 * 1000
        }),
      [mutateNum, mutateStr]
    );

    const mockCallback = vi.fn(() => {});
    onSuccess(mockCallback);

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    await delay(10);
    // 当监听状态改变时触发请求，且两个状态都变化只会触发一次请求
    mutateNum.value = 1;
    mutateStr.value = 'b';

    const { method } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('b');
    expect(error.value).toBeUndefined();
    // 缓存有值
    let cacheData = await queryCache(method);
    expect(cacheData?.path).toBe('/unit-test');
    expect(cacheData?.params).toStrictEqual({ num: '1', str: 'b' });
    expect(mockCallback.mock.calls.length).toBe(1);
    mutateNum.value = 2;
    mutateStr.value = 'c';

    const { method: method2 } = await untilCbCalled(onSuccess);
    expect(data.value.params.num).toBe('2');
    expect(data.value.params.str).toBe('c');
    cacheData = await queryCache(method2);
    expect(cacheData?.params).toStrictEqual({ num: '2', str: 'c' });
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  test('should get the response that request at last when change value', async () => {
    let i = 0;
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get(i === 1 ? '/unit-test-1s' : '/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          transform: (result: Result) => result.data,
          cacheFor: null
        }),
      [mutateNum, mutateStr]
    );

    const mockCallback = vi.fn();
    onSuccess(mockCallback);

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    await untilCbCalled(setTimeout);
    // 当监听状态改变时触发请求，且两个状态都变化只会触发一次请求
    i += 1;
    mutateNum.value = 1;
    mutateStr.value = 'b';

    await untilCbCalled(setTimeout);

    i += 1;
    mutateNum.value = 2;
    mutateStr.value = 'c';
    await untilCbCalled(onSuccess);
    expect(data.value.params.num).toBe('2');
    expect(data.value.params.str).toBe('c');
    expect(mockCallback).toHaveBeenCalledTimes(1); // 请求已发出，但数据只更新最新的
  });

  test('should ignore the error which is not the last request', async () => {
    let i = 0;
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const { loading, data, error, onSuccess, onError } = useWatcher(
      () =>
        alova.Get(i === 1 ? '/unit-test-1s' : '/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          transform: ({ data: responseData }: Result) => {
            if (responseData.path === '/unit-test-1s') {
              throw new Error('error');
            }
            return responseData;
          },
          cacheFor: null
        }),
      [mutateNum, mutateStr]
    );

    const mockCallback = vi.fn();
    onSuccess(mockCallback);
    const mockErrorCallback = vi.fn();
    onError(mockErrorCallback);

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    await untilCbCalled(setTimeout);
    // 当监听状态改变时触发请求，且两个状态都变化只会触发一次请求
    i += 1;
    mutateNum.value = 1;
    mutateStr.value = 'b';

    await untilCbCalled(setTimeout);

    i += 1;
    mutateNum.value = 2;
    mutateStr.value = 'c';
    await untilCbCalled(onSuccess);
    expect(data.value.params.num).toBe('2');
    expect(data.value.params.str).toBe('c');
    expect(mockCallback).toHaveBeenCalledTimes(1); // 请求已发出，但数据只更新最新的
    expect(mockErrorCallback).not.toHaveBeenCalled(); // unit-test-1s因为后面才响应，不会触发回调
    expect(error.value).toBeUndefined(); // 对应的error也不会有值
  });

  test('should receive last response when set abortLast to false', async () => {
    let i = 0;
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get(i === 1 ? '/unit-test-1s' : '/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          transform: ({ data: responseData }: Result) => responseData,
          cacheFor: null
        }),
      [mutateNum, mutateStr],
      {
        abortLast: false
      }
    );

    const mockCallback = vi.fn();
    onSuccess(mockCallback);

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    await untilCbCalled(setTimeout);
    // 当监听状态改变时触发请求，且两个状态都变化只会触发一次请求
    i += 1;
    mutateNum.value = 1;
    mutateStr.value = 'b';
    await delay(10);

    i += 1;
    mutateNum.value = 2;
    mutateStr.value = 'c';
    await delay(1100);
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('b');
    expect(mockCallback).toHaveBeenCalledTimes(2); // 请求已发出，但数据只更新最新的
  });

  test('should not send request when change value but intercepted by middleware', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const sendableFn = vi.fn();
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 100 * 1000
        }),
      [mutateNum, mutateStr],
      {
        middleware(context, next) {
          sendableFn();
          if (mutateNum.value === 1 && mutateStr.value === 'b') {
            return next();
          }
        }
      }
    );

    const mockCallback = vi.fn(() => {});
    onSuccess(mockCallback);

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
    expect(sendableFn).not.toHaveBeenCalled();

    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    await delay(10);
    // 当监听状态改变时触发请求，且两个状态都变化只会触发一次请求
    mutateNum.value = 1;
    mutateStr.value = 'b';

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('b');
    expect(error.value).toBeUndefined();
    expect(sendableFn).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledTimes(1);

    mutateNum.value = 2;
    mutateStr.value = 'c';
    await delay(50); // 修改值后不会发出请求，使用setTimeout延迟查看是否发起了请求
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('b');
    expect(sendableFn).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('should not send request when change value but throws error in middleware', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const sendableFn = vi.fn();
    const { loading, data, downloading, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 100 * 1000
        }),
      [mutateNum, mutateStr],
      {
        middleware() {
          sendableFn();
          throw new Error('');
        }
      }
    );

    const mockCallback = vi.fn();
    onSuccess(mockCallback);

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    expect(sendableFn).not.toHaveBeenCalled();

    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    await delay(10);
    // 当监听状态改变时触发请求，且两个状态都变化只会触发一次请求
    mutateNum.value = 1;
    mutateStr.value = 'b';
    await delay(50);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    expect(sendableFn).toHaveBeenCalledTimes(1);
    expect(mockCallback).not.toHaveBeenCalled();

    mutateNum.value = 2;
    mutateStr.value = 'c';
    await delay(50);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    expect(sendableFn).toHaveBeenCalledTimes(2);
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('the loading state should be covered to false when send request immediately', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const sendableFn = vi.fn();
    const { loading } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          transform: (result: Result) => result.data
        }),
      [mutateNum, mutateStr],
      {
        immediate: true,
        middleware() {
          sendableFn();
        }
      }
    );

    await delay();
    expect(loading.value).toBeFalsy();
    expect(sendableFn).toHaveBeenCalledTimes(1);
  });

  test('should work when receive a method instance', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const currentGet = alova.Get('/unit-test', {
      params: { num: mutateNum.value, str: mutateStr.value },
      transform: (result: Result) => result.data,
      cacheFor: 0
    });
    const { data, error, onSuccess } = useWatcher(currentGet, [mutateNum, mutateStr], {
      immediate: true
    });
    const successMockFn = vi.fn();
    onSuccess(successMockFn);

    await untilCbCalled(onSuccess);
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('0');
    expect(data.value.params.str).toBe('a');
    expect(error.value).toBeUndefined();
    expect(successMockFn).toHaveBeenCalledTimes(1);

    mutateNum.value = 2;
    mutateStr.value = 'c';
    await untilCbCalled(onSuccess);

    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('0');
    expect(data.value.params.str).toBe('a');
    expect(error.value).toBeUndefined();
    expect(successMockFn).toHaveBeenCalledTimes(2);
  });

  test('should also send request when nest value changed', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateObj = ref({
      num: 0
    });
    const mutateObjReactive = reactive({
      str: ''
    });
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateObj.value.num, str: mutateObjReactive.str },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 100 * 1000
        }),
      [mutateObj, mutateObjReactive]
    );
    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    // 改变数据触发请求
    mutateObj.value.num = 1;
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('');
    expect(error.value).toBeUndefined();

    // 再次改变数据，触发请求
    mutateObj.value.num = 2;
    mutateObjReactive.str = 'c';
    await untilCbCalled(onSuccess);
    expect(data.value.params.num).toBe('2');
    expect(data.value.params.str).toBe('c');
  });

  test('should also send request when computed value changed', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const computedStr = computed(() => (mutateNum.value === 0 ? 'str1' : 'str2'));
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { str: computedStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 100 * 1000
        }),
      [computedStr]
    );
    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    // 改变数据触发请求
    mutateNum.value = 1;
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.str).toBe('str2');
    expect(error.value).toBeUndefined();

    // 再次改变数据，触发请求
    mutateNum.value = 0;
    await untilCbCalled(onSuccess);
    expect(data.value.params.str).toBe('str1');
  });

  test("should send request one times when value change's times less then debounce", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 100 * 1000
        }),
      [mutateNum, mutateStr],
      { debounce: 100 }
    );

    const mockCallback = vi.fn();
    onSuccess(mockCallback);
    await delay(10);
    const checkInitData = () => {
      expect(loading.value).toBeFalsy();
      expect(data.value).toBeUndefined();
      expect(error.value).toBeUndefined();
      expect(mockCallback).not.toHaveBeenCalled();
    };
    mutateNum.value = 1;
    mutateStr.value = 'b';
    checkInitData();

    // 还没到防抖时间，请求相关数据不变
    await delay(10);
    mutateNum.value = 2;
    mutateStr.value = 'c';
    checkInitData();

    const startTs = Date.now();
    const { method } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('2');
    expect(data.value.params.str).toBe('c');
    expect(error.value).toBeUndefined();
    expect(Date.now() - startTs).toBeLessThanOrEqual(200); // 实际异步时间会较长

    // 缓存有值
    const cacheData = await queryCache(method);
    expect(cacheData?.path).toBe('/unit-test');
    expect(cacheData?.params).toStrictEqual({ num: '2', str: 'c' });
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('in different debounce time when set param debounce to be an array', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const { loading, data, downloading, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 100 * 1000
        }),
      [mutateNum, mutateStr],
      { debounce: [200, 100] }
    );

    // 暂没发送请求
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await delay(10);
    mutateNum.value = 1;
    let startTs = Date.now();
    await untilCbCalled(onSuccess);
    let endTs = Date.now();
    // 请求已响应
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('a');
    expect(endTs - startTs).toBeLessThan(300);

    mutateStr.value = 'b';
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    endTs = Date.now();
    // 请求已响应
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('b');
    expect(endTs - startTs).toBeLessThan(200);

    // 同时改变，以后一个为准
    mutateNum.value = 3;
    mutateStr.value = 'c';
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    endTs = Date.now();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('3');
    expect(data.value.params.str).toBe('c');
    expect(endTs - startTs).toBeLessThan(200);
  });

  test('set param debounce to be a array that contain a item', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const { data, onSuccess } = useWatcher(
      () => {
        const get = alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 100 * 1000
        });
        return get;
      },
      [mutateNum, mutateStr],
      { debounce: [100] }
    );

    await delay(10);
    mutateNum.value = 1;
    let startTs = Date.now();
    // 请求已响应
    await untilCbCalled(onSuccess);
    let endTs = Date.now();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('a');
    expect(endTs - startTs).toBeLessThan(200);

    mutateStr.value = 'b';
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    endTs = Date.now();
    // 第二个值未设置防抖，请求已发送并响应
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('b');
    expect(endTs - startTs).toBeLessThan(100);

    // 同时改变，以后一个为准
    mutateNum.value = 3;
    mutateStr.value = 'c';
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    endTs = Date.now();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('3');
    expect(data.value.params.str).toBe('c');
    expect(endTs - startTs).toBeLessThan(100);
  });

  test('the debounce should be effective when nest value is changed', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateObj = ref({
      num: 0
    });
    const mutateObjReactive = reactive({
      str: 'a'
    });
    const { data, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateObj.value.num, str: mutateObjReactive.str },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 100 * 1000
        }),
      [mutateObj, mutateObjReactive],
      { debounce: 200 }
    );

    await delay(10);
    mutateObj.value.num = 1;
    let startTs = Date.now();
    await untilCbCalled(onSuccess);
    // 请求已响应
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('a');
    expect(Date.now() - startTs).toBeLessThanOrEqual(300);

    mutateObjReactive.str = 'b';
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    // 请求已响应
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('b');
    expect(Date.now() - startTs).toBeLessThan(300);

    // 同时改变，以后一个为准
    mutateObj.value.num = 3;
    mutateObjReactive.str = 'c';
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('3');
    expect(data.value.params.str).toBe('c');
    expect(Date.now() - startTs).toBeLessThan(300);
  });

  test('the debounce of array should be effective when nest value is changed', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateObj = ref({
      num: 0
    });
    const mutateObjReactive = reactive({
      str: 'a'
    });
    const { data, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateObj.value.num, str: mutateObjReactive.str },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 100 * 1000
        }),
      [mutateObj, mutateObjReactive],
      { debounce: [200, 100] }
    );

    await delay(10);
    mutateObj.value.num = 1;
    let startTs = Date.now();
    await untilCbCalled(onSuccess);
    // 请求已响应
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('a');
    expect(Date.now() - startTs).toBeLessThan(300);

    mutateObjReactive.str = 'b';
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    // 请求已响应
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('b');
    expect(Date.now() - startTs).toBeLessThanOrEqual(200);

    // 同时改变，以后一个为准
    mutateObj.value.num = 3;
    mutateObjReactive.str = 'c';
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('3');
    expect(data.value.params.str).toBe('c');
    expect(Date.now() - startTs).toBeLessThanOrEqual(200);
  });

  test('should send request when set the param `immediate`', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const { loading, data, downloading, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 0
        }),
      [mutateNum, mutateStr],
      { immediate: true }
    );
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    const mockCallback = vi.fn();
    onSuccess(mockCallback);

    const { method } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('0');
    expect(data.value.params.str).toBe('a');
    expect(downloading.value).toStrictEqual({ total: 96, loaded: 96 });
    expect(error.value).toBeUndefined();
    // 缓存没有值
    let cacheData = await queryCache(method);
    expect(cacheData).toBeUndefined();
    expect(mockCallback).toHaveBeenCalledTimes(1);

    mutateNum.value = 2;
    mutateStr.value = 'c';
    const { method: method2 } = await untilCbCalled(onSuccess);
    expect(data.value.params.num).toBe('2');
    expect(data.value.params.str).toBe('c');
    cacheData = await queryCache(method2);
    expect(cacheData).toBeUndefined();
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  test("initial request shouldn't delay when set the `immediate` and `debounce`", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 0
        }),
      [mutateNum, mutateStr],
      { immediate: true, debounce: 200 }
    );

    // 监听时立即出发一次请求，因此loading的值为true
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
    const mockCallback = vi.fn();
    onSuccess(mockCallback);

    const { method } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('0');
    expect(data.value.params.str).toBe('a');
    expect(error.value).toBeUndefined();
    // 缓存有值
    let cacheData = await queryCache(method);
    expect(cacheData).toBeUndefined();
    expect(mockCallback).toHaveBeenCalledTimes(1);

    mutateNum.value = 2;
    mutateStr.value = 'c';

    // 因为值改变后延迟200毫秒发出请求，因此150毫秒后应该还是原数据
    await delay(150);
    expect(data.value.params.num).toBe('0');
    expect(data.value.params.str).toBe('a');

    const { method: method2 } = await untilCbCalled(onSuccess);
    expect(data.value.params.num).toBe('2');
    expect(data.value.params.str).toBe('c');
    cacheData = await queryCache(method2);
    expect(cacheData).toBeUndefined();
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  test('should force request when force param set to a function which returns truthy value', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      timeout: 10000,
      transform: ({ data }: Result<true>) => data,
      params: {
        val: '1'
      },
      cacheFor: 100 * 1000
    });

    const ctrlVal = ref(0);
    const { data, send, onSuccess } = useWatcher((_force: boolean) => getGetterObj, [ctrlVal], {
      force: ({ args: [force] }) => force
    });

    setCache(getGetterObj, {
      path: '/unit-test',
      method: 'GET',
      params: { val: '-1' },
      data: {}
    });

    ctrlVal.value = 1;
    await untilCbCalled(onSuccess);
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.val).toBe('-1');

    send(true);
    await untilCbCalled(onSuccess);
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.val).toBe('1');
    const cacheData = await queryCache(getGetterObj);
    expect(cacheData?.params).toStrictEqual({ val: '1' });
  });

  test('should return original return value in on events', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });

    const successFn = vi.fn();
    const errorFn = vi.fn();
    const completeFn = vi.fn();
    const mutateNum = ref(0);
    const mutateStr = ref('accc');
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          transform: (result: Result) => result.data,
          cacheFor: null
        }),
      [mutateNum, mutateStr],
      {
        immediate: true
      }
    )
      .onSuccess(successFn)
      .onError(errorFn)
      .onComplete(completeFn);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toStrictEqual({ num: '0', str: 'accc' });
    expect(error.value).toBeUndefined();

    expect(successFn).toHaveBeenCalled();
    expect(errorFn).not.toHaveBeenCalled();
    expect(completeFn).toHaveBeenCalled();
  });
});
