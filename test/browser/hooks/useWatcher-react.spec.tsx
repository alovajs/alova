import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React, { ReactElement, useState } from 'react';
import { useWatcher } from '../../../src';
import ReactHook from '../../../src/predefine/ReactHook';
import { getAlovaInstance, mockServer } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());
describe('useWatcher hook with react', () => {
  test('should send request when change value', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        timeout: 10000,
        transformData: ({ data }: Result<true>) => data,
        localCache: 100 * 1000
      });
    const mockfn = jest.fn();
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1, stateId2), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        }
      });
      onSuccess(mockfn);
      return (
        <div role="wrap">
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data.path}</span>
          <span role="id1">{data.params.id1}</span>
          <span role="id2">{data.params.id2}</span>
          <button
            onClick={() => {
              setStateId1(stateId1 + 1);
              setStateId2(stateId2 + 1);
            }}>
            btn
          </button>
        </div>
      );
    }

    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('status')).toHaveTextContent('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('');

    fireEvent.click(screen.getByRole('button'));
    await screen.findByText('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('11');

    fireEvent.click(screen.getByRole('button'));
    await screen.findByText('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('2');
    expect(screen.getByRole('id2')).toHaveTextContent('12');
    expect(mockfn).toHaveBeenCalledTimes(2);
  });

  test('should send request when init', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        timeout: 10000,
        transformData: ({ data }: Result<true>) => data,
        localCache: 100 * 1000
      });
    const mockfn = jest.fn();
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);

      const { loading, data, onSuccess, send } = useWatcher(() => getter(stateId1, stateId2), [stateId1, stateId2], {
        immediate: true,
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        }
      });
      onSuccess(mockfn);
      return (
        <div role="wrap">
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data.path}</span>
          <span role="id1">{data.params.id1}</span>
          <span role="id2">{data.params.id2}</span>
          <button
            onClick={() => {
              setStateId1(stateId1 + 1);
              setStateId2(stateId2 + 1);
            }}>
            btn
          </button>
          <button
            role="btn2"
            onClick={send}>
            btn2
          </button>
        </div>
      );
    }

    render((<Page />) as ReactElement<any, any>);
    await screen.findByText('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('0');
    expect(screen.getByRole('id2')).toHaveTextContent('10');

    fireEvent.click(screen.getByRole('button'));
    await screen.findByText('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('11');

    fireEvent.click(screen.getByRole('button'));
    await screen.findByText('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('2');
    expect(screen.getByRole('id2')).toHaveTextContent('12');
    expect(mockfn).toHaveBeenCalledTimes(3);

    fireEvent.click(screen.getByRole('btn2'));
    await screen.findByText('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('2');
    expect(screen.getByRole('id2')).toHaveTextContent('12');
    expect(mockfn).toHaveBeenCalledTimes(4);
  });

  test("initial request shouldn't delay when set the `immediate` and `debounce`", async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        timeout: 10000,
        transformData: ({ data }: Result<true>) => data,
        localCache: 100 * 1000
      });
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);

      const { loading, data, send } = useWatcher(() => getter(stateId1, stateId2), [stateId1, stateId2], {
        immediate: true,
        debounce: 500,
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        }
      });
      return (
        <div role="wrap">
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data.path}</span>
          <span role="id1">{data.params.id1}</span>
          <span role="id2">{data.params.id2}</span>
          <button
            onClick={() => {
              setStateId1(stateId1 + 1);
              setStateId2(stateId2 + 1);
            }}>
            btn
          </button>
          <button
            role="btn2"
            onClick={send}>
            btn2
          </button>
        </div>
      );
    }

    const startTs = Date.now();
    render((<Page />) as ReactElement<any, any>);
    await screen.findByText('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('0');
    expect(screen.getByRole('id2')).toHaveTextContent('10');
    expect(Date.now() - startTs).toBeLessThan(150);
  });

  test('in different debounce time when set param debounce to be a array', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        timeout: 10000,
        transformData: ({ data }: Result<true>) => data,
        localCache: 100 * 1000
      });
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);
      const [pending, setPending] = useState(false);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1, stateId2), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        },
        debounce: [500, 200]
      });
      onSuccess(() => {
        setPending(false);
      });
      return (
        <div role="wrap">
          <span>{pending ? 'pending' : 'pended'}</span>
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data.path}</span>
          <span role="id1">{data.params.id1}</span>
          <span role="id2">{data.params.id2}</span>
          <button
            role="btn1"
            onClick={() => {
              setStateId1(stateId1 + 1);
              setPending(true);
            }}>
            btn1
          </button>
          <button
            role="btn2"
            onClick={() => {
              setStateId2(stateId2 + 1);
              setPending(true);
            }}>
            btn2
          </button>
        </div>
      );
    }

    render((<Page />) as ReactElement<any, any>);
    await screen.findByText('loaded');
    // 暂没发送请求
    expect(screen.getByRole('path')).toHaveTextContent('');
    expect(screen.getByRole('id1')).toHaveTextContent('');
    expect(screen.getByRole('id2')).toHaveTextContent('');

    fireEvent.click(screen.getByRole('btn1'));
    let startTs = Date.now();
    await screen.findByText('pended');
    // 请求已响应
    let endTs = Date.now();
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('10');
    expect(endTs - startTs).toBeLessThan(600);

    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await screen.findByText('pended');
    endTs = Date.now();
    // 请求已响应
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('11');
    expect(endTs - startTs).toBeLessThan(300);

    // 同时改变，以后一个为准
    fireEvent.click(screen.getByRole('btn1'));
    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await screen.findByText('pended');
    endTs = Date.now();
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('2');
    expect(screen.getByRole('id2')).toHaveTextContent('12');
    expect(endTs - startTs).toBeLessThan(300);
  });

  test('set param debounce to be a array that contain a item', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        timeout: 10000,
        transformData: ({ data }: Result<true>) => data,
        localCache: 100 * 1000
      });
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);
      const [pending, setPending] = useState(false);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1, stateId2), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        },
        debounce: [300]
      });
      onSuccess(() => {
        setPending(false);
      });
      return (
        <div role="wrap">
          <span>{pending ? 'pending' : 'pended'}</span>
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data.path}</span>
          <span role="id1">{data.params.id1}</span>
          <span role="id2">{data.params.id2}</span>
          <button
            role="btn1"
            onClick={() => {
              setStateId1(stateId1 + 1);
              setPending(true);
            }}>
            btn1
          </button>
          <button
            role="btn2"
            onClick={() => {
              setStateId2(stateId2 + 1);
              setPending(true);
            }}>
            btn2
          </button>
        </div>
      );
    }

    render((<Page />) as ReactElement<any, any>);
    await screen.findByText('pended');
    // 暂没发送请求
    expect(screen.getByRole('path')).toHaveTextContent('');
    expect(screen.getByRole('id1')).toHaveTextContent('');
    expect(screen.getByRole('id2')).toHaveTextContent('');

    fireEvent.click(screen.getByRole('btn1'));
    let startTs = Date.now();
    await screen.findByText('pended');
    let endTs = Date.now();
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('10');
    expect(endTs - startTs).toBeLessThan(450);

    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await screen.findByText('pended');
    endTs = Date.now();
    // 第二个值未设置防抖，请求将很快响应
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('11');
    expect(endTs - startTs).toBeLessThan(100);

    // 同时改变，以后一个为准
    fireEvent.click(screen.getByRole('btn1'));
    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await screen.findByText('pended');
    endTs = Date.now();
    expect(screen.getByRole('id1')).toHaveTextContent('2');
    expect(screen.getByRole('id2')).toHaveTextContent('12');
    expect(endTs - startTs).toBeLessThan(100);
  });
});
