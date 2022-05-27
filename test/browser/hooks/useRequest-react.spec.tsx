import React from 'react';
import {
  createAlova,
  ReactHook,
  useRequest,
  GlobalFetch,
} from '../../../src';
import { RequestConfig } from '../../../typings';
import { GetData, Result } from '../result.type';
import server from '../../server';
import { render, waitFor } from '@testing-library/react';


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
describe.only('useRequet hook with react', function() {
  test('send GET', async () => {
    const alova = getInstance();
    const Get = alova.Get<GetData, Result<true>>('/unit-test', {
      timeout: 10000,
      transformData({ data }) {
        return data;
      },
      staleTime: 100 * 1000,
    });

    const Page = () => {
      const {
        loading,
        data,
      } = useRequest(Get);
      return (
        <div>
          <>
            <span role="loading">{ loading ? 'loading' : 'loaded' }</span>
            <span role="data">{ JSON.stringify(data) }</span>
          </>
        </div>
      );
    }
    const rendered = render(<Page />);
    await waitFor(() => rendered.getByRole('loading'));
    expect(rendered.getByRole('loading').textContent).toBe('loading');
  });
});