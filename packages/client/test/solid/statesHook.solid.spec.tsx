import { getAlovaInstance } from '#/utils';
import Solidhook from '@/statesHook/solid';
import { waitFor } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { ReferingObject } from 'alova';
import { useRequest, useWatcher } from 'alova/client';
import { delay, Result, untilCbCalled } from 'root/testUtils';
import { createRoot, createSignal } from 'solid-js';
import { vi } from 'vitest';

const user = userEvent.setup();
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
    await createRoot(async dispose => {
      const { loading, data, onSuccess } = useRequest(alova.Get<Result>('/unit-test'));
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
      dispose();
    });
  });

  test('computed states', async () => {
    await createRoot(async dispose => {
      const [count, setCount] = createSignal(1);
      const computedState = Solidhook.computed(() => count() * 2, [], 'computed', referingObject);
      const [computedGetter] = computedState;
      expect(computedGetter()).toBe(2);
      setCount(2);
      await delay(10);
      await waitFor(() => {
        expect(computedGetter()).toBe(4);
        expect(Solidhook.export?.(computedState, referingObject)).toBe(computedGetter);
        expect(Solidhook.dehydrate(computedState, 'computed', referingObject)).toBe(computedGetter());
      });
      dispose();
    });
  });

  // test('states should be removed from cache when component is unmounted', async () => {
  //   // test onCleanup in effectRequest
  //   const alova = getAlovaInstance(Solidhook, {
  //     responseExpect: r => r.json()
  //   });
  //   const Get = alova.Get('unit-test', {
  //     transform: ({ data }: Result) => data
  //   });
  //   function Page() {
  //     const { data, loading } = useRequest(Get);
  //     return <div role="cell">{loading() ? 'loading...' : JSON.stringify(data)}</div>;
  //   }
  //   const { unmount } = render(() => (<Page />) as unknown as JSX.Element);

  //   // useRequest内会缓存状态
  //   await waitFor(() => {
  //     const { s: { data } = { data: null } } = getStateCache(alova.id, key(Get));
  //     expect(data?.v.path).toBe('/unit-test');
  //   });
  //   unmount();
  //   await waitFor(() => {
  //     // 当DataConsole组件卸载时，会同步清除state缓存，避免内存泄露，空对象表示未匹配到
  //     expect(getStateCache(alova.id, key(Get))).toStrictEqual({});
  //   });
  // });

  // test('test update function', async () => {
  //   // test dehydrate
  //   const alova = getAlovaInstance(Solidhook, {
  //     responseExpect: r => r.json()
  //   });
  //   const Get = alova.Get('/unit-test', {
  //     cacheFor: 100000,
  //     transform: ({ data }: Result) => data
  //   });
  //   const { data, onSuccess } = useRequest(Get);
  //   await untilCbCalled(onSuccess);
  //   const updated = await updateState(Get, responseData => {
  //     responseData.path = '/unit-test-updated';
  //     return responseData;
  //   });
  //   expect(data().path).toBe('/unit-test-updated');
  //   expect(updated).toBeTruthy();
  // });

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

    return createRoot(async dispose => {
      const successMockFn = vi.fn();
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);
      const { loading, data, send } = useWatcher(() => getter(stateId1(), stateId2()), [stateId1, stateId2], {
        immediate: true,
        debounce: 200,
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        }
      }).onSuccess(successMockFn);
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

      dispose();
    });
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

    return createRoot(async dispose => {
      const successMockFn = vi.fn();
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);
      const { loading, data } = useWatcher(() => getter(stateId1(), stateId2()), [stateId1, stateId2], {
        debounce: [200, 300],
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        }
      }).onSuccess(successMockFn);
      await delay(); // 等待组件挂载
      expect(loading()).toBeFalsy();

      setStateId1(stateId1() + 1);
      let startTs = Date.now();
      await waitFor(
        () => {
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
        },
        { timeout: 10000 }
      );

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

      dispose();
    });
  });

  test('should call mounted and unmounted hooks when component is mounted or unmounted', async () => {
    // test mounted and unmounted
    // 注意: mounted钩子只能在组件挂载时调用一次，监听数据变化不会再调用，而unmounted钩子只能在组件卸载时调用一次
    // ...
  });
});
