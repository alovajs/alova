import React, { ReactElement } from 'react';
import {
  createAlova,
  ReactHook,
  GlobalFetch,
  useRequest,
} from '../../../src';
import { RequestConfig } from '../../../typings';
import { GetData, Result } from '../result.type';
import server from '../../server';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';


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


beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
describe('useRequet hook with react', function() {
  test('send GET', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result<true>>('/unit-test', {
      timeout: 10000,
      transformData: ({ data }) => data,
      staleTime: 100 * 1000,
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
});