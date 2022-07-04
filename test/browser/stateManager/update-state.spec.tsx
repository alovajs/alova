import {
  createAlova,
  useRequest,
  GlobalFetch,
  updateState,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import ReactHook from '../../../src/predefine/ReactHook';
import { RequestConfig } from '../../../typings';
import { GetData, Result } from '../result.type';
import server from '../../server';
import { render, screen } from '@testing-library/react';
import React, { ReactElement } from 'react';
import '@testing-library/jest-dom';


beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
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
    responsed: [response => {
      const jsonPromise = response.json();
      responseExpect && responseExpect(jsonPromise);
      return jsonPromise;
    }, err => {
      resErrorExpect && resErrorExpect(err);
    }]
  });
}
function getInstanceWithVue() {
  return createAlova({
    baseURL: 'http://localhost:3000',
    statesHook: VueHook,
    requestAdapter: GlobalFetch(),
    responsed: response => response.json(),
  });
}

describe('update cached response data by user', function() {
  test('the cached response data should be changed and the screen should be update', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result>('/unit-test', {
      localCache: 100000,
      transformData: data => data.data,
    });

    function Page() {
      const {
        data = { path: '' },
        responser,
      } = useRequest(Get);
      responser.success(() => updateState(Get, ([data, setData]) => {
        setData({
          ...data,
          path: '/unit-test-updated',
        });
      }));
      return <div role="path">{data.path}</div>;
    }
    render(<Page /> as ReactElement<any, any>);
    await screen.findByText(/unit-test/);
    // 延迟检查页面是否有更新
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test-updated');
  });

  test('test update function with vue', async () => {
    const alova = getInstanceWithVue();
    const Get = alova.Get<GetData, Result>('/unit-test', {
      localCache: 100000,
      transformData: data => data.data,
    });
    const { data, responser } = useRequest(Get);
    await new Promise(resolve => responser.success(() => resolve(1)));
    updateState(Get, data => {
      data.value.path = '/unit-test-updated';
    });
    expect(data.value.path).toBe('/unit-test-updated');
  });
});