import { AlovaSSEMessageEvent } from '@/event';
import { useSSE } from '@/index';
import { undefinedValue } from '@alova/shared/vars';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AlovaGenerics, createAlova } from 'alova';
import GlobalFetch from 'alova/fetch';
import ReactHook from 'alova/react';
import ES from 'eventsource';
import { AddressInfo } from 'net';
import React, { ReactElement } from 'react';
import { delay } from 'root/testUtils';
import { IntervalEventName, IntervalMessage, TriggerEventName, server, send as serverSend } from '~/test/sseServer';
import { SSEHookReadyState } from '~/typings/clienthook';
// eslint-disable-next-line import/no-named-as-default
import { usePromise } from '@alova/shared/function';
import mockServer from 'root/mockServer';
import { getAlovaInstance } from '../utils';

Object.defineProperty(global, 'EventSource', { value: ES, writable: false });

afterEach(() => {
  const { promise, resolve } = usePromise();
  if (server.listening) {
    server.close(resolve);
    return promise;
  }
});
// 关掉下默认的server，避免抛出大量警告
beforeAll(() => {
  mockServer.close();
});

type AnyMessageType<AG extends AlovaGenerics = AlovaGenerics> = AlovaSSEMessageEvent<AG, any>;

/**
 * 准备 Alova 实例环境，并且开始 SSE 服务器的监听
 */
const prepareAlova = async () => {
  server.listen();
  const { port } = server.address() as AddressInfo;
  return createAlova({
    baseURL: `http://127.0.0.1:${port}`,
    statesHook: ReactHook,
    requestAdapter: GlobalFetch(),
    cacheLogger: false
  });
};

describe('react => useSSE', () => {
  // ! 无初始数据，不立即发送请求
  test('should default not request immediately', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data: any) => alovaInst.Get(`/${IntervalEventName}`, data);

    let recv = undefinedValue;
    const mockOpenFn = jest.fn();
    const mockOnFn = jest.fn((event: AnyMessageType) => {
      recv = event.data;
    });

    const Page = () => {
      const { on, onOpen, data, readyState, send, close } = useSSE(poster);
      on(IntervalEventName, mockOnFn as any);
      onOpen(mockOpenFn);

      return (
        <div>
          <span role="status">
            {readyState === SSEHookReadyState.OPEN
              ? 'opened'
              : readyState === SSEHookReadyState.CLOSED
                ? 'closed'
                : 'connecting'}
          </span>
          <span role="data">{data}</span>
          <button
            role="btn"
            onClick={send}>
            send request
          </button>
          <button
            role="close-btn"
            onClick={close}>
            close
          </button>
        </div>
      );
    };

    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('status')).toHaveTextContent('closed');
    expect(screen.getByRole('data')).toBeEmptyDOMElement();

    // 如果 immediate 有问题，1000ms 内就会得到至少一个 interval 消息
    await delay(1000);

    expect(screen.getByRole('status')).toHaveTextContent('closed');
    expect(screen.getByRole('data')).toBeEmptyDOMElement();
    expect(mockOpenFn).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('btn'));
    await waitFor(
      () => {
        expect(screen.getByRole('status')).toHaveTextContent('opened');
        expect(screen.getByRole('data')).toHaveTextContent(IntervalMessage);
        expect(mockOnFn).toHaveBeenCalled();
        expect(recv).toStrictEqual(IntervalMessage);
      },
      { timeout: 4000 }
    );

    fireEvent.click(screen.getByRole('close-btn'));
    await delay(200);
    expect(screen.getByRole('status')).toHaveTextContent('closed');
  });

  // ! 有初始数据，不立即发送请求
  test('should get the initial data and NOT send request immediately', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data: any) => alovaInst.Get(`/${TriggerEventName}`, data);
    const initialData = 'initial-data';
    const testDataA = 'test-data-1';
    const testDataB = 'test-data-2';

    let recv = undefinedValue;
    const mockOpenFn = jest.fn();
    const mockOnFn = jest.fn((event: AnyMessageType) => {
      recv = event.data;
    });
    // const mockOpenFn = jest.fn();

    const Page = () => {
      const { onMessage, onOpen, data, readyState, send } = useSSE(poster, { initialData });
      onMessage(mockOnFn);
      onOpen(mockOpenFn);

      return (
        <div>
          <span role="status">
            {readyState === SSEHookReadyState.OPEN
              ? 'opened'
              : readyState === SSEHookReadyState.CLOSED
                ? 'closed'
                : 'connecting'}
          </span>
          <span role="data">{data}</span>
          <button
            role="btn"
            onClick={send}>
            send request
          </button>
        </div>
      );
    };

    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('status')).toHaveTextContent('closed');
    expect(screen.getByRole('data')).toHaveTextContent(initialData);

    // 如果 immediate 有问题，1000ms 内就会得到至少一个 interval 消息
    await delay(1000);

    expect(screen.getByRole('status')).toHaveTextContent('closed');
    expect(screen.getByRole('data')).toHaveTextContent(initialData);

    expect(mockOpenFn).not.toHaveBeenCalled();
    expect(mockOnFn).not.toHaveBeenCalled();

    // 服务器发送信息
    await serverSend(testDataA);
    await delay(300);

    // 此时还没有调用 send，不应该收到信息
    expect(screen.getByRole('status')).toHaveTextContent('closed');
    expect(screen.getByRole('data')).toHaveTextContent(initialData);
    expect(mockOnFn).not.toHaveBeenCalled();
    expect(mockOpenFn).not.toHaveBeenCalled();

    // 调用 send 连接服务器，并使服务器发送信息
    fireEvent.click(screen.getByRole('btn'));
    delay(300).then(() => {
      serverSend(testDataB);
    });
    await waitFor(
      () => {
        expect(screen.getByRole('status')).toHaveTextContent('opened');
        expect(mockOnFn).toHaveBeenCalled();
        expect(screen.getByRole('data')).toHaveTextContent(testDataB);
        expect(recv).toStrictEqual(testDataB);
      },
      { timeout: 4000 }
    );
  });

  // ! 有初始数据，立即发送请求
  test('should get the initial data and send request immediately', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data: any) => alovaInst.Get(`/${TriggerEventName}`, data);
    const initialData = 'initial-data';
    const testDataA = 'test-data-1';

    let recv = undefinedValue;
    const mockOpenFn = jest.fn();
    const mockOnFn = jest.fn((event: AnyMessageType) => {
      recv = event.data;
    });

    const Page = () => {
      const { onMessage, onOpen, data, readyState } = useSSE(poster, { immediate: true, initialData });
      onMessage(mockOnFn);
      onOpen(mockOpenFn);

      return (
        <div>
          <span role="status">
            {readyState === SSEHookReadyState.OPEN
              ? 'opened'
              : readyState === SSEHookReadyState.CLOSED
                ? 'closed'
                : 'connecting'}
          </span>
          <span role="data">{data}</span>
        </div>
      );
    };

    render((<Page />) as ReactElement<any, any>);

    expect(screen.getByRole('status')).toHaveTextContent('connecting');
    expect(screen.getByRole('data')).toHaveTextContent(initialData);

    await screen.findByText(/opened/);
    expect(mockOpenFn).toHaveBeenCalled();

    await serverSend(testDataA);

    await waitFor(
      () => {
        expect(mockOnFn).toHaveBeenCalled();
        expect(recv).toEqual(testDataA);
        expect(screen.getByRole('data')).toHaveTextContent(testDataA);
      },
      { timeout: 4000 }
    );
  });

  // ! 测试关闭后重新连接
  test('should not trigger handler after close', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data: any) => alovaInst.Get(`/${TriggerEventName}`, data);
    const testDataA = 'test-data-1';
    const testDataB = 'test-data-2';

    let recv = undefinedValue;
    const mockOpenFn = jest.fn();
    const mockOnMessageFn = jest.fn((event: AnyMessageType) => {
      recv = event.data;
    });

    const Page = () => {
      const { onMessage, onOpen, data, readyState, send, close } = useSSE(poster, { immediate: true });
      onMessage(mockOnMessageFn);
      onOpen(mockOpenFn);

      return (
        <div>
          <span role="status">
            {readyState === SSEHookReadyState.OPEN
              ? 'opened'
              : readyState === SSEHookReadyState.CLOSED
                ? 'closed'
                : 'connecting'}
          </span>
          <span role="data">{data}</span>
          <button
            role="send"
            onClick={send}>
            send request
          </button>
          <button
            role="close"
            onClick={close}>
            close request
          </button>
        </div>
      );
    };

    render((<Page />) as ReactElement<any, any>);
    expect(screen.getByRole('status')).toHaveTextContent('connecting');
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('opened');
      expect(screen.getByRole('data')).toBeEmptyDOMElement();
    });

    // 测试发送数据 A
    await serverSend(testDataA);
    await waitFor(() => {
      expect(mockOnMessageFn).toHaveBeenCalledTimes(1);
      expect(recv).toStrictEqual(testDataA);
      expect(screen.getByRole('status')).toHaveTextContent('opened');
      expect(screen.getByRole('data')).toHaveTextContent(testDataA);
    });

    // 关闭连接
    fireEvent.click(screen.getByRole('close'));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('closed');
    });

    // 测试发送数据 B，连接已经关闭，不应该触发事件，数据也应该不变
    await serverSend(testDataB);
    await waitFor(() => {
      expect(mockOnMessageFn).toHaveBeenCalledTimes(1);
      expect(recv).toStrictEqual(testDataA);
      expect(screen.getByRole('data')).toHaveTextContent(testDataA);
    });

    // 重新连接若干次。。。
    const reconnect = async () => {
      fireEvent.click(screen.getByRole('send'));
      await delay(100);
      fireEvent.click(screen.getByRole('send'));
      await delay(100);
      fireEvent.click(screen.getByRole('send'));
      await delay(100);
      fireEvent.click(screen.getByRole('send'));
      await delay(100);
      fireEvent.click(screen.getByRole('send'));
      await delay(100);
    };
    reconnect();
    await waitFor(() => {
      expect(mockOpenFn).toHaveBeenCalledTimes(6);
      expect(screen.getByRole('status')).toHaveTextContent('opened');
      expect(screen.getByRole('data')).toHaveTextContent(testDataA);
    });

    // 测试发送数据 B
    await serverSend(testDataB);
    await waitFor(() => {
      // abortLast 为 true（默认）时，调用 send 会断开之前建立的连接
      expect(mockOnMessageFn).toHaveBeenCalledTimes(2);
      expect(recv).toStrictEqual(testDataB);
      expect(screen.getByRole('data')).toHaveTextContent(testDataB);
    });
  });

  // ! 打开失败应该报错，立即发送请求
  test('should throw error then try to connect a not exist url', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data: any) => alovaInst.Get('/not-exist-path', data);

    let recv = undefinedValue;
    const mockOpenFn = jest.fn();
    const mockErrorFn = jest.fn();
    const mockMessageFn = jest.fn((event: AnyMessageType) => {
      recv = event.data;
    });

    const Page = () => {
      const { onMessage, onOpen, onError, data, readyState } = useSSE(poster, { immediate: true });
      onMessage(mockMessageFn);
      onOpen(mockOpenFn);
      onError(mockErrorFn);

      return (
        <div>
          <span role="status">
            {readyState === SSEHookReadyState.OPEN
              ? 'opened'
              : readyState === SSEHookReadyState.CLOSED
                ? 'closed'
                : 'connecting'}
          </span>
          <span role="data">{data}</span>
        </div>
      );
    };

    render((<Page />) as ReactElement<any, any>);
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('closed');
      expect(screen.getByRole('data')).toBeEmptyDOMElement();
      expect(recv).toBeUndefined();
      expect(mockOpenFn).not.toHaveBeenCalled();
      expect(mockMessageFn).not.toHaveBeenCalled();
      expect(mockErrorFn).toHaveBeenCalled();
    });
  });

  // ! 打开失败应该报错，不立即发送请求
  test('should throw error then try to connect a not exist url (immediate: false)', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data?: any) => alovaInst.Get('/not-exist-path', data);

    let recv = undefinedValue;
    const mockOpenFn = jest.fn();
    const mockErrorFn = jest.fn();
    const mockMessageFn = jest.fn((event: AnyMessageType) => {
      recv = event.data;
    });

    const Page = () => {
      const { onMessage, onOpen, onError, data, readyState, send } = useSSE(poster);
      onMessage(mockMessageFn);
      onOpen(mockOpenFn);
      onError(mockErrorFn);

      return (
        <div>
          <span role="status">
            {readyState === SSEHookReadyState.OPEN
              ? 'opened'
              : readyState === SSEHookReadyState.CLOSED
                ? 'closed'
                : 'connecting'}
          </span>
          <span role="data">{data}</span>
          <button
            role="send"
            onClick={() => send().catch(e => console.log('fuck', e))}>
            send request
          </button>
        </div>
      );
    };

    render((<Page />) as ReactElement<any, any>);
    await screen.findByText(/closed/);
    expect(screen.getByRole('data')).toBeEmptyDOMElement();
    expect(mockOpenFn).not.toHaveBeenCalled();
    expect(mockMessageFn).not.toHaveBeenCalled();
    expect(mockErrorFn).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('send'));
    await screen.findByText(/connecting/);
    await screen.findByText(/closed/);
    expect(screen.getByRole('data')).toBeEmptyDOMElement();
    expect(recv).toBeUndefined();
    expect(mockOpenFn).not.toHaveBeenCalled();
    expect(mockMessageFn).not.toHaveBeenCalled();
    expect(mockErrorFn).toHaveBeenCalled();
  });

  // ! 拦截器应该触发 (interceptByGlobalResponded: true)
  // https://alova.js.org/zh-CN/tutorial/combine-framework/response
  test('should trigger global response', async () => {
    const { port } = server.listen().address() as AddressInfo;
    const initialData = 'initial-data';

    const replacedData = 'replaced-data';
    const dataReplaceMe = 'data-replace-me';

    const dataThrowError = 'never-gonna-give-you-up';

    const mockResponseFn = jest.fn();
    const mockResponseErrorFn = jest.fn();
    const mockResponseCompleteFn = jest.fn();

    const alovaInst = getAlovaInstance(ReactHook, {
      baseURL: `http://localhost:${port}`,
      responseExpect: data => {
        mockResponseFn();
        if ((data as any) === dataReplaceMe) {
          return replacedData;
        }

        if ((data as any) === dataThrowError) {
          throw new Error('an error...');
        }

        return data;
      },
      resErrorExpect() {
        mockResponseErrorFn();
        return initialData;
      },
      resCompleteExpect() {
        mockResponseCompleteFn();
      }
    });
    const poster = (url = `/${TriggerEventName}`) => alovaInst.Get(url);

    let recv = undefinedValue;
    const mockErrorFn = jest.fn();
    const mockOpenFn = jest.fn();
    const mockOnMessageFn = jest.fn((event: AnyMessageType) => {
      recv = event.data;
    });

    const Page = () => {
      const { onMessage, onOpen, onError, data, readyState, send } = useSSE(poster, {
        immediate: true,
        initialData,
        interceptByGlobalResponded: true
      });
      onMessage(mockOnMessageFn);
      onOpen(mockOpenFn);
      onError(mockErrorFn);

      const sendError = () => {
        send('/not-exist-path');
      };

      return (
        <div>
          <span role="status">
            {readyState === SSEHookReadyState.OPEN
              ? 'opened'
              : readyState === SSEHookReadyState.CLOSED
                ? 'closed'
                : 'connecting'}
          </span>
          <span role="data">{data}</span>
          <button
            role="send"
            onClick={() => send()}>
            send request
          </button>
          <button
            role="send-to-not-exist"
            onClick={sendError}>
            send request to nowhere
          </button>
        </div>
      );
    };

    render((<Page />) as ReactElement<any, any>);

    expect(screen.getByRole('status')).toHaveTextContent('connecting');
    expect(screen.getByRole('data')).toHaveTextContent(initialData);
    await screen.findByText(/opened/);
    expect(mockOpenFn).toHaveBeenCalled();
    expect(mockResponseFn).not.toHaveBeenCalled();
    expect(mockResponseErrorFn).not.toHaveBeenCalled();

    // 这个数据会被响应拦截器替换掉
    await serverSend(dataReplaceMe);
    await waitFor(
      () => {
        expect(screen.getByRole('data')).toHaveTextContent(replacedData);
        expect(recv).toEqual(replacedData);
        expect(mockErrorFn).not.toHaveBeenCalled();
        expect(mockOnMessageFn).toHaveBeenCalledTimes(1);

        expect(mockResponseFn).toHaveBeenCalledTimes(1);
        expect(mockResponseErrorFn).not.toHaveBeenCalled();
        expect(mockResponseCompleteFn).toHaveBeenCalledTimes(1);
      },
      { timeout: 4000 }
    );

    // 连接到不存在的地址
    fireEvent.click(screen.getByRole('send-to-not-exist'));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('connecting');
    });
    await waitFor(() => {
      // 因为目标不存在，所以：
      // 1. resErrorExpect 会触发
      // 2. onMessage, responseExpect 不会被触发，触发次数和上面一样；onError不被触发，因为被 onError 拦截
      // 3. resCompleteExpect 会被触发

      // 全局错误拦截器会返回 initialData
      expect(recv).toEqual(initialData);
      expect(screen.getByRole('data')).toHaveTextContent(initialData);

      expect(mockErrorFn).toHaveBeenCalledTimes(0);
      expect(mockResponseFn).toHaveBeenCalledTimes(1);

      // 因为错误被全局拦截器拦截，所以 会调用 onMessage
      expect(mockOnMessageFn).toHaveBeenCalledTimes(2);
      expect(mockResponseErrorFn).toHaveBeenCalledTimes(1);
      expect(mockResponseCompleteFn).toHaveBeenCalledTimes(2);
    });

    // ! 测试抛出错误

    // 连接到正常地址
    fireEvent.click(screen.getByRole('send'));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('opened');
    });

    // 这个数据会导致抛出异常
    // 触发responseExpect 和 onError
    await serverSend(dataThrowError);
    await waitFor(() => {
      // 全局错误拦截器会返回 initialData
      expect(recv).toEqual(initialData);
      expect(screen.getByRole('data')).toHaveTextContent(initialData);

      expect(mockErrorFn).toHaveBeenCalledTimes(1);
      expect(mockResponseFn).toHaveBeenCalledTimes(2);

      expect(mockOnMessageFn).toHaveBeenCalledTimes(2);
      expect(mockResponseErrorFn).toHaveBeenCalledTimes(1);
      expect(mockResponseCompleteFn).toHaveBeenCalledTimes(3);
    });
  });

  // ! 拦截器不应该触发 (interceptByGlobalResponded: false)
  test('should NOT trigger global response', async () => {
    const { port } = server.listen().address() as AddressInfo;
    const initialData = 'initial-data';
    const testDataA = 'test-data-1';
    const replacedData = 'replaced-data';

    const mockResponseFn = jest.fn();
    const mockResponseErrorFn = jest.fn();
    const mockResponseCompleteFn = jest.fn();

    const alovaInst = getAlovaInstance(ReactHook, {
      baseURL: `http://localhost:${port}`,
      responseExpect: () => {
        mockResponseFn();
        return replacedData;
      },
      resErrorExpect: mockResponseErrorFn,
      resCompleteExpect: mockResponseCompleteFn
    });
    const poster = (data: any) => alovaInst.Get(`/${TriggerEventName}`, data);

    let recv = undefinedValue;
    const mockOpenFn = jest.fn();
    const mockErrorFn = jest.fn();
    const mockOnMessageFn = jest.fn((event: AnyMessageType) => {
      recv = event.data;
    });

    const Page = () => {
      const { onMessage, onOpen, onError, data, readyState } = useSSE(poster, {
        immediate: true,
        initialData,
        interceptByGlobalResponded: false
      });
      onMessage(mockOnMessageFn);
      onOpen(mockOpenFn);
      onError(mockErrorFn);

      return (
        <div>
          <span role="status">
            {readyState === SSEHookReadyState.OPEN
              ? 'opened'
              : readyState === SSEHookReadyState.CLOSED
                ? 'closed'
                : 'connecting'}
          </span>
          <span role="data">{data}</span>
        </div>
      );
    };

    render((<Page />) as ReactElement<any, any>);

    expect(screen.getByRole('status')).toHaveTextContent('connecting');
    expect(screen.getByRole('data')).toHaveTextContent(initialData);

    await screen.findByText(/opened/);
    expect(mockOpenFn).toHaveBeenCalled();
    expect(mockResponseFn).not.toHaveBeenCalled();
    expect(mockResponseErrorFn).not.toHaveBeenCalled();
    expect(mockResponseCompleteFn).not.toHaveBeenCalled();
    expect(mockOnMessageFn).not.toHaveBeenCalled();
    expect(mockErrorFn).not.toHaveBeenCalled();

    await serverSend(testDataA);

    await waitFor(
      () => {
        expect(recv).toEqual(testDataA);
        expect(screen.getByRole('data')).toHaveTextContent(testDataA);

        expect(mockOnMessageFn).toHaveBeenCalledTimes(1);
        expect(mockErrorFn).not.toHaveBeenCalled();
        expect(mockResponseFn).not.toHaveBeenCalled();
        expect(mockResponseErrorFn).not.toHaveBeenCalled();
        expect(mockResponseCompleteFn).not.toHaveBeenCalled();
      },
      { timeout: 4000 }
    );
  });
});
