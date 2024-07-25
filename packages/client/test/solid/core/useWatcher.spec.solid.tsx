import { useWatcher } from '@/index';
import SolidHook from '@/statesHook/solid';
import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library';
import { queryCache } from 'alova';
import { delay, Result, untilCbCalled } from 'root/testUtils';
import { createMemo, createSignal, JSX } from 'solid-js';
import getAlovaInstance from '~/test/utils';

function createDelay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms);
  });
}
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

    expect(loading).toBeFalsy();
    expect(data).toBeUndefined();
    expect(error).toBeUndefined();

    await delay(10);
    setMutateNum(1);
    setMutateStr('b');

    const { method } = await untilCbCalled(onSuccess);
    expect(loading).toBeFalsy();
    expect(data.path).toBe('/unit-test');
    expect(data.params.num).toBe('1');
    expect(data.params.str).toBe('b');
    expect(error).toBeUndefined();

    let cacheData = await queryCache(method);
    expect(cacheData?.path).toBe('/unit-test');
    expect(cacheData?.params).toStrictEqual({ num: '1', str: 'b' });
    expect(mockCallback.mock.calls.length).toBe(1);

    setMutateNum(2);
    setMutateStr('c');

    const { method: method2 } = await untilCbCalled(onSuccess);
    expect(data.params.num).toBe('2');
    expect(data.params.str).toBe('c');
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

    expect(loading).toBeFalsy();
    expect(data).toBeUndefined();
    expect(error).toBeUndefined();

    await delay(10);
    i += 1;
    setMutateNum(1);
    setMutateStr('b');

    await delay(10);

    i += 1;
    setMutateNum(2);
    setMutateStr('c');
    await untilCbCalled(onSuccess);
    expect(data.params.num).toBe('2');
    expect(data.params.str).toBe('c');
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

    expect(loading).toBeFalsy();
    expect(data).toBeUndefined();
    expect(error).toBeUndefined();

    await delay(10);
    i += 1;
    setMutateNum(1);
    setMutateStr('b');

    await delay(10);

    i += 1;
    setMutateNum(2);
    setMutateStr('c');
    await untilCbCalled(onSuccess);
    expect(data.params.num).toBe('2');
    expect(data.params.str).toBe('c');
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockErrorCallback).not.toHaveBeenCalled();
    expect(error).toBeUndefined();
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

    expect(loading).toBeFalsy();
    expect(data).toBeUndefined();
    expect(error).toBeUndefined();

    await delay(10);
    i += 1;
    setMutateNum(1);
    setMutateStr('b');
    await delay(10);

    i += 1;
    setMutateNum(2);
    setMutateStr('c');
    await delay(1100);
    expect(data.params.num).toBe('1');
    expect(data.params.str).toBe('b');
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

    expect(loading).toBeFalsy();
    expect(data).toBeUndefined();
    expect(error).toBeUndefined();
    expect(sendableFn).not.toHaveBeenCalled();

    await delay(10);
    setMutateNum(1);
    setMutateStr('b');

    await untilCbCalled(onSuccess);
    expect(loading).toBeFalsy();
    expect(data.path).toBe('/unit-test');
    expect(data.params.num).toBe('1');
    expect(data.params.str).toBe('b');
    expect(error).toBeUndefined();
    expect(sendableFn).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledTimes(1);

    setMutateNum(2);
    setMutateStr('c');
    await delay(50);
    expect(data.params.num).toBe('1');
    expect(data.params.str).toBe('b');
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

    expect(loading).toBeFalsy();
    expect(data).toBeUndefined();
    expect(error).toBeUndefined();
    expect(sendableFn).not.toHaveBeenCalled();

    await delay(10);
    setMutateNum(1);
    setMutateStr('b');
    await delay(50);
    expect(loading).toBeFalsy();
    expect(data).toBeUndefined();
    expect(error).toBeUndefined();
    expect(sendableFn).toHaveBeenCalledTimes(1);
    expect(mockCallback).not.toHaveBeenCalled();

    setMutateNum(2);
    setMutateStr('c');
    await delay(50);
    expect(loading).toBeFalsy();
    expect(data).toBeUndefined();
    expect(error).toBeUndefined();
    expect(sendableFn).toHaveBeenCalledTimes(2);
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('发送请求后 loading 状态应为 false', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const mutateNum = createSignal(0);
    const mutateStr = createSignal('a');
    const sendableFn = jest.fn();
    const { loading } = useWatcher(
      () =>
        alova.Get('/unit-test', {
          params: { num: mutateNum, str: mutateStr },
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
    expect(loading).toBeFalsy();
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
    expect(data).toBeDefined();
    expect(data.path).toBe('/unit-test');
    expect(data.params.num).toBe('0');
    expect(data.params.str).toBe('a');
    expect(error).toBeUndefined();
    expect(successMockFn).toHaveBeenCalledTimes(1);

    setMutateNum(2);
    setMutateStr('c');
    await untilCbCalled(onSuccess);

    expect(data).toBeDefined();
    expect(data.path).toBe('/unit-test');
    expect(data.params.num).toBe('0');
    expect(data.params.str).toBe('a');
    expect(error).toBeUndefined();
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

    expect(loading).toBeFalsy();
    expect(data).toBeUndefined();
    expect(error).toBeUndefined();

    setMutateObj({ num: 1 });
    await untilCbCalled(onSuccess);
    expect(loading).toBeFalsy();
    expect(data).toBeDefined();
    expect(data.path).toBe('/unit-test');
    expect(data.params.num).toBe('1');
    expect(data.params.str).toBe('');
    expect(error).toBeUndefined();

    setMutateObj({ num: 2 });
    setMutateObjReactive({ str: 'c' });
    await untilCbCalled(onSuccess);
    expect(data).toBeDefined();
    expect(data.params.num).toBe('2');
    expect(data.params.str).toBe('c');
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

    expect(loading).toBeFalsy();
    expect(data).toBeUndefined();
    expect(error).toBeUndefined();

    setMutateNum(1);
    await untilCbCalled(onSuccess);
    expect(loading).toBeFalsy();
    expect(data).toBeDefined();
    expect(data.path).toBe('/unit-test');
    expect(data.params.str).toBe('str2');
    expect(error).toBeUndefined();

    setMutateNum(0);
    await untilCbCalled(onSuccess);
    expect(data.params.str).toBe('str1');
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
      expect(loading).toBeFalsy();
      expect(data).toBeUndefined();
      expect(error).toBeUndefined();
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
    expect(loading).toBeFalsy();
    expect(data).toBeDefined();
    expect(data.path).toBe('/unit-test');
    expect(data.params.num).toBe('2');
    expect(data.params.str).toBe('c');
    expect(error).toBeUndefined();
    expect(Date.now() - startTs).toBeLessThanOrEqual(200); // 实际异步时间会较长

    // 缓存中应有值
    const cacheData = await queryCache(method);
    expect(cacheData?.path).toBe('/unit-test');
    expect(cacheData?.params).toStrictEqual({ num: '2', str: 'c' });
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('in different debounce time when set param debounce to be an array', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });

    const getter = (id1: Number, id2: Number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        timeout: 10000,
        transform: ({ data }: Result<true>) => data,
        cacheFor: 100 * 1000
      });

    const successMockFn = jest.fn();
    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);
      const [pending, setPending] = createSignal(false);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1(), stateId2()), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        },
        debounce: [500, 200]
      });

      onSuccess(() => {
        successMockFn();
        setPending(false);
      });

      return (
        <div role="wrap">
          <span>{pending() ? 'pending' : 'pended'}</span>
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data.path}</span>
          <span role="id1">{data.params.id1}</span>
          <span role="id2">{data.params.id2}</span>
          <button
            role="btn1"
            onClick={() => {
              setStateId1(stateId1() + 1);
              setPending(true);
            }}>
            btn1
          </button>
          <button
            role="btn2"
            onClick={() => {
              setStateId2(stateId2() + 1);
              setPending(true);
            }}>
            btn2
          </button>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);

    await waitFor(() => {
      // 暂没发送请求
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(successMockFn).not.toHaveBeenCalled();
    });

    await untilCbCalled(setTimeout); // 由于SolidHook中异步更改触发条件，因此需要异步改变状态才可以触发请求
    fireEvent.click(screen.getByRole('btn1'));
    let startTs = Date.now();
    await waitFor(() => {
      // 请求已响应
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('10');
      expect(endTs - startTs).toBeLessThan(600);
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      // 请求已响应
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(endTs - startTs).toBeLessThan(300);
      expect(successMockFn).toHaveBeenCalledTimes(2);
    });

    // 同时改变，以后一个为准
    fireEvent.click(screen.getByRole('btn1'));
    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(endTs - startTs).toBeLessThan(300);
      expect(successMockFn).toHaveBeenCalledTimes(3);
    });
  });

  test('set param debounce to be an array that contains an item', async () => {
    const alova = getAlovaInstance(SolidHook, { responseExpect: r => r.json() });

    const successMockFn = jest.fn();

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);
      const [pending, setPending] = createSignal(false);

      const { loading, data, onSuccess } = useWatcher(
        () =>
          alova.Get('/unit-test', {
            params: { id1: stateId1(), id2: stateId2() },
            transform: ({ data }: Result<true>) => data,
            cacheFor: 100 * 1000
          }),
        [stateId1, stateId2],
        {
          initialData: {
            path: '',
            params: { id1: '', id2: '' }
          },
          debounce: [300]
        }
      );

      onSuccess(() => {
        successMockFn();
        setPending(false);
      });

      return (
        <div role="wrap">
          <span>{pending() ? 'pending' : 'pended'}</span>
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data?.path}</span>
          <span role="id1">{data?.params.id1}</span>
          <span role="id2">{data?.params.id2}</span>
          <button
            role="btn1"
            onClick={() => {
              setStateId1(stateId1() + 1);
              setPending(true);
            }}>
            btn1
          </button>
          <button
            role="btn2"
            onClick={() => {
              setStateId2(stateId2() + 1);
              setPending(true);
            }}>
            btn2
          </button>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);

    await createDelay(10); // 等待初始化

    expect(screen.getByRole('path')).toHaveTextContent('');
    expect(screen.getByRole('id1')).toHaveTextContent('');
    expect(screen.getByRole('id2')).toHaveTextContent('');
    expect(successMockFn).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('btn1'));
    let startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('10');
      expect(endTs - startTs).toBeGreaterThanOrEqual(300);
      expect(endTs - startTs).toBeLessThan(450);
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(endTs - startTs).toBeLessThan(100);
      expect(successMockFn).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(screen.getByRole('btn1'));
    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(endTs - startTs).toBeLessThan(100);
      expect(successMockFn).toHaveBeenCalledTimes(3);
    });
  });
  test('should request only once when debounce is set', async () => {
    const alova = getAlovaInstance(SolidHook, { responseExpect: r => r.json() });

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);

      const { loading, data, send } = useWatcher(
        () =>
          alova.Get('/unit-test', {
            params: {
              id1: stateId1(),
              id2: stateId2()
            },
            timeout: 10000,
            transform: ({ data }: Result<true>) => data,
            cacheFor: 100 * 1000
          }),
        [stateId1, stateId2],
        {
          debounce: 500,
          initialData: {
            path: '',
            params: { id1: '', id2: '' }
          }
        }
      );

      return (
        <div role="wrap">
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data?.path}</span>
          <span role="id1">{data?.params.id1}</span>
          <span role="id2">{data?.params.id2}</span>
          <button
            onClick={() => {
              setStateId1(stateId1() + 1);
              setTimeout(() => setStateId2(11), 100);
              setTimeout(() => setStateId2(12), 200);
              setTimeout(() => setStateId2(13), 300);
            }}>
            btn
          </button>
          <button
            role="btn2"
            onClick={() => send()}>
            btn2
          </button>
        </div>
      );
    }

    const startTs = Date.now();
    render(() => (<Page />) as unknown as JSX.Element);

    fireEvent.click(screen.getByText('btn'));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('13');
      expect(Date.now() - startTs).toBeGreaterThan(500);
    });
  });
});
