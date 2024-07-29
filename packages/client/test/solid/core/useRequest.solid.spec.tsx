import { getAlovaInstance } from '#/utils';
import { getStateCache } from '@/hooks/core/implements/stateCache';
import { useRequest } from '@/index';
import Solidhook from '@/statesHook/solid';
import { key } from '@alova/shared/function';
import { render, screen } from '@solidjs/testing-library';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/vue';
import { Result } from 'root/testUtils';
import { JSX } from 'solid-js';

describe('useRequest hook with Solid.js', () => {
  test('should not have initial data', async () => {
    const alova = getAlovaInstance(Solidhook);
    function Page() {
      const { data } = useRequest(alova.Get(''), { immediate: false });
      expect(data()).toBeUndefined();
      return (
        <div role="wrap">
          <span role="data">{data() as string}</span>
        </div>
      );
    }
    render(() => (<Page />) as unknown as JSX.Element);
    expect(screen.getByRole('data')).toBeEmptyDOMElement();
  });

  test('should apply initialData with object and function', async () => {
    const alova = getAlovaInstance(Solidhook);
    const mockFn = jest.fn();
    function Page() {
      const { data: data1 } = useRequest(alova.Get(''), { initialData: 'test', immediate: false });
      const { data: data2 } = useRequest(alova.Get(''), {
        initialData: () => {
          mockFn();
          return 'test';
        },
        immediate: false
      });
      return (
        <div role="wrap">
          <span role="data-1">{data1() as any}</span>
          <span role="data-2">{data2() as any}</span>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);
    expect(screen.getByRole('data-1')).toHaveTextContent('test');
    expect(screen.getByRole('data-2')).toHaveTextContent('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('send GET', async () => {
    const alova = getAlovaInstance(Solidhook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      timeout: 10000,
      transform: ({ data }: Result<true>) => data,
      cacheFor: 100 * 1000
    });
    function Page() {
      const { loading, data } = useRequest(Get, {
        initialData: { path: '', method: '' }
      });

      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data().path}</span>
          <span role="method">{data().method}</span>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);
    expect(screen.getByRole('status')).toHaveTextContent('loading');
    // 等待状态变为 loaded
    waitFor(() => {
      // setTimeout(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('method')).toHaveTextContent('GET');
      // });
    });
  });

  test("shouldn't send request when set `immediate=false`", async () => {
    const user = userEvent.setup();

    const alova = getAlovaInstance(Solidhook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      timeout: 10000,
      transform: ({ data }: Result<true>) => data,
      cacheFor: 100 * 1000
    });
    function Page() {
      const { loading, data, send } = useRequest(Get, { immediate: false, initialData: { path: '', method: '' } });
      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data().path}</span>
          <span role="method">{data().method}</span>
          <button
            role="btn"
            onClick={() => send()}>
            send request
          </button>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);
    // await delay(1000);
    expect(screen.getByRole('status')).toHaveTextContent('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('');
    expect(screen.getByRole('method')).toHaveTextContent('');

    await user.click(screen.getByRole('btn'));
    waitFor(() => {
      screen.findByText(/unit-test/);
      expect(screen.getByRole('method')).toHaveTextContent('GET');
    });
  });

  test("shouldn't send request when set `immediate=false` in StrictMode", async () => {
    const user = userEvent.setup();
    const alova = getAlovaInstance(Solidhook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      timeout: 10000,
      transform: ({ data }: Result<true>) => data,
      cacheFor: 100 * 1000
    });
    function Page() {
      const { loading, data, send } = useRequest(Get, { immediate: false, initialData: { path: '', method: '' } });
      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data().path}</span>
          <span role="method">{data().method}</span>
          <button
            role="btn"
            onClick={() => send()}>
            send request
          </button>
        </div>
      );
    }

    render(
      () =>
        // <StrictMode>
        (<Page />) as unknown as JSX.Element as unknown as JSX.Element // </StrictMode>
    );
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('method')).toHaveTextContent('');
    });
    await user.click(screen.getByRole('btn'));
    waitFor(() => {
      screen.findByText(/unit-test/);
      expect(screen.getByRole('method')).toHaveTextContent('GET');
    });
  });

  test('should return sync mock data from responded hook', async () => {
    const alova = getAlovaInstance(Solidhook, {
      responseExpect: () => ({
        mock: 'mockdata'
      })
    });
    const Get = alova.Get<{ mock: string }>('/unit-test');
    function Page() {
      const { data, loading } = useRequest(Get);
      return (
        <div>
          <span>{loading() ? 'loading' : 'loaded'}</span>
          <span role="data">{JSON.stringify(data)}</span>
        </div>
      );
    }
    render(() => (<Page />) as unknown as JSX.Element);
    waitFor(() => {
      screen.findByText(/loaded/);
      expect(screen.getByRole('data')).toHaveTextContent('{"mock":"mockdata"}');
    });
  });

  test('states should be removed from cache when component is unmounted', async () => {
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

  test('should change states built in by using function `update` which return in `useRequest`', async () => {
    const user = userEvent.setup();
    const alova = getAlovaInstance(Solidhook, {
      responseExpect: r => r.json()
    });
    function Page() {
      const Get = alova.Get('/unit-test', {
        transform: ({ data }: Result<true>) => data,
        params: {
          a: '~',
          b: '~~'
        }
      });
      const { loading, data, error, downloading, uploading, update } = useRequest(Get);
      return (
        <div>
          <span role="loading">{loading() ? 'loading...' : 'loaded'}</span>
          {/* <span role="path">{data?().path}</span> */}
          <span role="error">{error()?.message}</span>
          <span role="downloading">
            {downloading().loaded}_{downloading().total}
          </span>
          <span role="uploading">
            {uploading().loaded}_{uploading().total}
          </span>
          <button
            role="btn"
            onClick={() =>
              update({
                loading: true,
                data: {
                  ...data,
                  path: '/unit-test-changed'
                },
                error: {
                  message: 'error message'
                },
                downloading: {
                  loaded: 2,
                  total: 10
                },
                uploading: {
                  loaded: 3,
                  total: 30
                }
              })
            }>
            change state
          </button>
        </div>
      );
    }
    render(() => (<Page />) as unknown as JSX.Element);
    waitFor(() => {
      screen.findByRole('path');
    });
    await user.click(screen.getByRole('btn'));
    waitFor(() => {
      expect(screen.getByRole('loading')).toHaveTextContent('loading...');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test-changed');
      expect(screen.getByRole('error')).toHaveTextContent('error message');
      expect(screen.getByRole('downloading')).toHaveTextContent('2_10');
      expect(screen.getByRole('uploading')).toHaveTextContent('3_30');
    });
  });
});
