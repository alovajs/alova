import { getAlovaInstance } from '#/utils';
import { getStateCache } from '@/hooks/core/implements/stateCache';
import { updateState, useRequest, useWatcher } from '@/index';
import SolidHook from '@/statesHook/solid';
import { key } from '@alova/shared/function';
import { fireEvent, render, screen } from '@solidjs/testing-library';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/vue';
import { delay, Result } from 'root/testUtils';
import { createSignal, JSX } from 'solid-js';

describe('update cached response data by user in solid', () => {
  test('the cached response data should be changed and the screen should be update', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      cacheFor: 100000,
      transform: ({ data }: Result) => data
    });

    function Page() {
      const { data, onSuccess } = useRequest(Get, {
        initialData() {
          return alova.l2Cache.get('placeholder-data') || { path: '' };
        }
      });
      onSuccess(() => {
        updateState(Get, data => ({
          ...data,
          path: '/unit-test-updated'
        }));
        alova.l2Cache.set('placeholder-data', {
          ...data,
          path: '/unit-test-updated'
        });
      });
      return <div role="path">{data().path}</div>;
    }
    render(() => (<Page />) as unknown as JSX.Element);
    waitFor(() => {
      screen.findByText(/unit-test/);
    });

    // 延迟检查页面是否有更新
    await delay(100);
    waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test-updated');
      const cacheData = alova.l2Cache.get('placeholder-data') as any;
      expect(cacheData.path).toBe('/unit-test-updated');
    });
  });

  test('front states would be valid when not change their value', async () => {
    const user = userEvent.setup();
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });

    function Page() {
      const [count, setCount] = createSignal(0);
      const { data } = useRequest(Get, {
        initialData: { path: '' }
      });

      return (
        <div>
          <div role="path">{(data as any)().path}</div>
          <button
            role="count"
            onClick={() => setCount(v => v + 1)}>
            {count()}
          </button>
        </div>
      );
    }
    render(() => (<Page />) as unknown as JSX.Element);

    setTimeout(() => {
      screen.findByText(/unit-test/);
    });

    // useRequest返回的状态未改变，此时看看还能不能通过updateState改变来渲染页面
    await user.click(screen.getByRole('count'));

    setTimeout(() => {
      screen.findByText('1');
      // 直接调用 updateState
      updateState(Get, data => ({
        ...data,
        path: '/unit-test-updated'
      }));

      expect(screen.getByRole('path')).toHaveTextContent('/unit-test-updated');
      expect(screen.getByRole('count')).toHaveTextContent('1');
    });
  });

  test('update extra managed states', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });

    function Page() {
      const extraData = createSignal(0);
      // const [extraData, setExtraData] = createSignal(0);
      const extraData2 = 1;
      const { data } = useRequest(Get, {
        initialData: { path: '' },
        managedStates: {
          extraData,
          extraData2: extraData2 as unknown as [number, (value: number) => void]
        } as any
      });
      return (
        <div>
          <div role="path">{data().path}</div>
          <span role="extraData">{extraData[0]()}</span>
        </div>
      );
    }
    render(() => (<Page />) as unknown as JSX.Element);
    waitFor(() => {
      screen.findByText(/unit-test/);
    });

    // 预设状态不能更新
    // await expect(() =>
    //   updateState(Get, {
    //     loading: () => true
    //   })
    // ).rejects.toThrow();

    const result = await updateState(
      alova.Get('/unit-test', {
        transform: ({ data }: Result) => data
      }),
      {
        loading: () => true
      }
    );
    expect(result).toBe(false);

    // 非状态数据不能更新

    const resultExtraData2 = await updateState(
      alova.Get('/unit-test', {
        transform: ({ data }: Result) => data
      }),
      {
        extraData2: () => 1
      }
    );
    expect(resultExtraData2).toBe(false);

    // 未找到状态抛出错误
    const resultExtraData3 = await updateState(
      alova.Get('/unit-test', {
        transform: ({ data }: Result) => data
      }),
      {
        extraData3: () => 1
      }
    );
    expect(resultExtraData3).toBe(false);

    // 更新成功
    await updateState(Get, {
      extraData: () => 1
    });
    waitFor(() => {
      expect(screen.getByRole('extraData')).toHaveTextContent('1');
    });
  });

  test('the request sent by the same use hook should have the same saved states', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const getter = (str1: string) =>
      alova.Get('/unit-test', {
        params: { str1 },
        transform: ({ data }: Result) => data
      });

    const successMockFn = jest.fn();
    function Page() {
      const [strState, setStrState] = createSignal('a');
      const { data, loading, onSuccess } = useWatcher(() => getter(strState()), [strState], {
        initialData: { path: '', method: '', params: {} },
        immediate: true
      });
      onSuccess(successMockFn);
      return (
        <div>
          <div>{loading() ? 'loading...' : 'loaded'}</div>
          <div role="path">{data().path}</div>
          <div>{strState()}</div>
          <button
            role="btnUpd"
            onClick={() => setStrState('b')}>
            update state
          </button>
        </div>
      );
    }
    render(() => (<Page />) as unknown as JSX.Element);
    waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(screen.getByRole('btnUpd'));
    waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
    });

    // 执行了两次不同参数的请求后，验证两次请求是否缓存了相同的states
    updateState(getter('a'), {
      data: d => ({
        ...d,
        path: '/path-str-a'
      })
    });

    waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/path-str-a');
    });
    updateState(getter('b'), {
      data: d => ({
        ...d,
        path: '/path-str-b'
      })
    });

    waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/path-str-b');
      // 两处缓存的状态应该都是最新值
      expect(getStateCache(alova.id, key(getter('a'))).s.data.v.path).toBe('/path-str-b');
      expect(getStateCache(alova.id, key(getter('b'))).s.data.v.path).toBe('/path-str-b');
    });
  });

  test('all saved states in unmounted component will be removed', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const getter = (str1: string) =>
      alova.Get('/unit-test', {
        params: { str1 },
        transform: ({ data }: Result) => data
      });

    const successMockFn = jest.fn();
    function Page() {
      const [strState, setStrState] = createSignal('a');
      const { data, loading, onSuccess } = useWatcher(() => getter(strState()), [strState], {
        initialData: { path: '', method: '', params: {} },
        immediate: true
      });
      onSuccess(successMockFn);
      return (
        <div>
          <div>{loading() ? 'loading...' : 'loaded'}</div>
          <div role="path">{data().path}</div>
          <div>{strState()}</div>
          <button
            role="btnUpd"
            onClick={() => setStrState('b')}>
            update state
          </button>
        </div>
      );
    }

    const { unmount } = render(() => (<Page />) as unknown as JSX.Element);
    waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
      expect(getStateCache(alova.id, key(getter('a')))).not.toBeUndefined();
    });
    fireEvent.click(screen.getByRole('btnUpd'));
    waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(getStateCache(alova.id, key(getter('b')))).not.toBeUndefined();
    });

    // 组件卸载后，对应缓存状态会被删除
    unmount();
    waitFor(() => {
      // 空对象表示未匹配到
      expect(getStateCache(alova.id, key(getter('a')))).toStrictEqual({});
      expect(getStateCache(alova.id, key(getter('b')))).toStrictEqual({});
    });
  });
});
