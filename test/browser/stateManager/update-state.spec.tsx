import {
  createAlova,
  useRequest,
  GlobalFetch,
  updateState,
  cacheMode,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import ReactHook from '../../../src/predefine/ReactHook';
import { AlovaRequestAdapterConfig } from '../../../typings';
import { Result } from '../result.type';
import server, { untilCbCalled } from '../../server';
import { render, screen } from '@testing-library/react';
import React, { ReactElement } from 'react';
import '@testing-library/jest-dom';
import { getResponseCache } from '../../../src/storage/responseCache';
import { key } from '../../../src/utils/helper';
import { getPersistentResponse } from '../../../src/storage/responseStorage';


beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
function getInstance(
  beforeRequestExpect?: (config: AlovaRequestAdapterConfig<any, any, RequestInit, Headers>) => void,
  responseExpect?: (jsonPromise: Promise<any>) => void,
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
    responsed(response) {
      const jsonPromise = response.json();
      responseExpect && responseExpect(jsonPromise);
      return jsonPromise;
    }
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
    const Get = alova.Get('/unit-test', {
      localCache: {
        expire: 100000,
        mode: cacheMode.STORAGE_PLACEHOLDER,
      },
      transformData: ({ data }: Result) => data,
    });

    function Page() {
      const {
        data = { path: '' },
        onSuccess,
      } = useRequest(Get);
      onSuccess(() => updateState(Get, (data) => {
        return {
          ...data,
          path: '/unit-test-updated',
        };
      }));
      return <div role="path">{data.path}</div>;
    }
    render(<Page /> as ReactElement<any, any>);
    await screen.findByText(/unit-test/);

    // 延迟检查页面是否有更新
    await untilCbCalled(setTimeout, 100);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test-updated');
    const cacheData = getResponseCache(alova.id, key(Get)); 
    expect(cacheData.path).toBe('/unit-test-updated');   // 除了状态数据被更新外，缓存也将会被更新
    const storageData = getPersistentResponse(alova.id, key(Get), alova.storage);
    expect(storageData.path).toBe('/unit-test-updated');   // 持久化数据也将被更新
  });

  test('test update function with vue', async () => {
    const alova = getInstanceWithVue();
    const Get = alova.Get('/unit-test', {
      localCache: 100000,
      transformData: ({ data }: Result) => data,
    });
    const { data, onSuccess } = useRequest(Get);
    await untilCbCalled(onSuccess);
    updateState(Get, data => {
      data.path = '/unit-test-updated';
      return data;
    });
    expect(data.value.path).toBe('/unit-test-updated');
  });


  test('shouldn\'t be call when not get any states', () => {
    const alova = getInstanceWithVue();
    const Get = alova.Get('/unit-test', {
      params: { a: 1 },
      localCache: 100000,
      transformData: ({ data }: Result) => data,
    });

    const mockfn = jest.fn();
    updateState(Get, data => {
      mockfn();
      return data;
    });
    expect(mockfn.mock.calls.length).toBe(0);
  });


  test('should update the first matched one when find sereval Method instance', async () => {
    const alova = getInstanceWithVue();
    const Get1 = alova.Get('/unit-test', {
      name: 'get1',
      params: { a: 1 },
      localCache: 100000,
      transformData: ({ data }: Result) => data,
    });
    const Get2 = alova.Get('/unit-test', {
      name: 'get2',
      params: { b: 2 },
      localCache: 100000,
      transformData: ({ data }: Result) => data,
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    await Promise.all([
      untilCbCalled(firstState.onSuccess),
      untilCbCalled(secondState.onSuccess),
    ]);
    updateState(/^get/, (data: any) => {
      data.path = '/unit-test-updated';
      return data;
    });

    // 匹配到多个method实例，只会更新第一个
    expect(firstState.data.value.path).toBe('/unit-test-updated');
    expect(secondState.data.value.path).toBe('/unit-test');
  });

  test('shouldn\'t throw error when not match any one', async () => {
    const alova = getInstanceWithVue();
    const Get1 = alova.Get('/unit-test', {
      name: 'get1',
      params: { a: 1 },
      localCache: 100000,
      transformData: ({ data }: Result) => data,
    });
    const Get2 = alova.Get('/unit-test', {
      name: 'get2',
      params: { b: 2 },
      localCache: 100000,
      transformData: ({ data }: Result) => data,
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    await Promise.all([
      untilCbCalled(firstState.onSuccess),
      untilCbCalled(secondState.onSuccess),
    ]);

    // 不会匹配任何一个method实例
    updateState('get', (data: any) => {
      data.path = '/unit-test-updated';
      return data;
    });

    // 匹配到多个method实例，只会更新第一个
    expect(firstState.data.value.path).toBe('/unit-test');
    expect(secondState.data.value.path).toBe('/unit-test');
  });
});