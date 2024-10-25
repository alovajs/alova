import { getAlovaInstance } from '#/utils';
import { getStateCache } from '@/hooks/core/implements/stateCache';
import { useRequest } from '@/index';
import ReactHook from '@/statesHook/react';
import { key } from '@alova/shared/function';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactElement, StrictMode } from 'react';
import { Result, delay } from 'root/testUtils';

const StrictModeReact = StrictMode as any;

describe('useRequest hook with react', () => {
  test('should not have initial data', async () => {
    const alova = getAlovaInstance(ReactHook);
    function Page() {
      const { data } = useRequest(alova.Get(''), { immediate: false });
      expect(data).toBeUndefined();

      return (
        <div role="wrap">
          <span role="data">{data as string}</span>
        </div>
      );
    }

    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('data')).toBeEmptyDOMElement();
  });

  test('should apply initialData with object and function', async () => {
    const alova = getAlovaInstance(ReactHook);
    const mockFn = vi.fn();
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
          <span role="data-1">{data1 as string}</span>
          <span role="data-2">{data2 as string}</span>
        </div>
      );
    }

    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('data-1')).toHaveTextContent('test');
    expect(screen.getByRole('data-2')).toHaveTextContent('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('send GET', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      timeout: 10000,
      transform: ({ data }: Result<true>) => data,
      cacheFor: 100 * 1000
    });
    function Page() {
      const { loading, data = { path: '', method: '' } } = useRequest(Get);
      return (
        <div role="wrap">
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data.path}</span>
          <span role="method">{data.method}</span>
        </div>
      );
    }

    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('status')).toHaveTextContent('loading');
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('method')).toHaveTextContent('GET');
    });
  });

  test("shouldn't send request when set `immediate=false`", async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      timeout: 10000,
      transform: ({ data }: Result<true>) => data,
      cacheFor: 100 * 1000
    });
    function Page() {
      const { loading, data = { path: '', method: '' }, send } = useRequest(Get, { immediate: false });
      return (
        <div role="wrap">
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data.path}</span>
          <span role="method">{data.method}</span>
          <button
            role="btn"
            onClick={() => send()}>
            send request
          </button>
        </div>
      );
    }

    render((<Page />) as ReactElement<any, any>);
    await new Promise<void>(resolve => {
      setTimeout(() => resolve(), 1000);
    });
    expect(screen.getByRole('status')).toHaveTextContent('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('');
    expect(screen.getByRole('method')).toHaveTextContent('');
    fireEvent.click(screen.getByRole('btn'));
    await screen.findByText(/unit-test/);
    expect(screen.getByRole('method')).toHaveTextContent('GET');
  });

  test("shouldn't send request when set `immediate=false` in react StrictMode", async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      timeout: 10000,
      transform: ({ data }: Result<true>) => data,
      cacheFor: 100 * 1000
    });
    function Page() {
      const { loading, data = { path: '', method: '' }, send } = useRequest(Get, { immediate: false });
      return (
        <div role="wrap">
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data.path}</span>
          <span role="method">{data.method}</span>
          <button
            role="btn"
            onClick={() => send()}>
            send request
          </button>
        </div>
      );
    }

    render(
      (
        <StrictModeReact>
          <Page />
        </StrictModeReact>
      ) as ReactElement<any, any>
    );
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('method')).toHaveTextContent('');
    });
    fireEvent.click(screen.getByRole('btn'));
    await screen.findByText(/unit-test/);
    expect(screen.getByRole('method')).toHaveTextContent('GET');
  });

  test('should return sync mock data from responded hook', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: () => ({
        mock: 'mockdata'
      })
    });
    const Get = alova.Get<{ mock: string }>('/unit-test');
    function Page() {
      const { data, loading } = useRequest(Get);
      return (
        <div>
          <span>{loading ? 'loading' : 'loaded'}</span>
          <span role="data">{JSON.stringify(data)}</span>
        </div>
      );
    }
    render((<Page />) as ReactElement<any, any>);
    await screen.findByText(/loaded/);
    expect(screen.getByRole('data')).toHaveTextContent('{"mock":"mockdata"}');
  });

  test('states should be remove in cache when component was unmounted', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('unit-test', {
      transform: ({ data }: Result) => data
    });
    function Page() {
      const { data, loading } = useRequest(Get);
      return <div role="cell">{loading ? 'loading...' : JSON.stringify(data)}</div>;
    }
    const { unmount } = render((<Page />) as ReactElement<any, any>);

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
    const alova = getAlovaInstance(ReactHook, {
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
      const { loading, data, error, downloading, update } = useRequest(Get);
      return (
        <div>
          <span role="loading">{loading ? 'loading...' : 'loaded'}</span>
          <span role="path">{data?.path}</span>
          <span role="error">{error?.message}</span>
          <span role="downloading">
            {downloading.loaded}_{downloading.total}
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
                error: new Error('changed error'),
                downloading: {
                  loaded: 1,
                  total: 1000
                }
              })
            }>
            change data
          </button>
        </div>
      );
    }
    render((<Page />) as ReactElement<any, any>);
    await screen.findByText(/loaded/);
    fireEvent.click(screen.getByRole('btn'));
    await screen.findByText(/loading\.\.\./);
    expect(screen.getByRole('loading')).toHaveTextContent('loading...');
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test-changed');
    expect(screen.getByRole('downloading')).toHaveTextContent('1_1000');
  });

  // 如果立即发送请求，react的loading状态将初始为true
  test('should render twice instead of third', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      timeout: 10000,
      transform: ({ data }: Result<true>) => data,
      cacheFor: 100 * 1000
    });

    const renderMockFn = vi.fn();
    function Page() {
      const { loading, data = { path: '', method: '' } } = useRequest(Get);
      renderMockFn();
      return (
        <div role="wrap">
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data.path}</span>
          <span role="method">{data.method}</span>
        </div>
      );
    }

    render((<Page />) as ReactElement<any, any>);
    await waitFor(() => {
      expect(renderMockFn).toHaveBeenCalledTimes(2);
    });
  });

  test('should abort function when call function abort', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test-1s', {
      timeout: 10000,
      transform: ({ data }: Result) => data,
      cacheFor: 100 * 1000
    });

    let i = 0;
    function Page() {
      const { loading, abort, send, error, data = { path: '', method: '' }, update } = useRequest(Get);
      return (
        <div role="wrap">
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data.path}</span>
          {error ? <span role="error">{error.message}</span> : null}
          <button
            role="btnUpd"
            onClick={() => {
              update({
                data: {
                  path: `/abc${i}`,
                  method: 'GET',
                  params: {}
                },
                error: undefined
              });
              i += 1;
            }}>
            update
          </button>
          <button
            role="btnSend"
            onClick={() => send().catch(() => {})}>
            send
          </button>
          <button
            role="btnAbort"
            onClick={abort}>
            abort
          </button>
        </div>
      );
    }
    render((<Page />) as ReactElement<any, any>);
    await delay(10);
    fireEvent.click(screen.getByRole('btnAbort'));
    await waitFor(() => {
      expect(screen.getByRole('error')).toHaveTextContent('The operation was aborted.');
    });
  });
});
