import { getAlovaInstance } from '#/utils';
import { getStateCache } from '@/hooks/core/implements/stateCache';
import { updateState, useRequest, useWatcher } from '@/index';
import Solidhook from '@/statesHook/solid';
import { key } from '@alova/shared/function';
import { render, screen } from '@solidjs/testing-library';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/vue';
import { ReferingObject } from 'alova';
import { delay, Result, untilCbCalled } from 'root/testUtils';
import { createSignal, JSX } from 'solid-js';

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
    // 已通过
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
  });

  test('computed states', async () => {
    // const Mycomputed = (getter: () => any, depList: any[]) => createMemo(getter, depList);
    // const [count, setCount] = createSignal(1);
    // const computedState = Mycomputed(() => count() * 2, []);
    // const computedGetter = computedState;
    const [count, setCount] = createSignal(1);
    const computedState = Solidhook.computed(() => count() * 2, [], 'computed', referingObject);
    const [computedGetter] = computedState;
    expect(computedGetter()).toBe(2);
    setCount(2);
    await delay(10);
    waitFor(() => {
      expect(computedGetter()).toBe(4);

      expect(Solidhook.export?.(computedState, referingObject)).toBe(computedGetter);
      expect(Solidhook.dehydrate(computedState, 'computed', referingObject)).toBe(computedGetter());
    });
    // return testEffect(done =>
    //   createEffect((run: number = 0) => {
    //     if (run === 0) {
    //       // expect(computedGetter()).toBe(2);
    //       setCount(2);
    //     } else if (run === 1) {
    //       expect(computedGetter()).toBe(4);
    //       // expect(Solidhook.export?.(computedState, referingObject)).toBe(computedGetter);
    //       // expect(Solidhook.dehydrate(computedState, 'computed', referingObject)).toBe(computedGetter());
    //       done();
    //     }
    //     return run + 1;
    //   })
    // );
  });

  test('states should be removed from cache when component is unmounted', async () => {
    // test onCleanup in effectRequest
    const alova = getAlovaInstance(Solidhook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('unit-test', {
      transform: ({ data }: Result) => data
    });
    function Page() {
      const { data, loading } = useRequest(Get);
      return <div role="cell">{loading() ? 'loading...' : JSON.stringify(data)}</div>;
    }
    const { unmount } = render(() => (<Page />) as unknown as JSX.Element);

    // useRequest内会缓存状态
    await waitFor(() => {
      const { s: { data } = { data: null } } = getStateCache(alova.id, key(Get));
      expect(data?.v.path).toBe('/unit-test');
    });
    unmount();
    await waitFor(() => {
      // 当DataConsole组件卸载时，会同步清除state缓存，避免内存泄露，空对象表示未匹配到
      expect(getStateCache(alova.id, key(Get))).toStrictEqual({});
    });
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
    const { data, onSuccess } = useRequest(Get);
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

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);

      const { loading, data, send } = useWatcher(() => getter(stateId1(), stateId2()), [stateId1, stateId2], {
        immediate: true,
        debounce: 500,
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        }
      });

      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data()?.path}</span>
          <span role="id1">{data()?.params.id1}</span>
          <span role="id2">{data()?.params.id2}</span>
          <button
            onClick={() => {
              setStateId1(stateId1() + 1);
              setStateId2(stateId2() + 1);
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

    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('0');
      expect(screen.getByRole('id2')).toHaveTextContent('10');
    });

    // Check that the request was made almost immediately
    expect(Date.now() - startTs).toBeLessThan(150);
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
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data()?.path}</span>
          <span role="id1">{data()?.params.id1}</span>
          <span role="id2">{data()?.params.id2}</span>
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

    waitFor(() => {
      // Request hasn't been sent yet
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(successMockFn).not.toHaveBeenCalled();
    });

    // Simulate state change
    userEvent.click(screen.getByRole('btn1'));
    let startTs = Date.now();
    waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('10');
      expect(endTs - startTs).toBeLessThan(600);
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    // Simulate another state change
    userEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(endTs - startTs).toBeLessThan(300);
      expect(successMockFn).toHaveBeenCalledTimes(2);
    });

    // Simultaneous state changes
    userEvent.click(screen.getByRole('btn1'));
    userEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(endTs - startTs).toBeLessThan(300);
      expect(successMockFn).toHaveBeenCalledTimes(3);
    });
  });

  test('should call mounted and unmounted hooks when component is mounted or unmounted', async () => {
    // test mounted and unmounted
    // 注意: mounted钩子只能在组件挂载时调用一次，监听数据变化不会再调用，而unmounted钩子只能在组件卸载时调用一次
    // ...
  });
});
