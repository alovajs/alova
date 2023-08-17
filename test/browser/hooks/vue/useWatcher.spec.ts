import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { setCache, useWatcher } from '@/index';
import VueHook from '@/predefine/VueHook';
import { getResponseCache } from '@/storage/responseCache';
import { key } from '@/utils/helper';
import { computed, reactive, ref } from 'vue';

describe('use useWatcher hook to send GET with vue', function () {
  test('should specify at least one watching state', () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    expect(() => useWatcher(() => alova.Get<Result>('/unit-test'), [])).toThrowError();
  });
  test('should send request when change value', async () => {
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
          transformData: (result: Result) => result.data,
          localCache: 100 * 1000
        }),
      [mutateNum, mutateStr]
    );

    const mockCallback = jest.fn(() => {});
    onSuccess(mockCallback);

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    await untilCbCalled(setTimeout, 10);
    // 当监听状态改变时触发请求，且两个状态都变化只会触发一次请求
    mutateNum.value = 1;
    mutateStr.value = 'b';

    const { method } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('b');
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    // 缓存有值
    let cacheData = getResponseCache(alova.id, key(method));
    expect(cacheData.path).toBe('/unit-test');
    expect(cacheData.params).toEqual({ num: '1', str: 'b' });
    expect(mockCallback.mock.calls.length).toBe(1);
    mutateNum.value = 2;
    mutateStr.value = 'c';

    const { method: method2 } = await untilCbCalled(onSuccess);
    expect(data.value.params.num).toBe('2');
    expect(data.value.params.str).toBe('c');
    cacheData = getResponseCache(alova.id, key(method2));
    expect(cacheData.params).toEqual({ num: '2', str: 'c' });
    expect(mockCallback).toBeCalledTimes(2);
  });

  test('should get last response when change value', async () => {
    let i = 0;
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const { loading, data, downloading, error, onSuccess } = useWatcher(
      () =>
        alova.Get(i === 1 ? '/unit-test-1s' : '/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transformData: (result: Result) => result.data,
          localCache: 100 * 1000
        }),
      [mutateNum, mutateStr]
    );

    const mockCallback = jest.fn(() => {});
    onSuccess(mockCallback);

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    await untilCbCalled(setTimeout, 10);
    // 当监听状态改变时触发请求，且两个状态都变化只会触发一次请求
    ++i;
    mutateNum.value = 1;
    mutateStr.value = 'b';

    await untilCbCalled(setTimeout, 10);

    ++i;
    mutateNum.value = 2;
    mutateStr.value = 'c';
    await untilCbCalled(setTimeout, 1100);
    expect(data.value.params.num).toBe('2');
    expect(data.value.params.str).toBe('c');
    expect(mockCallback).toBeCalledTimes(1);
  });

  test('should not send request when change value but returns false in sendable', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const sendableFn = jest.fn();
    const { loading, data, downloading, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transformData: (result: Result) => result.data,
          localCache: 100 * 1000
        }),
      [mutateNum, mutateStr],
      {
        sendable: () => {
          sendableFn();
          return mutateNum.value === 1 && mutateStr.value === 'b';
        }
      }
    );

    const mockCallback = jest.fn(() => {});
    onSuccess(mockCallback);

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    expect(sendableFn).not.toBeCalled();

    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    await untilCbCalled(setTimeout, 10);
    // 当监听状态改变时触发请求，且两个状态都变化只会触发一次请求
    mutateNum.value = 1;
    mutateStr.value = 'b';

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('b');
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    expect(sendableFn).toBeCalledTimes(1);
    expect(mockCallback).toBeCalledTimes(1);

    mutateNum.value = 2;
    mutateStr.value = 'c';
    await untilCbCalled(setTimeout, 50); // 修改值后不会发出请求，使用setTimeout延迟查看是否发起了请求
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('b');
    expect(sendableFn).toBeCalledTimes(2);
    expect(mockCallback).toBeCalledTimes(1);
  });

  test('should not send request when change value but throws error in sendable', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const sendableFn = jest.fn();
    const { loading, data, downloading, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transformData: (result: Result) => result.data,
          localCache: 100 * 1000
        }),
      [mutateNum, mutateStr],
      {
        sendable: () => {
          sendableFn();
          throw Error('');
        }
      }
    );

    const mockCallback = jest.fn();
    onSuccess(mockCallback);

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    expect(sendableFn).not.toBeCalled();

    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    await untilCbCalled(setTimeout, 10);
    // 当监听状态改变时触发请求，且两个状态都变化只会触发一次请求
    mutateNum.value = 1;
    mutateStr.value = 'b';
    await untilCbCalled(setTimeout, 50);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    expect(sendableFn).toBeCalledTimes(1);
    expect(mockCallback).not.toBeCalled();

    mutateNum.value = 2;
    mutateStr.value = 'c';
    await untilCbCalled(setTimeout, 50);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    expect(sendableFn).toBeCalledTimes(2);
    expect(mockCallback).not.toBeCalled();
  });

  test('the loading state should be recovered to false when send request immediately', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const sendableFn = jest.fn();
    const { loading } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          transformData: (result: Result) => result.data
        }),
      [mutateNum, mutateStr],
      {
        immediate: true,
        sendable: () => {
          sendableFn();
          return false;
        }
      }
    );

    expect(loading.value).toBeFalsy();
    expect(sendableFn).toBeCalledTimes(1);
  });

  test('should work when receive a method instance', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = ref(0);
    const mutateStr = ref('a');
    const currentGet = alova.Get('/unit-test', {
      params: { num: mutateNum.value, str: mutateStr.value },
      transformData: (result: Result) => result.data,
      localCache: 0
    });
    const { data, downloading, error, onSuccess } = useWatcher(currentGet, [mutateNum, mutateStr], {
      immediate: true
    });
    const successMockFn = jest.fn();
    onSuccess(successMockFn);

    await untilCbCalled(onSuccess);
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('0');
    expect(data.value.params.str).toBe('a');
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    expect(successMockFn).toBeCalledTimes(1);

    mutateNum.value = 2;
    mutateStr.value = 'c';
    await untilCbCalled(onSuccess);

    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('0');
    expect(data.value.params.str).toBe('a');
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    expect(successMockFn).toBeCalledTimes(2);
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
    const { loading, data, downloading, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateObj.value.num, str: mutateObjReactive.str },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transformData: (result: Result) => result.data,
          localCache: 100 * 1000
        }),
      [mutateObj, mutateObjReactive]
    );
    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    // 改变数据触发请求
    mutateObj.value.num = 1;
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('1');
    expect(data.value.params.str).toBe('');
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
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
    const { loading, data, downloading, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { str: computedStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transformData: (result: Result) => result.data,
          localCache: 100 * 1000
        }),
      [computedStr]
    );
    // 一开始和两秒后数据都没有改变，表示监听状态未改变时不会触发请求
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    // 改变数据触发请求
    mutateNum.value = 1;
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.str).toBe('str2');
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
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
    const { loading, data, downloading, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum.value, str: mutateStr.value },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transformData: (result: Result) => result.data,
          localCache: 100 * 1000
        }),
      [mutateNum, mutateStr],
      { debounce: 100 }
    );

    const mockCallback = jest.fn();
    onSuccess(mockCallback);
    await untilCbCalled(setTimeout, 10);
    const checkInitData = () => {
      expect(loading.value).toBeFalsy();
      expect(data.value).toBeUndefined();
      expect(downloading.value).toEqual({ total: 0, loaded: 0 });
      expect(error.value).toBeUndefined();
      expect(mockCallback).not.toBeCalled();
    };
    mutateNum.value = 1;
    mutateStr.value = 'b';
    checkInitData();

    // 还没到防抖时间，请求相关数据不变
    await untilCbCalled(setTimeout, 10);
    mutateNum.value = 2;
    mutateStr.value = 'c';
    checkInitData();

    const startTs = Date.now();
    const { method } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('2');
    expect(data.value.params.str).toBe('c');
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    expect(Date.now() - startTs).toBeLessThanOrEqual(200); // 实际异步时间会较长

    // 缓存有值
    const cacheData = getResponseCache(alova.id, key(method));
    expect(cacheData.path).toBe('/unit-test');
    expect(cacheData.params).toEqual({ num: '2', str: 'c' });
    expect(mockCallback).toBeCalledTimes(1);
  });

  test('in different debounce time when set param debounce to be a array', async () => {
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
          transformData: (result: Result) => result.data,
          localCache: 100 * 1000
        }),
      [mutateNum, mutateStr],
      { debounce: [200, 100] }
    );

    // 暂没发送请求
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(setTimeout, 10);
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
          transformData: (result: Result) => result.data,
          localCache: 100 * 1000
        });
        return get;
      },
      [mutateNum, mutateStr],
      { debounce: [100] }
    );

    await untilCbCalled(setTimeout, 10);
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
          transformData: (result: Result) => result.data,
          localCache: 100 * 1000
        }),
      [mutateObj, mutateObjReactive],
      { debounce: 200 }
    );

    await untilCbCalled(setTimeout, 10);
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
          transformData: (result: Result) => result.data,
          localCache: 100 * 1000
        }),
      [mutateObj, mutateObjReactive],
      { debounce: [200, 100] }
    );

    await untilCbCalled(setTimeout, 10);
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
          transformData: (result: Result) => result.data,
          localCache: 0
        }),
      [mutateNum, mutateStr],
      { immediate: true }
    );
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    const mockCallback = jest.fn();
    onSuccess(mockCallback);

    const { method } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('0');
    expect(data.value.params.str).toBe('a');
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    // 缓存没有值
    let cacheData = getResponseCache(alova.id, key(method));
    expect(cacheData).toBeUndefined();
    expect(mockCallback).toBeCalledTimes(1);

    mutateNum.value = 2;
    mutateStr.value = 'c';
    const { method: method2 } = await untilCbCalled(onSuccess);
    expect(data.value.params.num).toBe('2');
    expect(data.value.params.str).toBe('c');
    cacheData = getResponseCache(alova.id, key(method2));
    expect(cacheData).toBeUndefined();
    expect(mockCallback).toBeCalledTimes(2);
  });

  test("initial request shouldn't delay when set the `immediate` and `debounce`", async () => {
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
          transformData: (result: Result) => result.data,
          localCache: 0
        }),
      [mutateNum, mutateStr],
      { immediate: true, debounce: 200 }
    );

    // 监听时立即出发一次请求，因此loading的值为true
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    const mockCallback = jest.fn();
    onSuccess(mockCallback);

    const { method } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params.num).toBe('0');
    expect(data.value.params.str).toBe('a');
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
    // 缓存有值
    let cacheData = getResponseCache(alova.id, key(method));
    expect(cacheData).toBeUndefined();
    expect(mockCallback).toBeCalledTimes(1);

    mutateNum.value = 2;
    mutateStr.value = 'c';

    // 因为值改变后延迟200毫秒发出请求，因此150毫秒后应该还是原数据
    await untilCbCalled(setTimeout, 150);
    expect(data.value.params.num).toBe('0');
    expect(data.value.params.str).toBe('a');

    const { method: method2 } = await untilCbCalled(onSuccess);
    expect(data.value.params.num).toBe('2');
    expect(data.value.params.str).toBe('c');
    cacheData = getResponseCache(alova.id, key(method2));
    expect(cacheData).toBeUndefined();
    expect(mockCallback).toBeCalledTimes(2);
  });

  test('should force request when force param set to a function which returns truthy value', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      timeout: 10000,
      transformData: ({ data }: Result<true>) => data,
      params: {
        val: '1'
      }
    });

    const ctrlVal = ref(0);
    const { data, send, onSuccess } = useWatcher(() => getGetterObj, [ctrlVal], {
      force: (isForce = false) => isForce
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
    const cacheData = getResponseCache(alova.id, key(getGetterObj));
    expect(cacheData.params).toEqual({ val: '1' });
  });
});
