import { useWatcher } from '@/index';
import SolidHook from '@/statesHook/solid';
import '@testing-library/jest-dom';
import { queryCache, setCache } from 'alova';
import { delay, Result } from 'root/testUtils';

describe('use useWatcher hook with Solid.js', () => {
  test('should specify at least one watching state', () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    expect(() => useWatcher(() => alova.Get<Result>('/unit-test'), [])).toThrow();
  });

  test('should send request when value changes', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const [mutateNum, setMutateNum] = createSignal(0);
    const [mutateStr, setMutateStr] = createSignal('a');
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum(), str: mutateStr() },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 100 * 1000
        }),
      [mutateNum, mutateStr]
    );

    const mockCallback = jest.fn();
    onSuccess(mockCallback);

    expect(loading()).toBeFalsy();
    expect(data()).toBeUndefined();
    expect(error()).toBeUndefined();

    await delay(10);
    setMutateNum(1);
    setMutateStr('b');

    const { method } = await untilCbCalled(onSuccess);
    expect(loading()).toBeFalsy();
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('1');
    expect(data().params.str).toBe('b');
    expect(error()).toBeUndefined();

    let cacheData = await queryCache(method);
    expect(cacheData?.path).toBe('/unit-test');
    expect(cacheData?.params).toStrictEqual({ num: '1', str: 'b' });
    expect(mockCallback.mock.calls.length).toBe(1);

    setMutateNum(2);
    setMutateStr('c');

    const { method: method2 } = await untilCbCalled(onSuccess);
    expect(data().params.num).toBe('2');
    expect(data().params.str).toBe('c');
    cacheData = await queryCache(method2);
    expect(cacheData?.params).toStrictEqual({ num: '2', str: 'c' });
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  test('should get the response of the last request when value changes', async () => {
    let i = 0;
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const [mutateNum, setMutateNum] = createSignal(0);
    const [mutateStr, setMutateStr] = createSignal('a');
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get(i === 1 ? '/unit-test-1s' : '/unit-test', {
          params: { num: mutateNum(), str: mutateStr() },
          transform: (result: Result) => result.data,
          cacheFor: null
        }),
      [mutateNum, mutateStr]
    );

    const mockCallback = jest.fn();
    onSuccess(mockCallback);

    expect(loading()).toBeFalsy();
    expect(data()).toBeUndefined();
    expect(error()).toBeUndefined();

    await delay(10);
    i += 1;
    setMutateNum(1);
    setMutateStr('b');

    await delay(10);

    i += 1;
    setMutateNum(2);
    setMutateStr('c');
    await untilCbCalled(onSuccess);
    expect(data().params.num).toBe('2');
    expect(data().params.str).toBe('c');
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('should ignore errors from non-latest requests', async () => {
    let i = 0;
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const [mutateNum, setMutateNum] = createSignal(0);
    const [mutateStr, setMutateStr] = createSignal('a');
    const { loading, data, error, onSuccess, onError } = useWatcher(
      () =>
        alova.Get(i === 1 ? '/unit-test-1s' : '/unit-test', {
          params: { num: mutateNum(), str: mutateStr() },
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

    const mockCallback = jest.fn();
    onSuccess(mockCallback);
    const mockErrorCallback = jest.fn();
    onError(mockErrorCallback);

    expect(loading()).toBeFalsy();
    expect(data()).toBeUndefined();
    expect(error()).toBeUndefined();

    await delay(10);
    i += 1;
    setMutateNum(1);
    setMutateStr('b');

    await delay(10);

    i += 1;
    setMutateNum(2);
    setMutateStr('c');
    await untilCbCalled(onSuccess);
    expect(data().params.num).toBe('2');
    expect(data().params.str).toBe('c');
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockErrorCallback).not.toHaveBeenCalled();
    expect(error()).toBeUndefined();
  });

  test('should receive the last response when abortLast is false', async () => {
    let i = 0;
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const [mutateNum, setMutateNum] = createSignal(0);
    const [mutateStr, setMutateStr] = createSignal('a');
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get(i === 1 ? '/unit-test-1s' : '/unit-test', {
          params: { num: mutateNum(), str: mutateStr() },
          transform: ({ data: responseData }: Result) => responseData,
          cacheFor: null
        }),
      [mutateNum, mutateStr],
      {
        abortLast: false
      }
    );

    const mockCallback = jest.fn();
    onSuccess(mockCallback);

    expect(loading()).toBeFalsy();
    expect(data()).toBeUndefined();
    expect(error()).toBeUndefined();

    await delay(10);
    i += 1;
    setMutateNum(1);
    setMutateStr('b');
    await delay(10);

    i += 1;
    setMutateNum(2);
    setMutateStr('c');
    await delay(1100);
    expect(data().params.num).toBe('1');
    expect(data().params.str).toBe('b');
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  test('should not send request if intercepted by middleware', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const [mutateNum, setMutateNum] = createSignal(0);
    const [mutateStr, setMutateStr] = createSignal('a');
    const sendableFn = jest.fn();
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum(), str: mutateStr() },
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
          if (mutateNum() === 1 && mutateStr() === 'b') {
            return next();
          }
        }
      }
    );

    const mockCallback = jest.fn();
    onSuccess(mockCallback);

    expect(loading()).toBeFalsy();
    expect(data()).toBeUndefined();
    expect(error()).toBeUndefined();
    expect(sendableFn).not.toHaveBeenCalled();

    await delay(10);
    setMutateNum(1);
    setMutateStr('b');

    await untilCbCalled(onSuccess);
    expect(loading()).toBeFalsy();
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('1');
    expect(data().params.str).toBe('b');
    expect(error()).toBeUndefined();
    expect(sendableFn).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledTimes(1);

    setMutateNum(2);
    setMutateStr('c');
    await delay(50);
    expect(data().params.num).toBe('1');
    expect(data().params.str).toBe('b');
    expect(sendableFn).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('should not send request if middleware throws an error', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const [mutateNum, setMutateNum] = createSignal(0);
    const [mutateStr, setMutateStr] = createSignal('a');
    const sendableFn = jest.fn();
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum(), str: mutateStr() },
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

    const mockCallback = jest.fn();
    onSuccess(mockCallback);

    expect(loading()).toBeFalsy();
    expect(data()).toBeUndefined();
    expect(error()).toBeUndefined();
    expect(sendableFn).not.toHaveBeenCalled();

    await delay(10);
    setMutateNum(1);
    setMutateStr('b');
    await delay(50);
    expect(loading()).toBeFalsy();
    expect(data()).toBeUndefined();
    expect(error()).toBeUndefined();
    expect(sendableFn).toHaveBeenCalledTimes(1);
    expect(mockCallback).not.toHaveBeenCalled();

    setMutateNum(2);
    setMutateStr('c');
    await delay(50);
    expect(loading()).toBeFalsy();
    expect(data()).toBeUndefined();
    expect(error()).toBeUndefined();
    expect(sendableFn).toHaveBeenCalledTimes(2);
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('发送请求后 loading 状态应为 false', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const [mutateNum, setMutateNum] = createSignal(0);
    const [mutateStr, setMutateStr] = createSignal('a');
    const sendableFn = jest.fn();
    const { loading } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum(), str: mutateStr() },
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
    expect(loading()).toBeFalsy();
    expect(sendableFn).toHaveBeenCalledTimes(1);
  });

  test('接收方法实例时应正常工作', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const [mutateNum, setMutateNum] = createSignal(0);
    const [mutateStr, setMutateStr] = createSignal('a');
    const currentGet = alova.Get('/unit-test', {
      params: { num: mutateNum(), str: mutateStr() },
      transform: (result: Result) => result.data,
      cacheFor: 0
    });
    const { data, error, onSuccess } = useWatcher(currentGet, [mutateNum, mutateStr], {
      immediate: true
    });
    const successMockFn = jest.fn();
    onSuccess(successMockFn);

    await untilCbCalled(onSuccess);
    expect(data()).toBeDefined();
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('0');
    expect(data().params.str).toBe('a');
    expect(error()).toBeUndefined();
    expect(successMockFn).toHaveBeenCalledTimes(1);

    setMutateNum(2);
    setMutateStr('c');
    await untilCbCalled(onSuccess);

    expect(data()).toBeDefined();
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('0');
    expect(data().params.str).toBe('a');
    expect(error()).toBeUndefined();
    expect(successMockFn).toHaveBeenCalledTimes(2);
  });

  test('当嵌套值变化时也应发送请求', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const [mutateObj, setMutateObj] = createSignal({ num: 0 });
    const [mutateObjReactive, setMutateObjReactive] = createSignal({ str: '' });
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateObj().num, str: mutateObjReactive().str },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 100 * 1000
        }),
      [mutateObj, mutateObjReactive]
    );

    expect(loading()).toBeFalsy();
    expect(data()).toBeUndefined();
    expect(error()).toBeUndefined();

    setMutateObj({ num: 1 });
    await untilCbCalled(onSuccess);
    expect(loading()).toBeFalsy();
    expect(data()).toBeDefined();
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('1');
    expect(data().params.str).toBe('');
    expect(error()).toBeUndefined();

    setMutateObj({ num: 2 });
    setMutateObjReactive({ str: 'c' });
    await untilCbCalled(onSuccess);
    expect(data()).toBeDefined();
    expect(data().params.num).toBe('2');
    expect(data().params.str).toBe('c');
  });

  test('计算值变化时也应发送请求', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const [mutateNum, setMutateNum] = createSignal(0);
    const computedStr = createMemo(() => (mutateNum() === 0 ? 'str1' : 'str2'));
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { str: computedStr() },
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          },
          transform: (result: Result) => result.data,
          cacheFor: 100 * 1000
        }),
      [computedStr]
    );

    expect(loading()).toBeFalsy();
    expect(data()).toBeUndefined();
    expect(error()).toBeUndefined();

    setMutateNum(1);
    await untilCbCalled(onSuccess);
    expect(loading()).toBeFalsy();
    expect(data()).toBeDefined();
    expect(data().path).toBe('/unit-test');
    expect(data().params.str).toBe('str2');
    expect(error()).toBeUndefined();

    setMutateNum(0);
    await untilCbCalled(onSuccess);
    expect(data().params.str).toBe('str1');
  });

  test('当值变化次数少于防抖时间时只发送一次请求', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const [mutateNum, setMutateNum] = createSignal(0);
    const [mutateStr, setMutateStr] = createSignal('a');
    const { loading, data, error, onSuccess } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum(), str: mutateStr() },
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

    const mockCallback = jest.fn();
    onSuccess(mockCallback);
    await delay(10);

    const checkInitData = () => {
      expect(loading()).toBeFalsy();
      expect(data()).toBeUndefined();
      expect(error()).toBeUndefined();
      expect(mockCallback).not.toHaveBeenCalled();
    };
    setMutateNum(1);
    setMutateStr('b');
    checkInitData();

    // 防抖时间尚未过去，请求相关数据应保持不变
    await delay(10);
    setMutateNum(2);
    setMutateStr('c');
    checkInitData();

    const startTs = Date.now();
    const { method } = await untilCbCalled(onSuccess);
    expect(loading()).toBeFalsy();
    expect(data()).toBeDefined();
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('2');
    expect(data().params.str).toBe('c');
    expect(error()).toBeUndefined();
    expect(Date.now() - startTs).toBeLessThanOrEqual(200); // 实际异步时间会较长

    // 缓存中应有值
    const cacheData = await queryCache(method);
    expect(cacheData?.path).toBe('/unit-test');
    expect(cacheData?.params).toStrictEqual({ num: '2', str: 'c' });
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  import { createSignal, createEffect, createResource } from 'solid-js';
  import { render } from 'solid-js/web';
  import { test, expect } from 'vitest';
  import { createDelay, untilCbCalled } from './utils'; // 需要根据实际情况导入

  // 模拟网络请求的实例
  const getAlovaInstance = (hook, config) => {
    // ...实现你的 getAlovaInstance
  };

  test('在不同防抖时间设置参数 debounce 为数组', async () => {
    const alova = getAlovaInstance(null, { responseExpect: r => r.json() }); // hook 设置为 null 或实际值
    const [mutateNum, setMutateNum] = createSignal(0);
    const [mutateStr, setMutateStr] = createSignal('a');

    const [loading, data, downloading, error, onSuccess] = createResource(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum(), str: mutateStr() },
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
          transform: result => result.data,
          cacheFor: 100 * 1000
        }),
      { debounce: [200, 100] }
    );

    // 请求尚未发送
    expect(loading()).toBeFalsy();
    expect(data()).toBeUndefined();
    expect(downloading()).toStrictEqual({ total: 0, loaded: 0 });
    expect(error()).toBeUndefined();

    await createDelay(10);
    setMutateNum(1);
    let startTs = Date.now();
    await untilCbCalled(onSuccess);
    let endTs = Date.now();
    // 请求已响应
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('1');
    expect(data().params.str).toBe('a');
    expect(endTs - startTs).toBeLessThan(300);

    setMutateStr('b');
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    endTs = Date.now();
    // 请求已响应
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('1');
    expect(data().params.str).toBe('b');
    expect(endTs - startTs).toBeLessThan(200);

    // 同时改变，以后一个为准
    setMutateNum(3);
    setMutateStr('c');
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    endTs = Date.now();
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('3');
    expect(data().params.str).toBe('c');
    expect(endTs - startTs).toBeLessThan(200);
  });

  test('将参数 debounce 设置为包含一个项的数组', async () => {
    const alova = getAlovaInstance(null, { responseExpect: r => r.json() }); // hook 设置为 null 或实际值
    const [mutateNum, setMutateNum] = createSignal(0);
    const [mutateStr, setMutateStr] = createSignal('a');

    const [data, onSuccess] = createResource(
      () => {
        const get = alova.Get('/unit-test', {
          params: { num: mutateNum(), str: mutateStr() },
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
          transform: result => result.data,
          cacheFor: 100 * 1000
        });
        return get;
      },
      { debounce: [100] }
    );

    await createDelay(10);
    setMutateNum(1);
    let startTs = Date.now();
    // 请求已响应
    await untilCbCalled(onSuccess);
    let endTs = Date.now();
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('1');
    expect(data().params.str).toBe('a');
    expect(endTs - startTs).toBeLessThan(200);

    setMutateStr('b');
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    endTs = Date.now();
    // 第二个值未设置防抖，请求已发送并响应
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('1');
    expect(data().params.str).toBe('b');
    expect(endTs - startTs).toBeLessThan(100);

    // 同时改变，以后一个为准
    setMutateNum(3);
    setMutateStr('c');
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    endTs = Date.now();
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('3');
    expect(data().params.str).toBe('c');
    expect(endTs - startTs).toBeLessThan(100);
  });

  test('嵌套值变化时防抖应生效', async () => {
    const alova = getAlovaInstance(null, { responseExpect: r => r.json() }); // hook 设置为 null 或实际值
    const [mutateObj, setMutateObj] = createSignal({ num: 0 });
    const [mutateObjReactive, setMutateObjReactive] = createSignal({ str: 'a' });

    const [data, onSuccess] = createResource(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateObj().num, str: mutateObjReactive().str },
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
          transform: result => result.data,
          cacheFor: 100 * 1000
        }),
      { debounce: 200 }
    );

    await createDelay(10);
    setMutateObj({ num: 1 });
    let startTs = Date.now();
    await untilCbCalled(onSuccess);
    // 请求已响应
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('1');
    expect(data().params.str).toBe('a');
    expect(Date.now() - startTs).toBeLessThanOrEqual(300);

    setMutateObjReactive({ str: 'b' });
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    // 请求已响应
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('1');
    expect(data().params.str).toBe('b');
    expect(Date.now() - startTs).toBeLessThan(300);

    // 同时改变，以后一个为准
    setMutateObj({ num: 3 });
    setMutateObjReactive({ str: 'c' });
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('3');
    expect(data().params.str).toBe('c');
    expect(Date.now() - startTs).toBeLessThan(300);
  });

  test('the debounce of array should be effective when nested value is changed', async () => {
    const alova = getAlovaInstance(null, { responseExpect: r => r.json() }); // Set hook to null or actual value
    const [mutateObj, setMutateObj] = createSignal({ num: 0 });
    const [mutateObjReactive, setMutateObjReactive] = createSignal({ str: 'a' });

    const [data, onSuccess] = createResource(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateObj().num, str: mutateObjReactive().str },
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
          transform: result => result.data,
          cacheFor: 100 * 1000
        }),
      { debounce: [200, 100] }
    );

    await createDelay(10);
    setMutateObj({ num: 1 });
    let startTs = Date.now();
    await untilCbCalled(onSuccess);
    let endTs = Date.now();
    // Request should respond
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('1');
    expect(data().params.str).toBe('a');
    expect(endTs - startTs).toBeLessThan(300);

    setMutateObjReactive({ str: 'b' });
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    endTs = Date.now();
    // Request should respond
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('1');
    expect(data().params.str).toBe('b');
    expect(endTs - startTs).toBeLessThanOrEqual(200);

    // Changing both, the latter change should take precedence
    setMutateObj({ num: 3 });
    setMutateObjReactive({ str: 'c' });
    startTs = Date.now();
    await untilCbCalled(onSuccess);
    endTs = Date.now();
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('3');
    expect(data().params.str).toBe('c');
    expect(endTs - startTs).toBeLessThanOrEqual(200);
  });

  test('should send request when `immediate` parameter is set', async () => {
    const alova = getAlovaInstance(null, { responseExpect: r => r.json() }); // Set hook to null or actual value
    const [mutateNum, setMutateNum] = createSignal(0);
    const [mutateStr, setMutateStr] = createSignal('a');

    const [loading, data, downloading, error, onSuccess] = createResource(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum(), str: mutateStr() },
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
          transform: result => result.data,
          cacheFor: 0
        }),
      { immediate: true }
    );

    expect(loading()).toBeTruthy();
    expect(data()).toBeUndefined();
    expect(downloading()).toStrictEqual({ total: 0, loaded: 0 });
    expect(error()).toBeUndefined();

    const mockCallback = jest.fn();
    onSuccess(mockCallback);

    const { method } = await untilCbCalled(onSuccess);
    expect(loading()).toBeFalsy();
    expect(data().path).toBe('/unit-test');
    expect(data().params.num).toBe('0');
    expect(data().params.str).toBe('a');
    expect(downloading()).toStrictEqual({ total: 96, loaded: 96 });
    expect(error()).toBeUndefined();

    // Cache should be undefined
    let cacheData = await queryCache(method);
    expect(cacheData).toBeUndefined();
    expect(mockCallback).toHaveBeenCalledTimes(1);

    setMutateNum(2);
    setMutateStr('c');
    const { method: method2 } = await untilCbCalled(onSuccess);
    expect(data().params.num).toBe('2');
    expect(data().params.str).toBe('c');
    cacheData = await queryCache(method2);
    expect(cacheData).toBeUndefined();
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  test("initial request shouldn't delay when `immediate` and `debounce` are set", async () => {
    const fetcher = createFetcher({
      responseExpect: r => r.json()
    });

    const [mutateNum, setMutateNum] = createSignal(0);
    const [mutateStr, setMutateStr] = createSignal('a');
    const [state, setState] = createSignal({
      loading: false,
      data: undefined,
      error: undefined
    });

    const fetchData = () => {
      setState(prev => ({ ...prev, loading: true }));
      fetcher
        .Get('/unit-test', {
          params: { num: mutateNum(), str: mutateStr() },
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
          transform: result => result.data,
          cacheFor: 0
        })
        .then(data => setState({ loading: false, data, error: undefined }))
        .catch(error => setState({ loading: false, data: undefined, error }));
    };

    createEffect(() => {
      fetchData();
    });

    // Initial request should trigger immediately
    expect(state().loading).toBeTruthy();
    expect(state().data).toBeUndefined();
    expect(state().error).toBeUndefined();

    const mockCallback = jest.fn();
    fetchData().then(() => mockCallback());

    await createDelay(100); // Wait for data processing

    expect(state().loading).toBeFalsy();
    expect(state().data.path).toBe('/unit-test');
    expect(state().data.params.num).toBe('0');
    expect(state().data.params.str).toBe('a');
    expect(state().error).toBeUndefined();
    expect(mockCallback).toHaveBeenCalledTimes(1);

    setMutateNum(2);
    setMutateStr('c');

    // Change should delay request by 200ms, so 150ms should still show old data
    await createDelay(150);
    expect(state().data.params.num).toBe('0');
    expect(state().data.params.str).toBe('a');

    await fetchData(); // Trigger update
    expect(state().data.params.num).toBe('2');
    expect(state().data.params.str).toBe('c');
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  test('should force request when `force` param is set to a function which returns a truthy value', async () => {
    const fetcher = createFetcher({
      responseExpect: r => r.json()
    });

    const [ctrlVal, setCtrlVal] = createSignal(0);
    const getGetterObj = () =>
      fetcher.Get('/unit-test', {
        timeout: 10000,
        transform: ({ data }) => data,
        params: { val: '1' },
        cacheFor: 100 * 1000
      });

    const [state, setState] = createStore({
      data: undefined
    });

    const fetchData = (force = false) => {
      if (force) {
        fetcher.Get('/unit-test', { params: { val: ctrlVal() } }).then(data => setState({ data }));
      }
    };

    // Simulate cached data
    setCache(getGetterObj(), {
      path: '/unit-test',
      method: 'GET',
      params: { val: '-1' },
      data: {}
    });

    setCtrlVal(1);
    await fetchData(); // Simulate request

    expect(state.data.params.val).toBe('-1');

    fetchData(true);
    await fetchData(); // Simulate request
    expect(state.data.params.val).toBe('1');
    const cacheData = await queryCache(getGetterObj);
    expect(cacheData?.params).toStrictEqual({ val: '1' });
  });
  test('should return original return value in on events', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });

    const successFn = jest.fn();
    const errorFn = jest.fn();
    const completeFn = jest.fn();
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
