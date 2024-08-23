import { getAlovaInstance } from '#/utils';
import { getStateCache } from '@/hooks/core/implements/stateCache';
import { updateState, useRequest, useWatcher } from '@/index';
import ReactHook from '@/statesHook/react';
import { key } from '@alova/shared/function';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { ReactElement, useState } from 'react';
import { Result, delay } from 'root/testUtils';

describe('update cached response data by user in react', () => {
  test('the cached response data should be changed and the screen should be update', async () => {
    const alova = getAlovaInstance(ReactHook, {
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
      return <div role="path">{data.path}</div>;
    }
    render((<Page />) as ReactElement<any, any>);
    await screen.findByText(/unit-test/);

    // 延迟检查页面是否有更新
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test-updated');
    });
    const cacheData = alova.l2Cache.get('placeholder-data') as any;
    expect(cacheData.path).toBe('/unit-test-updated');
  });

  test('front states would be valid when not change their value', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });

    function Page() {
      const [count, setCount] = useState(0);
      const { data } = useRequest(Get, {
        initialData: { path: '' }
      });

      return (
        <div>
          <div role="path">{data.path}</div>
          <button
            role="count"
            onClick={() => {
              setCount(v => v + 1);
            }}>
            {count}
          </button>
        </div>
      );
    }
    render((<Page />) as ReactElement<any, any>);
    await screen.findByText(/unit-test/);

    // useRequest返回的状态未改变，此时看看还能不能通过updateState改变来渲染页面
    fireEvent.click(screen.getByRole('count'));
    await screen.findByText('1');

    act(() => {
      updateState(Get, data => ({
        ...data,
        path: '/unit-test-updated'
      }));
    });
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test-updated');
    expect(screen.getByRole('count')).toHaveTextContent('1');
  });

  test('update extra managed states', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });

    function Page() {
      const extraData = useState(0);
      const extraData2 = 1;
      const { data } = useRequest(Get, {
        initialData: { path: '' },
        managedStates: {
          extraData,
          extraData2: extraData2 as unknown as [number, React.Dispatch<React.SetStateAction<number>>]
        } as any
      });
      return (
        <div>
          <div role="path">{data.path}</div>
          <span role="extraData">{extraData[0]}</span>
        </div>
      );
    }
    render((<Page />) as ReactElement<any, any>);
    await screen.findByText(/unit-test/);

    // 非状态数据不能更新
    await expect(() =>
      updateState(Get, {
        extraData2: () => 1
      })
    ).rejects.toThrow();

    // 未找到状态抛出错误
    await expect(() =>
      updateState(Get, {
        extraData3: () => 1
      })
    ).rejects.toThrow();

    // 更新成功
    delay().then(() => {
      updateState(Get, {
        extraData: () => 1
      });
    });
    await waitFor(() => {
      expect(screen.getByRole('extraData')).toHaveTextContent('1');
    });
  });

  test('the request sent by the same use hook should have the same saved states', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (str1: string) =>
      alova.Get('/unit-test', {
        params: { str1 },
        transform: ({ data }: Result) => data
      });

    const successMockFn = jest.fn();
    function Page() {
      const [strState, setStrState] = useState('a');
      const { data, loading, onSuccess } = useWatcher(() => getter(strState), [strState], {
        initialData: { path: '', method: '', params: {} },
        immediate: true
      });
      onSuccess(successMockFn);
      return (
        <div>
          <div>{loading ? 'loading...' : 'loaded'}</div>
          <div role="path">{data.path}</div>
          <div>{strState}</div>
          <button
            role="btnUpd"
            onClick={() => setStrState('b')}>
            update state
          </button>
        </div>
      );
    }
    render((<Page />) as ReactElement<any, any>);
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(screen.getByRole('btnUpd'));
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
    });

    // 执行了两次不同参数的请求后，验证两次请求是否缓存了相同的states
    delay().then(() => {
      updateState(getter('a'), {
        data: d => ({
          ...d,
          path: '/path-str-a'
        })
      });
    });
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/path-str-a');
    });
    delay().then(() => {
      updateState(getter('b'), {
        data: d => ({
          ...d,
          path: '/path-str-b'
        })
      });
    });
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/path-str-b');

      // 两处缓存的状态应该都是最新值
      expect(getStateCache(alova.id, key(getter('a'))).s.data.v.path).toBe('/path-str-b');
      expect(getStateCache(alova.id, key(getter('b'))).s.data.v.path).toBe('/path-str-b');
    });
  });

  test('all saved states in unmounted component will be removed', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (str1: string) =>
      alova.Get('/unit-test', {
        params: { str1 },
        transform: ({ data }: Result) => data
      });

    const successMockFn = jest.fn();
    function Page() {
      const [strState, setStrState] = useState('a');
      const { data, loading, onSuccess } = useWatcher(() => getter(strState), [strState], {
        initialData: { path: '', method: '', params: {} },
        immediate: true
      });
      onSuccess(successMockFn);
      return (
        <div>
          <div>{loading ? 'loading...' : 'loaded'}</div>
          <div role="path">{data.path}</div>
          <div>{strState}</div>
          <button
            role="btnUpd"
            onClick={() => setStrState('b')}>
            update state
          </button>
        </div>
      );
    }

    const { unmount } = render((<Page />) as ReactElement<any, any>);
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(1);
      expect(getStateCache(alova.id, key(getter('a')))).not.toBeUndefined();
    });
    fireEvent.click(screen.getByRole('btnUpd'));
    await waitFor(() => {
      expect(successMockFn).toHaveBeenCalledTimes(2);
      expect(getStateCache(alova.id, key(getter('b')))).not.toBeUndefined();
    });

    // 组件卸载后，对应缓存状态会被删除
    unmount();
    await waitFor(() => {
      // 空对象表示未匹配到
      expect(getStateCache(alova.id, key(getter('a')))).toStrictEqual({});
      expect(getStateCache(alova.id, key(getter('b')))).toStrictEqual({});
    });
  });
});
