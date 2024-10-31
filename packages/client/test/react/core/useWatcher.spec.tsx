import { getAlovaInstance } from '#/utils';
import { useWatcher } from '@/index';
import ReactHook from '@/statesHook/react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactElement, useState } from 'react';
import { Result, delay } from 'root/testUtils';

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
        transform: ({ data }: Result) => data,
        cacheFor: 100 * 1000
      });
    const mockfn = vi.fn();
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

    await delay(); // Since the trigger condition is changed asynchronously in react hook, the state needs to be changed asynchronously to trigger the request.
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(mockfn).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(mockfn).toHaveBeenCalledTimes(2);
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
        transform: ({ data }: Result<true>) => data,
        cacheFor: null
      });
    const mockfn = vi.fn();
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

    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('status')).toHaveTextContent('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('');

    await delay(); // Since the trigger condition is changed asynchronously in react hook, the state needs to be changed asynchronously to trigger the request.
    fireEvent.click(screen.getByRole('button1'));
    delay().then(() => {
      fireEvent.click(screen.getByRole('button2'));
    });
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(mockfn).toHaveBeenCalledTimes(1); // The request has been sent, but the data is only updated with the latest
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
        transform: ({ data }: Result<true>) => {
          if (data.path === '/unit-test-1s') {
            throw new Error('error');
          }
          return data;
        },
        cacheFor: null
      });
    const mockfn = vi.fn();
    const mockErrorfn = vi.fn();
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

    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('status')).toHaveTextContent('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('');

    await delay(); // Since the trigger condition is changed asynchronously in react hook, the state needs to be changed asynchronously to trigger the request.
    fireEvent.click(screen.getByRole('button1'));
    delay().then(() => {
      fireEvent.click(screen.getByRole('button2'));
    });
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(mockfn).toHaveBeenCalledTimes(1); // The request has been sent, but the data is only updated with the latest
      expect(mockErrorfn).not.toHaveBeenCalled(); // Unit test 1s will not trigger the callback because it responds later.
      expect(screen.getByRole('error')).toHaveTextContent(''); // The corresponding error will also have no value.
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
        transform: ({ data }: Result<true>) => data,
        cacheFor: null
      });
    const mockfn = vi.fn();
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

    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('status')).toHaveTextContent('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('');

    await delay(); // Since the trigger condition is changed asynchronously in react hook, the state needs to be changed asynchronously to trigger the request.
    fireEvent.click(screen.getByRole('button1'));
    delay().then(() => {
      fireEvent.click(screen.getByRole('button2'));
    });
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test-1s');
      expect(screen.getByRole('id1')).toHaveTextContent('3');
      expect(screen.getByRole('id2')).toHaveTextContent('13');
      expect(mockfn).toHaveBeenCalledTimes(2); // The request has been sent, but the data is only updated with the latest
    });
  });

  test('should not send request when change value but intercepted by middleware', async () => {
    const alova = getAlovaInstance(ReactHook, {
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
    const mockfn = vi.fn();
    const sendableFn = vi.fn();
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1, stateId2), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        },
        middleware(context, next) {
          sendableFn();
          if (stateId1 === 1 && stateId2 === 11) {
            next();
          }
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

    await delay(); // Since the trigger condition is changed asynchronously in react hook, the state needs to be changed asynchronously to trigger the request.
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(mockfn).toHaveBeenCalledTimes(1);
      expect(sendableFn).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(mockfn).toHaveBeenCalledTimes(1);
      expect(sendableFn).toHaveBeenCalledTimes(2);
    });
  });

  test('should not send request when change value but throws error in middleware', async () => {
    const alova = getAlovaInstance(ReactHook, {
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
    const mockfn = vi.fn();
    const mockErrorFn = vi.fn();
    const sendableFn = vi.fn();
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);

      const { loading, data, onSuccess, onError } = useWatcher(() => getter(stateId1, stateId2), [stateId1, stateId2], {
        initialData: {
          path: '',
          params: { id1: '', id2: '' }
        },
        middleware() {
          sendableFn();
          throw new Error();
        }
      });

      onError(mockErrorFn);
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

    await delay(); // Since the trigger condition is changed asynchronously in react hook, the state needs to be changed asynchronously to trigger the request.
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(mockfn).not.toHaveBeenCalled();
      expect(sendableFn).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(mockfn).not.toHaveBeenCalled();
      expect(sendableFn).toHaveBeenCalledTimes(2);
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
        transform: ({ data }: Result<true>) => data
      });
    const mockfn = vi.fn();
    const sendableFn = vi.fn();
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);

      const { loading, data, onSuccess } = useWatcher(() => getter(stateId1, stateId2), [stateId1, stateId2], {
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
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('');
    });
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
        transform: ({ data }: Result<true>) => data,
        cacheFor: 100 * 1000
      });
    const mockfn = vi.fn();
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
            onClick={() => send()}>
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
    await screen.findByText('loading');
    await screen.findByText('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('1');
    expect(screen.getByRole('id2')).toHaveTextContent('11');

    fireEvent.click(screen.getByRole('button'));
    await screen.findByText('loading');
    await screen.findByText('loaded');
    expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
    expect(screen.getByRole('id1')).toHaveTextContent('2');
    expect(screen.getByRole('id2')).toHaveTextContent('12');
    expect(mockfn).toHaveBeenCalledTimes(3);

    fireEvent.click(screen.getByRole('btn2'));
    // The cache will be hit, so await screen.findByText('loaded') can no longer be used to determine whether the request is successful.
    await delay(100);
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
        transform: ({ data }: Result<true>) => data,
        cacheFor: 100 * 1000
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
            onClick={() => send()}>
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
        transform: ({ data }: Result<true>) => data,
        cacheFor: 100 * 1000
      });

    const successMockFn = vi.fn();
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
      // No request sent yet
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(successMockFn).not.toHaveBeenCalled();
    });

    await delay(); // Since the trigger condition is changed asynchronously in react hook, the state needs to be changed asynchronously to trigger the request.
    fireEvent.click(screen.getByRole('btn1'));
    let startTs = Date.now();
    await waitFor(() => {
      // Request responded
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('10');
      expect(endTs - startTs).toBeLessThan(600);
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      // Request responded
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(endTs - startTs).toBeLessThan(300);
      expect(successMockFn).toHaveBeenCalledTimes(2);
    });

    // If changed at the same time, the later one shall prevail.
    fireEvent.click(screen.getByRole('btn1'));
    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(endTs - startTs).toBeLessThan(300);
      expect(successMockFn).toHaveBeenCalledTimes(3);
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
        transform: ({ data }: Result<true>) => data,
        cacheFor: 100 * 1000
      });

    const successMockFn = vi.fn();
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
      // No request sent yet
      expect(screen.getByRole('path')).toHaveTextContent('');
      expect(screen.getByRole('id1')).toHaveTextContent('');
      expect(screen.getByRole('id2')).toHaveTextContent('');
      expect(successMockFn).not.toHaveBeenCalled();
    });

    await delay(); // Since the trigger condition is changed asynchronously in react hook, the state needs to be changed asynchronously to trigger the request.
    fireEvent.click(screen.getByRole('btn1'));
    let startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('10');
      expect(endTs - startTs).toBeGreaterThanOrEqual(300);
      expect(endTs - startTs).toBeLessThan(450);
      expect(successMockFn).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      // The second value does not set anti-shake and the request will be responded to very quickly
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('11');
      expect(endTs - startTs).toBeLessThan(100);
      expect(successMockFn).toHaveBeenCalledTimes(2);
    });

    // If changed at the same time, the later one shall prevail.
    fireEvent.click(screen.getByRole('btn1'));
    fireEvent.click(screen.getByRole('btn2'));
    startTs = Date.now();
    await waitFor(() => {
      const endTs = Date.now();
      expect(screen.getByRole('id1')).toHaveTextContent('2');
      expect(screen.getByRole('id2')).toHaveTextContent('12');
      expect(endTs - startTs).toBeLessThan(100);
      expect(successMockFn).toHaveBeenCalledTimes(3);
    });
  });

  test('should request only once when debounce is set', async () => {
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
        transform: ({ data }: Result<true>) => data,
        cacheFor: 100 * 1000
      });
    function Page() {
      const [stateId1, setStateId1] = useState(0);
      const [stateId2, setStateId2] = useState(10);

      const { loading, data, send } = useWatcher(() => getter(stateId1, stateId2), [stateId1, stateId2], {
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
    render((<Page />) as ReactElement<any, any>);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('path')).toHaveTextContent('/unit-test');
      expect(screen.getByRole('id1')).toHaveTextContent('1');
      expect(screen.getByRole('id2')).toHaveTextContent('13');
      expect(Date.now() - startTs).toBeGreaterThan(500);
    });
  });
});
