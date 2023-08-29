import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { useWatcher } from '@/index';
import ReactHook from '@/predefine/ReactHook';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { ReactElement, useState } from 'react';

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

    await untilCbCalled(setTimeout); // 由于reactHook中异步更改触发条件，因此需要异步改变状态才可以触发请求
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(mockfn).toBeCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(mockfn).toBeCalledTimes(2);
    });
  });

  test('should get the response that request at last when change value', async () => {
    let i = 0;
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get(i === 1 ? '/unit-test-1s' : '/unit-test', {
        params: {
          id1,
          id2
        },
        transformData: ({ data }: Result<true>) => data,
        localCache: null
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
            role="button1"
            onClick={() => {
              i++;
              setStateId1(1);
              setStateId2(11);
            }}>
            btn
          </button>
          <button
            role="button2"
            onClick={() => {
              i++;
              setStateId1(2);
              setStateId2(12);
            }}>
            btn
          </button>
        </div>
      );
    }

    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('status')).toHaveTextContent('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('');

    await untilCbCalled(setTimeout); // 由于reactHook中异步更改触发条件，因此需要异步改变状态才可以触发请求
    fireEvent.click(screen.getByRole('button1'));

    await untilCbCalled(setTimeout);
    fireEvent.click(screen.getByRole('button2'));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(mockfn).toBeCalledTimes(1); // 请求已发出，但数据只更新最新的
    });
  });

  test('should ignore the error which is not the last request', async () => {
    let i = 0;
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get(i === 1 ? '/unit-test-1s' : '/unit-test', {
        params: {
          id1,
          id2
        },
        transformData: ({ data }: Result<true>) => {
          if (data.path === '/unit-test-1s') {
            throw new Error('error');
          }
          return data;
        },
        localCache: null
      });
    const mockfn = jest.fn();
    const mockErrorfn = jest.fn();
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);

      const { loading, error, data, onSuccess, onError } = useWatcher(
        () => getter(stateId1, stateId2),
        [stateId1, stateId2],
        {
          initialData: {
            path: '',
            params: { id1: '', id2: '' }
          }
        }
      );
      onSuccess(mockfn);
      onError(mockErrorfn);
      return (
        <div role="wrap">
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="error">{error?.message || ''}</span>
          <span role="path">{data.path}</span>
          <span role="id1">{data.params.id1}</span>
          <span role="id2">{data.params.id2}</span>
          <button
            role="button1"
            onClick={() => {
              i++;
              setStateId1(1);
              setStateId2(11);
            }}>
            btn
          </button>
          <button
            role="button2"
            onClick={() => {
              i++;
              setStateId1(2);
              setStateId2(12);
            }}>
            btn
          </button>
        </div>
      );
    }

    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('status')).toHaveTextContent('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('');

    await untilCbCalled(setTimeout); // 由于reactHook中异步更改触发条件，因此需要异步改变状态才可以触发请求
    fireEvent.click(screen.getByRole('button1'));

    await untilCbCalled(setTimeout);
    fireEvent.click(screen.getByRole('button2'));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(mockfn).toBeCalledTimes(1); // 请求已发出，但数据只更新最新的
      expect(mockErrorfn).not.toBeCalled(); // unit-test-1s因为后面才响应，不会触发回调
      expect(screen.getByRole('error')).toHaveTextContent(''); // 对应的error也不会有值
    });
  });

  test('should receive last response when set abortLast to false', async () => {
    let i = 0;
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get(i === 1 ? '/unit-test-1s' : '/unit-test', {
        params: {
          id1,
          id2
        },
        transformData: ({ data }: Result<true>) => data,
        localCache: null
      });
    const mockfn = jest.fn();
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1, stateId2), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        },
        abortLast: false
      });
      onSuccess(mockfn);
      return (
        <div role="wrap">
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="path">{data.path}</span>
          <span role="id1">{data.params.id1}</span>
          <span role="id2">{data.params.id2}</span>
          <button
            role="button1"
            onClick={() => {
              i++;
              setStateId1(3);
              setStateId2(13);
            }}>
            btn
          </button>
          <button
            role="button2"
            onClick={() => {
              i++;
              setStateId1(4);
              setStateId2(14);
            }}>
            btn
          </button>
        </div>
      );
    }

    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('status')).toHaveTextContent('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('');

    await untilCbCalled(setTimeout); // 由于reactHook中异步更改触发条件，因此需要异步改变状态才可以触发请求
    fireEvent.click(screen.getByRole('button1'));

    await untilCbCalled(setTimeout);
    fireEvent.click(screen.getByRole('button2'));
    await untilCbCalled(setTimeout, 1000);
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test-1s');
      expect(screen.getByRole('id1')).toHaveTextContent('3');
      expect(screen.getByRole('id2')).toHaveTextContent('13');
      expect(mockfn).toBeCalledTimes(2); // 请求已发出，但数据只更新最新的
    });
  });

  test('should not send request when change value but returns false in sendable', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        transformData: ({ data }: Result<true>) => data
      });
    const mockfn = jest.fn();
    const sendableFn = jest.fn();
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1, stateId2), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        },
        sendable: () => {
          sendableFn();
          return stateId1 === 1 && stateId2 === 11;
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

    await untilCbCalled(setTimeout); // 由于reactHook中异步更改触发条件，因此需要异步改变状态才可以触发请求
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(mockfn).toBeCalledTimes(1);
      expect(sendableFn).toBeCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(mockfn).toBeCalledTimes(1);
      expect(sendableFn).toBeCalledTimes(2);
    });
  });

  test('should not send request when change value but throws error in sendable', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        transformData: ({ data }: Result<true>) => data
      });
    const mockfn = jest.fn();
    const sendableFn = jest.fn();
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1, stateId2), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        },
        sendable: () => {
          sendableFn();
          throw Error('');
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

    await untilCbCalled(setTimeout); // 由于reactHook中异步更改触发条件，因此需要异步改变状态才可以触发请求
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(mockfn).not.toBeCalled();
      expect(sendableFn).toBeCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(mockfn).not.toBeCalled();
      expect(sendableFn).toBeCalledTimes(2);
    });
  });

  test('the loading state should be recovered to false when send request immediately', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        transformData: ({ data }: Result<true>) => data
      });
    const mockfn = jest.fn();
    const sendableFn = jest.fn();
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1, stateId2), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        },
        immediate: true,
        sendable: () => {
          sendableFn();
          throw Error('');
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
      onSuccess(() => {
        mockfn();
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
    // 将会命中缓存，因此不能再使用await screen.findByText('loaded')判断请求成功了
    await untilCbCalled(setTimeout, 100);
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

    const successMockFn = jest.fn();
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
        successMockFn();
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
    await waitFor(() => {
      // 暂没发送请求
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(successMockFn).not.toBeCalled();
    });

    await untilCbCalled(setTimeout); // 由于reactHook中异步更改触发条件，因此需要异步改变状态才可以触发请求
    fireEvent.click(screen.getByRole('btn1'));
    let startTs = Date.now();
    await waitFor(() => {
      // 请求已响应
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('10');
      expect(endTs - startTs).toBeLessThan(600);
      expect(successMockFn).toBeCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      // 请求已响应
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(endTs - startTs).toBeLessThan(300);
      expect(successMockFn).toBeCalledTimes(2);
    });

    // 同时改变，以后一个为准
    fireEvent.click(screen.getByRole('btn1'));
    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(endTs - startTs).toBeLessThan(300);
      expect(successMockFn).toBeCalledTimes(3);
    });
  });

  test('set param debounce to be a array that contains an item', async () => {
    const alova = getAlovaInstance(ReactHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        transformData: ({ data }: Result<true>) => data,
        localCache: 100 * 1000
      });

    const successMockFn = jest.fn();
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
        successMockFn();
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
    await waitFor(() => {
      // 暂没发送请求
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(successMockFn).not.toBeCalled();
    });

    await untilCbCalled(setTimeout); // 由于reactHook中异步更改触发条件，因此需要异步改变状态才可以触发请求
    fireEvent.click(screen.getByRole('btn1'));
    let startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('10');
      expect(endTs - startTs).toBeLessThan(450);
      expect(successMockFn).toBeCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      // 第二个值未设置防抖，请求将很快响应
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(endTs - startTs).toBeLessThan(100);
      expect(successMockFn).toBeCalledTimes(2);
    });

    // 同时改变，以后一个为准
    fireEvent.click(screen.getByRole('btn1'));
    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(endTs - startTs).toBeLessThan(100);
      expect(successMockFn).toBeCalledTimes(3);
    });
  });
});
