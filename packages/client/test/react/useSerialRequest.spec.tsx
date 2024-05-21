import { useSerialRequest } from '@/index';
import { undefinedValue } from '@alova/shared/vars';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Method, createAlova } from 'alova';
import ReactHook from 'alova/react';
import React, { ReactElement, useState } from 'react';
import { mockRequestAdapter } from '~/test/mockData';

const alovaInst = createAlova({
  baseURL: 'http://localhost:8080',
  statesHook: ReactHook,
  requestAdapter: mockRequestAdapter,
  cacheLogger: false
});
describe('react => useSerialRequest', () => {
  test("should throws a error when don't pass a method handlers array", async () => {
    const methodInstance = alovaInst.Post('/detail');
    const Page = () => {
      const [error, setError] = useState(undefinedValue as Error | undefined);
      try {
        useSerialRequest(methodInstance as any);
      } catch (err: any) {
        !error && setError(err);
      }

      return (
        <div>
          <span role="error">{error?.message || ''}</span>
        </div>
      );
    };

    render((<Page />) as ReactElement<any, any>);
    await waitFor(() => {
      expect(screen.getByRole('error')).toHaveTextContent('[alova/useSerialRequest]please use an array to represent serial requests');
    });
  });

  test('should receive the previous response in every handler function, and receive the latest response data in `data`', async () => {
    const methodHandlerMockFn = jest.fn();
    const mockErrorFn = jest.fn();
    const mockCompleteFn = jest.fn();
    const mockSuccessFn = jest.fn();
    const Page = () => {
      const { loading, error, data, onError, onComplete, onSuccess } = useSerialRequest([
        alovaInst.Post<{ id: number }>('/detail'),
        ret1 => {
          expect(ret1).toStrictEqual({ id: 1 });
          methodHandlerMockFn();
          return alovaInst.Get<{ id: number; text: string }[]>('/info-list');
        },
        ret2 => {
          expect(ret2).toStrictEqual([
            {
              id: 10,
              text: 'a'
            },
            {
              id: 20,
              text: 'b'
            },
            {
              id: 30,
              text: 'c'
            }
          ]);
          methodHandlerMockFn();
          return alovaInst.Delete<{ params: Record<any, any>; data: Record<any, any> }>(`/detail/${ret2[0].id}`, ret2[1]);
        }
      ]);
      onError(mockErrorFn);
      onComplete(mockCompleteFn);
      onSuccess(mockSuccessFn);

      return (
        <div>
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="data">{JSON.stringify(data)}</span>
          <span role="error">{error?.message || ''}</span>
        </div>
      );
    };

    render((<Page />) as ReactElement<any, any>);
    await waitFor(() => {
      expect(mockErrorFn).not.toBeCalled();
      expect(mockCompleteFn).toHaveBeenCalledTimes(1);
      expect(mockSuccessFn).toHaveBeenCalledTimes(1);
      expect(methodHandlerMockFn).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('error')).toHaveTextContent('');
      expect(screen.getByRole('data')).toHaveTextContent(
        JSON.stringify({
          params: {
            id: '10'
          },
          data: {
            id: 20,
            text: 'b'
          }
        })
      );
    });
  });

  test('should pass all the args in send function to every serial method handler', async () => {
    const methodHandlerMockFn = jest.fn();
    const mockErrorFn = jest.fn();
    const mockCompleteFn = jest.fn();
    const mockSuccessFn = jest.fn();
    const Page = () => {
      const { loading, error, data, onError, onComplete, onSuccess, send } = useSerialRequest(
        [
          (...args) => {
            expect(args).toStrictEqual(['aa', 'bb']);
            methodHandlerMockFn();
            return alovaInst.Post<{ id: number }>('/detail');
          },
          (ret1, ...args) => {
            expect(ret1).toStrictEqual({ id: 1 });
            expect(args).toStrictEqual(['aa', 'bb']);
            methodHandlerMockFn();
            return alovaInst.Get<{ id: number; text: string }[]>('/info-list');
          },
          (ret2, ...args) => {
            expect(args).toStrictEqual(['aa', 'bb']);
            expect(ret2).toStrictEqual([
              {
                id: 10,
                text: 'a'
              },
              {
                id: 20,
                text: 'b'
              },
              {
                id: 30,
                text: 'c'
              }
            ]);
            methodHandlerMockFn();
            return alovaInst.Delete<{ params: Record<any, any>; data: Record<any, any> }>(`/detail/${ret2[0].id + args.join()}`, ret2[1]);
          }
        ],
        {
          immediate: false
        }
      );
      onError(mockErrorFn);
      onComplete(mockCompleteFn);
      onSuccess(mockSuccessFn);

      return (
        <div>
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="data">{JSON.stringify(data)}</span>
          <span role="error">{error?.message || ''}</span>
          <button onClick={() => send('aa', 'bb')}>btn</button>
        </div>
      );
    };

    render((<Page />) as ReactElement<any, any>);
    await waitFor(() => {
      expect(mockErrorFn).not.toBeCalled();
      expect(mockCompleteFn).not.toBeCalled();
      expect(mockSuccessFn).not.toBeCalled();
      expect(methodHandlerMockFn).not.toBeCalled();
      expect(screen.getByRole('data')).toHaveTextContent('');
    });

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(mockErrorFn).not.toBeCalled();
      expect(mockCompleteFn).toHaveBeenCalledTimes(1);
      expect(mockSuccessFn).toHaveBeenCalledTimes(1);
      expect(methodHandlerMockFn).toHaveBeenCalledTimes(3);
      expect(screen.getByRole('status')).toHaveTextContent('loaded');
      expect(screen.getByRole('error')).toHaveTextContent('');
      expect(screen.getByRole('data')).toHaveTextContent(
        JSON.stringify({
          params: {
            id: '10aa,bb'
          },
          data: {
            id: 20,
            text: 'b'
          }
        })
      );
    });
  });

  test('any of method handlers request fails should lead to an error', async () => {
    const methodHandlerMockFn = jest.fn();
    const mockErrorFn = jest.fn();
    const mockCompleteFn = jest.fn();
    const mockSuccessFn = jest.fn();
    let errorMethod: Method | null = null;
    const Page = () => {
      const { loading, error, data, onError, onComplete, onSuccess } = useSerialRequest([
        alovaInst.Post<{ id: number }>('/detail'),
        ret1 => {
          expect(ret1).toStrictEqual({ id: 1 });
          methodHandlerMockFn();
          errorMethod = alovaInst.Get<{ id: number; text: string }[]>('/list-error');
          return errorMethod as any;
        },
        ret2 => {
          methodHandlerMockFn();
          return alovaInst.Delete<{ params: Record<any, any>; data: Record<any, any> }>(`/detail/${ret2[0].id}`, ret2[1]);
        }
      ]);
      onError(event => {
        expect(event.method).toBe(errorMethod);
        mockErrorFn();
      });
      onComplete(mockCompleteFn);
      onSuccess(mockSuccessFn);

      return (
        <div>
          <span role="status">{loading ? 'loading' : 'loaded'}</span>
          <span role="data">{JSON.stringify(data)}</span>
          <span role="error">{error?.message || ''}</span>
        </div>
      );
    };

    render((<Page />) as ReactElement<any, any>);
    await waitFor(() => {
      expect(mockErrorFn).toHaveBeenCalledTimes(1);
      expect(mockCompleteFn).toHaveBeenCalledTimes(1);
      expect(mockSuccessFn).not.toBeCalled();
      expect(methodHandlerMockFn).toHaveBeenCalledTimes(1); // 错误了就不会再继续往下执行了
      expect(screen.getByRole('error')).toHaveTextContent('server error');
      expect(screen.getByRole('data')).toHaveTextContent('');
    });
  });
});
