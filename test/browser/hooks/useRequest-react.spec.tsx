import React, { ReactElement, useState } from 'react';
import {
  createAlova,
  GlobalFetch,
  useRequest,
} from '../../../src';
import ReactHook from '../../../src/predefine/ReactHook';
import { RequestConfig } from '../../../typings';
import { GetData, Result } from '../result.type';
import server from '../../server';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getStateCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';


function getInstance(
  beforeRequestExpect?: (config: RequestConfig<any, any>) => void,
  responseExpect?: (jsonPromise: Promise<any>) => void,
  resErrorExpect?: (err: Error) => void,
) {
  return createAlova({
    baseURL: 'http://localhost:3000',
    timeout: 3000,
    statesHook: ReactHook,
    requestAdapter: GlobalFetch(),
    beforeRequest(config) {
      beforeRequestExpect && beforeRequestExpect(config);
      return config;
    },
    responsed: {
      success: response => {
        const jsonPromise = response.json();
        responseExpect && responseExpect(jsonPromise);
        return jsonPromise;
      },
      error: err => {
        resErrorExpect && resErrorExpect(err);
      }
    }
  });
}
function getInstanceSyncResponsed() {
  return createAlova({
    baseURL: 'http://localhost:3000',
    timeout: 3000,
    statesHook: ReactHook,
    requestAdapter: GlobalFetch(),
    responsed: () => {
      return {
        mock: 'mockdata'
      };
    }
  });
}


beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
describe('useRequet hook with react', function() {
  test('send GET', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result<true>>('/unit-test', {
      timeout: 10000,
      transformData: ({ data }) => data,
      localCache: 100 * 1000,
    });
    function Page() {
      const {
        loading,
        data = { path: '', method: '' },
      } = useRequest(Get);
      return (
        <div role="wrap">
          <span role="status">{ loading ? 'loading' : 'loaded' }</span>
          <span role="path">{ data.path }</span>
          <span role="method">{ data.method }</span>
        </div>
      );
    }

    render(<Page /> as ReactElement<any, any>);
    expect(screen.getByRole('status')).toHaveTextContent('loading');
    const loadingEl = await screen.findByText(/loaded/);
    expect(loadingEl).toHaveTextContent('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('method')).toHaveTextContent('GET');
  });

  test('shouldn\'t send request when set `immediate=false`', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result<true>>('/unit-test', {
      timeout: 10000,
      transformData: ({ data }) => data,
      localCache: 100 * 1000,
    });
    function Page() {
      const {
        loading,
        data = { path: '', method: '' },
        send,
      } = useRequest(Get, { immediate: false });
      return (
        <div role="wrap">
          <span role="status">{ loading ? 'loading' : 'loaded' }</span>
          <span role="path">{ data.path }</span>
          <span role="method">{ data.method }</span>
          <button role="btn" onClick={send}>send request</button>
        </div>
      );
    }

    render(<Page /> as ReactElement<any, any>);
    await new Promise(resolve => setTimeout(resolve, 1000));
    expect(screen.getByRole('status')).toHaveTextContent('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('');
    expect(screen.getByRole('method')).toHaveTextContent('');
    fireEvent.click(screen.getByRole('btn'));
    await screen.findByText(/unit-test/);
    expect(screen.getByRole('method')).toHaveTextContent('GET');
  });

  test('should return sync mock data from responsed hook', async () => {
    const alova = getInstanceSyncResponsed();
    const Get = alova.Get<{mock: string}>('/unit-test');
    function Page() {
      const { data, responser } = useRequest(Get);
      responser.success(() => {
        expect(data.mock).toBe('mockdata');
      });
      return <div>{data}</div>;
    }
    render(<Page /> as ReactElement<any, any>);
  });

  test('states should be remove in cache when component was unmounted', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData>('unit-test', {
      transformData: ({ data }) => data,
    });
    function DataConsole() {
      const { data, loading } = useRequest(Get);
      return <div>{loading ? 'loading...' : JSON.stringify(data)}</div>;
    }
    function Page() {
      const [showData, setShowData] = useState(true);
      return <div>
        { showData ? <DataConsole /> : <div>no data</div> }
        <button
          role="btn"
          onClick={() => setShowData(!showData)}
        >toggle data</button>
      </div>;
    }
    render(<Page /> as ReactElement<any, any>);
    await screen.findByText(/unit-test/);

    // useRequest内会缓存状态
    const { data } = getStateCache(alova.id, key(Get)) || { data: null };
    expect(data[0].path).toBe('/unit-test');
    fireEvent.click(screen.getByRole('btn'));
    await new Promise(resolve => setTimeout(resolve, 100));

    // 当DataConsole组件卸载时，会同步清除state缓存，避免内存泄露
    expect(getStateCache(alova.id, key(Get))).toBeUndefined();
  });
});