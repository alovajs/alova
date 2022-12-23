import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React, { ReactElement, useState } from 'react';
import { cacheMode, updateState, useRequest } from '../../../src';
import ReactHook from '../../../src/predefine/ReactHook';
import { getResponseCache } from '../../../src/storage/responseCache';
import { getPersistentResponse } from '../../../src/storage/responseStorage';
import { key } from '../../../src/utils/helper';
import { getAlovaInstance, mockServer, untilCbCalled } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('update cached response data by user in react', function () {
  test('the cached response data should be changed and the screen should be update', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      localCache: {
        expire: 100000,
        mode: cacheMode.STORAGE_PLACEHOLDER
      },
      transformData: ({ data }: Result) => data
    });

    function Page() {
      const { data = { path: '' }, onSuccess } = useRequest(Get);
      onSuccess(() =>
        updateState(Get, data => {
          return {
            ...data,
            path: '/unit-test-updated'
          };
        })
      );
      return <div role="path">{data.path}</div>;
    }
    render((<Page />) as ReactElement<any, any>);
    await screen.findByText(/unit-test/);

    // 延迟检查页面是否有更新
    await untilCbCalled(setTimeout, 100);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test-updated');
    const cacheData = getResponseCache(alova.id, key(Get));
    expect(cacheData.path).toBe('/unit-test-updated'); // 除了状态数据被更新外，缓存也将会被更新
    const storageData = getPersistentResponse(alova.id, key(Get), alova.storage);
    expect(storageData.path).toBe('/unit-test-updated'); // 持久化数据也将被更新
  });

  test('front states would be valid when not changed theirs value', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });

    function Page() {
      const [count, setCount] = useState(0);

      const { data } = useRequest(Get, {
        initialData: { path: '' }
      });

      return (
        <div>
          <div role="path">{data.path}</div>
          <span
            role="count"
            onClick={() => setCount(count + 1)}>
            {count}
          </span>
        </div>
      );
    }
    render((<Page />) as ReactElement<any, any>);
    await screen.findByText(/unit-test/);

    // useRequest返回的状态未改变，此时看看还能不能通过updateState改变来渲染页面
    fireEvent.click(screen.getByRole('count'));
    await screen.findByText('1');

    updateState(Get, data => {
      return {
        ...data,
        path: '/unit-test-updated'
      };
    });
    await screen.findByText(/unit-test-updated/);
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test-updated');
    expect(screen.getByRole('count')).toHaveTextContent('1');
  });

  test('update extra managed states', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });

    function Page() {
      const extraData = useState(0);
      const extraData2 = 1;
      const { data } = useRequest(Get, {
        initialData: { path: '' },
        managedStates: {
          extraData,
          extraData2: extraData2 as unknown as [number, React.Dispatch<React.SetStateAction<number>>]
        }
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

    // 预设状态不能更新
    expect(() => {
      updateState(Get, {
        loading: () => true
      });
    }).toThrow();

    // 非状态数据不能更新
    expect(() => {
      updateState(Get, {
        extraData2: () => 1
      });
    }).toThrow();

    // 未找到状态抛出错误
    expect(() => {
      updateState(Get, {
        extraData3: () => 1
      });
    }).toThrow();

    // 更新成功
    updateState(Get, {
      extraData: () => 1
    });
    await untilCbCalled(setTimeout, 50);
    expect(screen.getByRole('extraData')).toHaveTextContent('1');
  });
});
