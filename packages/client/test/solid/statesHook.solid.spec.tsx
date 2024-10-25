import { getAlovaInstance } from '#/utils';
import { getStateCache } from '@/hooks/core/implements/stateCache';
import { updateState, useRequest, useWatcher } from '@/index';
import Solidhook from '@/statesHook/solid';
import { renderHook, waitFor } from '@solidjs/testing-library';
import { ReferingObject } from 'alova';
import { delay, Result, untilCbCalled } from 'root/testUtils';
import { createRoot, createSignal } from 'solid-js';
import { vi } from 'vitest';

const referingObject: ReferingObject = {
  trackedKeys: {},
  bindError: false
};
const alova = getAlovaInstance(Solidhook, {
  responseExpect: r => r.json()
});
describe('Solid statesHook', () => {
  test('send GET', async () => {
    // test states, export, update, effectRequest request
    const {
      result: { loading, data, onSuccess }
    } = renderHook(useRequest, {
      initialProps: [alova.Get<Result>('/unit-test')]
    });

    expect(loading()).toBeTruthy();
    expect(data()).toBeUndefined();
    await untilCbCalled(onSuccess);
    expect(data()).toStrictEqual({
      code: 200,
      data: {
        method: 'GET',
        params: {},
        path: '/unit-test'
      },
      msg: ''
    });
    expect(loading()).toBeFalsy();
  });

  test('computed states', async () =>
    createRoot(dispose => {
      const [count, setCount] = createSignal(1);
      const computedState = Solidhook.computed(() => count() * 2, [], 'computed', referingObject);
      const [computedGetter] = computedState;
      expect(computedGetter()).toBe(2);
      setCount(2);
      expect(computedGetter()).toBe(4);
      expect(Solidhook.export?.(computedState, referingObject)).toBe(computedGetter);
      expect(Solidhook.dehydrate(computedState, 'computed', referingObject)).toBe(computedGetter());
      dispose();
    }));

  test('states should be removed from cache when component is unmounted', async () => {
    // test onCleanup in effectRequest
    const alova = getAlovaInstance(Solidhook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('unit-test', {
      transform: ({ data }: Result) => data
    });

    const {
      result: { data: rrr, onSuccess },
      cleanup
    } = renderHook(useRequest, {
      initialProps: [Get]
    });

    await untilCbCalled(onSuccess);
    expect(rrr().method).toBe('GET');
    const { s: { data } = { data: null } } = getStateCache(alova.id, Get.key);
    expect(data?.v.path).toBe('/unit-test');
    cleanup();
    // 当DataConsole组件卸载时，会同步清除state缓存，避免内存泄露，空对象表示未匹配到
    expect(getStateCache(alova.id, Get.key)).toStrictEqual({});
  });

  test('test update function', async () => {
    // test dehydrate
    const alova = getAlovaInstance(Solidhook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: 100000,
      transform: ({ data }: Result) => data
    });
    const {
      result: { data, onSuccess }
    } = renderHook(useRequest, {
      initialProps: [Get]
    });
    await untilCbCalled(onSuccess);
    const updated = await updateState(Get, responseData => {
      responseData.path = '/unit-test-updated';
      return responseData;
    });
    expect(data().path).toBe('/unit-test-updated');
    expect(updated).toBeTruthy();
  });

  test("initial request shouldn't delay when set the `immediate` and `debounce`", async () => {
    // test effectRequest request in useWatcher
    const alova = getAlovaInstance(Solidhook, {
      responseExpect: r => r.json()
    });

    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        timeout: 10000,
        transform: ({ data }: Result<true>) => data,
        cacheFor: 100 * 1000
      });

    const successMockFn = vi.fn();
    const [stateId1, setStateId1] = createSignal(0);
    const [stateId2, setStateId2] = createSignal(10);
    const {
      result: { loading, data, send, onSuccess }
    } = renderHook(useWatcher, {
      initialProps: [
        () => getter(stateId1(), stateId2()),
        [stateId1, stateId2],
        {
          immediate: true,
          debounce: 200,
          initialData: {
            path: '',
            params: { id1: '', id2: '' }
          }
        }
      ]
    });

    onSuccess(successMockFn);
    expect(loading()).toBeTruthy();
    let startTs = Date.now();
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
      expect(loading()).toBeFalsy();
      expect(data()).toStrictEqual({
        method: 'GET',
        params: {
          id1: '0',
          id2: '10'
        },
        path: '/unit-test'
      });
    });

    // Check that the request was made almost immediately
    expect(Date.now() - startTs).toBeLessThan(100);

    startTs = Date.now();
    setStateId1(stateId1() + 1);
    setStateId2(stateId2() + 1);
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(loading()).toBeFalsy();
      expect(data()).toStrictEqual({
        method: 'GET',
        params: {
          id1: '1',
          id2: '11'
        },
        path: '/unit-test'
      });
    });
    expect(Date.now() - startTs).toBeGreaterThan(200);

    startTs = Date.now();
    send();
    // will not delay request when call send
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(3);
      expect(loading()).toBeFalsy();
      expect(data()).toStrictEqual({
        method: 'GET',
        params: {
          id1: '1',
          id2: '11'
        },
        path: '/unit-test'
      });
    });
    expect(Date.now() - startTs).toBeLessThan(100);
  });
  test('in different debounce time when set param debounce to be an array', async () => {
    // different debounce can be effective
    const alova = getAlovaInstance(Solidhook, {
      responseExpect: r => r.json()
    });

    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        timeout: 10000,
        transform: ({ data }: Result<true>) => data,
        cacheFor: 100 * 1000
      });

    const successMockFn = vi.fn();
    const [stateId1, setStateId1] = createSignal(0);
    const [stateId2, setStateId2] = createSignal(10);
    const {
      result: { loading, data, onSuccess }
    } = renderHook(useWatcher, {
      initialProps: [
        () => getter(stateId1(), stateId2()),
        [stateId1, stateId2],
        {
          debounce: [200, 300],
          initialData: {
            path: '',
            params: { id1: '', id2: '' }
          }
        }
      ]
    });

    onSuccess(successMockFn);
    await delay(); // waiting for mount
    expect(loading()).toBeFalsy();

    setStateId1(stateId1() + 1);
    let startTs = Date.now();
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
      expect(loading()).toBeFalsy();
      expect(data()).toStrictEqual({
        method: 'GET',
        params: {
          id1: '1',
          id2: '10'
        },
        path: '/unit-test'
      });
    });
    expect(Date.now() - startTs).toBeGreaterThan(200);

    startTs = Date.now();
    setStateId2(stateId2() + 1);
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(loading()).toBeFalsy();
      expect(data()).toStrictEqual({
        method: 'GET',
        params: {
          id1: '1',
          id2: '11'
        },
        path: '/unit-test'
      });
    });
    expect(Date.now() - startTs).toBeGreaterThan(300);
  });

  test('should watch the states changed', async () => {
    const watchingMockFn = vi.fn();
    const {
      result: { setStateId1, setStateId2 }
    } = renderHook(() => {
      const [state1, setStateId1] = createSignal(0);
      const [state2, setStateId2] = createSignal(5);
      Solidhook.watch([state1, state2], watchingMockFn, referingObject);
      return {
        setStateId1,
        setStateId2
      };
    });
    setStateId1(1);
    await delay();
    expect(watchingMockFn).toHaveBeenCalledTimes(1);
    setStateId2(6);
    await delay();
    expect(watchingMockFn).toHaveBeenCalledTimes(2);
    setStateId1(2);
    setStateId2(7);
    await delay();
    expect(watchingMockFn).toHaveBeenCalledTimes(3);
  });

  test('should call mounted and unmounted hooks when component is mounted or unmounted', async () => {
    // test mounted and unmounted
    // mounted钩子只能在组件挂载时调用一次，监听数据变化不会再调用，而unmounted钩子只能在组件卸载时调用一次
    const mountedMockFn = vi.fn();
    const unmountMockFn = vi.fn();
    const { result: setCount, cleanup } = renderHook(() => {
      const [count, setCount] = createSignal(0);
      Solidhook.onMounted(() => {
        count();
        mountedMockFn();
      }, referingObject);
      Solidhook.onUnmounted(() => {
        count();
        unmountMockFn();
      }, referingObject);
      return setCount;
    });
    await delay();
    expect(mountedMockFn).toHaveBeenCalledTimes(1);
    setCount(1);
    await delay();
    expect(mountedMockFn).toHaveBeenCalledTimes(1);
    expect(unmountMockFn).not.toHaveBeenCalled();
    cleanup();
    await delay();
    expect(mountedMockFn).toHaveBeenCalledTimes(1);
    expect(unmountMockFn).toHaveBeenCalledTimes(1);
  });
});
