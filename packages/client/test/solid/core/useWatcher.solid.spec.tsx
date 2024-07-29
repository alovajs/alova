import { getAlovaInstance } from '#/utils';
import { useWatcher } from '@/index';
import SolidHook from '@/statesHook/solid';
import { render, screen } from '@solidjs/testing-library';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { waitFor } from '@testing-library/vue';
import { delay, Result, untilCbCalled } from 'root/testUtils';
import { createSignal, JSX } from 'solid-js';

describe('use useWatcher hook with Solid.js', () => {
  test('should specify at least one watching state', () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    expect(() => useWatcher(() => alova.Get<Result>('/unit-test'), [])).toThrow();
  });

  test('should send request when value changes', async () => {
    const user = userEvent.setup();
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const getter = (mutateNum: number, mutateNums: number) =>
      alova.Get('/unit-test', {
        params: { num: mutateNum, str: mutateNums },
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        },
        transform: ({ data }: Result) => data,
        cacheFor: 100 * 1000
      });
    const mockfn = jest.fn();
    function Page() {
      const [mutateNum, setMutateNum] = createSignal(0);
      const [mutateNums, setMutateNums] = createSignal(10);
      const { loading, data, onSuccess } = useWatcher(
        () => getter(mutateNum(), mutateNums()),
        [mutateNum, mutateNums],
        {
          initialData: {
            path: '',
            params: { id1: '', id2: '' }
          }
        }
      );
      onSuccess(mockfn);
      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data().path}</span>
          <span role="id1">{data().params.id1}</span>
          <span role="id2">{data().params.id2}</span>
          <button
            onClick={() => {
              setMutateNum(pre => pre + 1);
              setMutateNums(pre => pre + 1);
            }}>
            btn
          </button>
        </div>
      );
    }

    render(
      () => (<Page />) as unknown as JSX.Element as unknown as JSX.Element // </StrictMode>
    );

    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('');
    });

    await untilCbCalled(setTimeout); // 由于reactHook中异步更改触发条件，因此需要异步改变状态才可以触发请求

    await user.click(screen.getByRole('button'));
    waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(mockfn).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole('button'));
    waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(mockfn).toHaveBeenCalledTimes(2);
    });
  });
  test('should get the response that request at last when change value', async () => {
    const user = userEvent.setup();
    let i = 0;
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get(i === 1 ? '/unit-test-1s' : '/unit-test', {
        params: {
          id1,
          id2
        },
        transform: ({ data }: Result<true>) => data,
        cacheFor: null
      });
    const mockfn = jest.fn();

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1(), stateId2()), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        }
      });
      onSuccess(mockfn);
      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data().path}</span>
          <span role="id1">{data().params.id1}</span>
          <span role="id2">{data().params.id2}</span>
          <button
            role="button1"
            onClick={() => {
              i += 1;
              setStateId1(1);
              setStateId2(11);
            }}>
            btn
          </button>
          <button
            role="button2"
            onClick={() => {
              i += 1;
              setStateId1(2);
              setStateId2(12);
            }}>
            btn
          </button>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);

    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('');
    });

    await delay();
    await user.click(screen.getByRole('button1'));
    delay().then(() => {
      user.click(screen.getByRole('button2'));
    });

    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(mockfn).toHaveBeenCalledTimes(1); // 请求已发出，但数据只更新最新的
    });
  });
  test('should ignore the error which is not the last request', async () => {
    let i = 0;
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get(i === 1 ? '/unit-test-1s' : '/unit-test', {
        params: {
          id1,
          id2
        },
        transform: ({ data }: Result<true>) => {
          if (data.path === '/unit-test-1s') {
            throw new Error('error');
          }
          return data;
        },
        cacheFor: null
      });
    const mockfn = jest.fn();
    const mockErrorfn = jest.fn();

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);

      const { loading, error, data, onSuccess, onError } = useWatcher(
        () => getter(stateId1(), stateId2()),
        [stateId1, stateId2],
        {
          initialData: {
            path: '',
            params: { id1: '', id2: '' }
          }
        }
      );

      // createEffect(() => {
      onSuccess(mockfn);
      onError(mockErrorfn);
      // });

      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="error">{error()?.message || ''}</span>
          <span role="path">{data()?.path}</span>
          <span role="id1">{data()?.params.id1}</span>
          <span role="id2">{data()?.params.id2}</span>
          <button
            role="button1"
            onClick={() => {
              i += 1;
              setStateId1(1);
              setStateId2(11);
            }}>
            btn
          </button>
          <button
            role="button2"
            onClick={() => {
              i += 1;
              setStateId1(2);
              setStateId2(12);
            }}>
            btn
          </button>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);

    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('');
    });

    await delay(); // 等待初始渲染完成

    const user = userEvent.setup();
    await user.click(screen.getByRole('button1'));
    await delay(); // 等待第一个按钮点击的异步操作

    await user.click(screen.getByRole('button2'));

    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(mockfn).toHaveBeenCalledTimes(1); // 仅最新请求返回的数据
      expect(mockErrorfn).not.toHaveBeenCalled(); // 错误回调不会被调用
      expect(screen.getByRole('error')).toHaveTextContent(''); // 错误消息为空
    });
  });

  test('should receive last response when set abortLast to false', async () => {
    let i = 0;
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });
    const getter = (id1: number, id2: number) =>
      alova.Get(i === 1 ? '/unit-test-1s' : '/unit-test', {
        params: {
          id1,
          id2
        },
        transform: ({ data }: Result<true>) => data,
        cacheFor: null
      });
    const mockfn = jest.fn();

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1(), stateId2()), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        },
        abortLast: false // 关键设置，确保请求不被中止
      });

      // createEffect(() => {
      onSuccess(mockfn);
      // });

      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data()?.path}</span>
          <span role="id1">{data()?.params.id1}</span>
          <span role="id2">{data()?.params.id2}</span>
          <button
            role="button1"
            onClick={() => {
              i += 1;
              setStateId1(3);
              setStateId2(13);
            }}>
            btn
          </button>
          <button
            role="button2"
            onClick={() => {
              i += 1;
              setStateId1(4);
              setStateId2(14);
            }}>
            btn
          </button>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);

    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('');
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button1'));
    await delay(); // 等待第一个按钮点击的异步操作

    await user.click(screen.getByRole('button2'));

    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test-1s'); // 应该显示最新请求的数据
      expect(screen.getByRole('id1')).toHaveTextContent('4'); // 显示最新请求的 id1
      expect(screen.getByRole('id2')).toHaveTextContent('14'); // 显示最新请求的 id2
      expect(mockfn).toHaveBeenCalledTimes(2); // 两个请求都被调用
    });
  });
  test('should not send request when change value but intercepted by middleware', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });

    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        transform: ({ data }: Result<true>) => data
      });

    const mockfn = jest.fn();
    const sendableFn = jest.fn();

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1(), stateId2()), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        },
        middleware(context, next) {
          sendableFn();
          if (stateId1() === 1 && stateId2() === 11) {
            next();
          }
        }
      });

      // createEffect(() => {
      onSuccess(mockfn);
      // });

      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data()?.path}</span>
          <span role="id1">{data()?.params.id1}</span>
          <span role="id2">{data()?.params.id2}</span>
          <button
            role="button1"
            onClick={() => {
              setStateId1(pre => pre + 1);
              setStateId2(pre => pre + 1);
            }}>
            btn
          </button>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('');
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button1'));
    waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(mockfn).toHaveBeenCalledTimes(1);
      expect(sendableFn).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole('button1'));
    waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(mockfn).toHaveBeenCalledTimes(1);
      expect(sendableFn).toHaveBeenCalledTimes(2);
    });
  });
  test('should not send request when change value but throws error in middleware', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });

    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        transform: ({ data }: Result<true>) => data
      });

    const mockfn = jest.fn();
    const mockErrorFn = jest.fn();
    const sendableFn = jest.fn();

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);

      const { loading, data, onSuccess, onError } = useWatcher(
        () => getter(stateId1(), stateId2()),
        [stateId1, stateId2],
        {
          initialData: {
            path: '',
            params: { id1: '', id2: '' }
          },
          middleware() {
            sendableFn();
            throw new Error(); // 抛出错误，阻止请求发送
          }
        }
      );

      onSuccess(mockfn);
      onError(mockErrorFn);

      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data()?.path}</span>
          <span role="id1">{data()?.params.id1}</span>
          <span role="id2">{data()?.params.id2}</span>
          <button
            // role="button"
            onClick={() => {
              setStateId1(stateId1() + 1);
              setStateId2(stateId2() + 1);
            }}>
            btn
          </button>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);

    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('');
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));
    waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(mockfn).not.toHaveBeenCalled();
      expect(sendableFn).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole('button'));
    waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(mockfn).not.toHaveBeenCalled();
      expect(sendableFn).toHaveBeenCalledTimes(2);
    });
  });

  test('the loading state should be recovered to false when send request immediately', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });

    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        transform: ({ data }: Result<true>) => data
      });

    const mockfn = jest.fn();
    const sendableFn = jest.fn();

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1(), stateId2()), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        },
        immediate: true,
        middleware() {
          sendableFn();
        }
      });

      onSuccess(mockfn);

      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data()?.path}</span>
          <span role="id1">{data()?.params.id1}</span>
          <span role="id2">{data()?.params.id2}</span>
          <button
            onClick={() => {
              setStateId1(stateId1() + 1);
              setStateId2(stateId2() + 1);
            }}>
            btn
          </button>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);

    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loading');
    });

    // Simulate the request completion by waiting for a delay
    await delay();
    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('');
    });

    // Verify that the request was sent and loading state updated correctly
    waitFor(() => {
      expect(sendableFn).toHaveBeenCalledTimes(1);
      expect(mockfn).toHaveBeenCalledTimes(1);
    });

    // Click the button to trigger state change
    const user = userEvent.setup();
    await user.click(screen.getByRole('button'));

    // Verify the updated state
    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loading');
      expect(sendableFn).toHaveBeenCalledTimes(2);
    });

    // Wait for the request to complete and verify final state
    await delay();
    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
    });
  });

  test('should send request when init', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });

    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        timeout: 10000,
        transform: ({ data }: Result<true>) => data,
        cacheFor: 100 * 1000
      });

    const mockfn = jest.fn();

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);

      const { loading, data, onSuccess, send } = useWatcher(
        () => getter(stateId1(), stateId2()),
        [stateId1, stateId2],
        {
          immediate: true,
          initialData: {
            path: '',
            params: { id1: '', id2: '' }
          }
        }
      );

      onSuccess(() => {
        mockfn();
      });

      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data()?.path}</span>
          <span role="id1">{data()?.params.id1}</span>
          <span role="id2">{data()?.params.id2}</span>
          <button
            onClick={() => {
              setStateId1(stateId1() + 1);
              setStateId2(stateId2() + 1);
            }}>
            btn
          </button>
          <button
            role="btn2"
            onClick={() => send()}>
            btn2
          </button>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);

    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('0');
      expect(screen.getByRole('id2')).toHaveTextContent('10');
    });

    userEvent.click(screen.getByRole('button'));
    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loading');
    });
    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
    });

    userEvent.click(screen.getByRole('button'));
    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loading');
    });
    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
    });

    userEvent.click(screen.getByRole('btn2'));
    // Since the request will hit the cache, it won't be able to detect loading.
    await delay(100);
    waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(mockfn).toHaveBeenCalledTimes(4);
    });
  });
  test("initial request shouldn't delay when set the `immediate` and `debounce`", async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });

    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        timeout: 10000,
        transform: ({ data }: Result<true>) => data,
        cacheFor: 100 * 1000
      });

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);

      const { loading, data, send } = useWatcher(() => getter(stateId1(), stateId2()), [stateId1, stateId2], {
        immediate: true,
        debounce: 500,
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        }
      });

      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data()?.path}</span>
          <span role="id1">{data()?.params.id1}</span>
          <span role="id2">{data()?.params.id2}</span>
          <button
            onClick={() => {
              setStateId1(stateId1() + 1);
              setStateId2(stateId2() + 1);
            }}>
            btn
          </button>
          <button
            role="btn2"
            onClick={() => send()}>
            btn2
          </button>
        </div>
      );
    }

    const startTs = Date.now();
    render(() => (<Page />) as unknown as JSX.Element);

    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('0');
      expect(screen.getByRole('id2')).toHaveTextContent('10');
    });

    // Check that the request was made almost immediately
    expect(Date.now() - startTs).toBeLessThan(150);
  });
  test('in different debounce time when set param debounce to be a array', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });

    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        timeout: 10000,
        transform: ({ data }: Result<true>) => data,
        cacheFor: 100 * 1000
      });

    const successMockFn = jest.fn();

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);
      const [pending, setPending] = createSignal(false);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1(), stateId2()), [stateId1, stateId2], {
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
          <span>{pending() ? 'pending' : 'pended'}</span>
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data()?.path}</span>
          <span role="id1">{data()?.params.id1}</span>
          <span role="id2">{data()?.params.id2}</span>
          <button
            role="btn1"
            onClick={() => {
              setStateId1(stateId1() + 1);
              setPending(true);
            }}>
            btn1
          </button>
          <button
            role="btn2"
            onClick={() => {
              setStateId2(stateId2() + 1);
              setPending(true);
            }}>
            btn2
          </button>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);

    waitFor(() => {
      // Request hasn't been sent yet
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(successMockFn).not.toHaveBeenCalled();
    });

    // Simulate state change
    userEvent.click(screen.getByRole('btn1'));
    let startTs = Date.now();
    waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('10');
      expect(endTs - startTs).toBeLessThan(600);
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    // Simulate another state change
    userEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(endTs - startTs).toBeLessThan(300);
      expect(successMockFn).toHaveBeenCalledTimes(2);
    });

    // Simultaneous state changes
    userEvent.click(screen.getByRole('btn1'));
    userEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(endTs - startTs).toBeLessThan(300);
      expect(successMockFn).toHaveBeenCalledTimes(3);
    });
  });

  test('set param debounce to be a array that contains an item', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });

    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        transform: ({ data }: Result<true>) => data,
        cacheFor: 100 * 1000
      });

    const successMockFn = jest.fn();

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);
      const [pending, setPending] = createSignal(false);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1(), stateId2()), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        },
        debounce: [300] // Set debounce to an array with one item
      });

      onSuccess(() => {
        successMockFn();
        setPending(false);
      });

      return (
        <div role="wrap">
          <span>{pending() ? 'pending' : 'pended'}</span>
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data()?.path}</span>
          <span role="id1">{data()?.params.id1}</span>
          <span role="id2">{data()?.params.id2}</span>
          <button
            role="btn1"
            onClick={() => {
              setStateId1(stateId1() + 1);
              setPending(true);
            }}>
            btn1
          </button>
          <button
            role="btn2"
            onClick={() => {
              setStateId2(stateId2() + 1);
              setPending(true);
            }}>
            btn2
          </button>
        </div>
      );
    }

    render(() => (<Page />) as unknown as JSX.Element);

    waitFor(() => {
      // Request hasn't been sent yet
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(successMockFn).not.toHaveBeenCalled();
    });

    // Simulate state change
    userEvent.click(screen.getByRole('btn1'));
    let startTs = Date.now();
    waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('10');
      expect(endTs - startTs).toBeGreaterThanOrEqual(300);
      expect(endTs - startTs).toBeLessThan(450);
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    // Simulate another state change
    userEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    waitFor(() => {
      const endTs = Date.now();
      // Debounce applied, but no debounce time set for second button
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(endTs - startTs).toBeLessThan(100);
      expect(successMockFn).toHaveBeenCalledTimes(2);
    });

    // Simultaneous state changes
    userEvent.click(screen.getByRole('btn1'));
    userEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(endTs - startTs).toBeLessThan(100);
      expect(successMockFn).toHaveBeenCalledTimes(3);
    });
  });
  test('should request only once when debounce is set', async () => {
    const alova = getAlovaInstance(SolidHook, {
      responseExpect: r => r.json()
    });

    const getter = (id1: number, id2: number) =>
      alova.Get('/unit-test', {
        params: {
          id1,
          id2
        },
        timeout: 10000,
        transform: ({ data }: Result<true>) => data,
        cacheFor: 100 * 1000
      });

    function Page() {
      const [stateId1, setStateId1] = createSignal(0);
      const [stateId2, setStateId2] = createSignal(10);

      const { loading, data, send } = useWatcher(() => getter(stateId1(), stateId2()), [stateId1, stateId2], {
        debounce: 500,
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        }
      });

      return (
        <div role="wrap">
          <span role="status">{loading() ? 'loading' : 'loaded'}</span>
          <span role="path">{data()?.path}</span>
          <span role="id1">{data()?.params.id1}</span>
          <span role="id2">{data()?.params.id2}</span>
          <button
            onClick={() => {
              setStateId1(stateId1() + 1);
              setTimeout(() => setStateId2(11), 100);
              setTimeout(() => setStateId2(12), 200);
              setTimeout(() => setStateId2(13), 300);
            }}>
            btn
          </button>
          <button
            role="btn2"
            onClick={() => send()}>
            btn2
          </button>
        </div>
      );
    }

    const startTs = Date.now();
    render(() => (<Page />) as unknown as JSX.Element);

    // Simulate the button click
    userEvent.click(screen.getByRole('button'));

    waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('13');
      expect(Date.now() - startTs).toBeGreaterThan(500);
    });
  });
});
