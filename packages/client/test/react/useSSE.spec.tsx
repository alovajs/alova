import { AlovaSSEMessageEvent } from '@/hooks/sse/event';
import { useSSE } from '@/index';
import ReactHook from '@/statesHook/react';
import { undefinedValue } from '@alova/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AlovaGenerics, createAlova } from 'alova';
import GlobalFetch from 'alova/fetch';
import { AddressInfo } from 'net';
import { delay } from 'root/testUtils';
import {
  CloseEventName,
  IntervalEventName,
  IntervalMessage,
  TriggerEventName,
  server,
  send as serverSend
} from '~/test/sseServer';

import { SSEHookReadyState } from '@/hooks/sse/useSSE';
import mockServer from 'root/mockServer';
import { getAlovaInstance } from '../utils';

let port = 0;
beforeAll(() => {
  port = (server.listen().address() as AddressInfo).port;
  // Turn off the default server to avoid throwing a lot of warnings
  mockServer.close();
});
afterAll(() => {
  server.close();
});

type AnyMessageType<AG extends AlovaGenerics = AlovaGenerics> = AlovaSSEMessageEvent<any, AG, any>;

/**
 * Prepare the Alova instance environment and start monitoring the SSE server
 */
const prepareAlova = async () =>
  createAlova({
    baseURL: `http://127.0.0.1:${port}`,
    statesHook: ReactHook,
    requestAdapter: GlobalFetch(),
    cacheLogger: false
  });

describe('react => useSSE', () => {
  // ! No initial data, do not send request immediately
  test('should default not request immediately', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data: any) => alovaInst.Get<string>(`/${IntervalEventName}`, data);

    let recv = undefinedValue;
    const mockOpenFn = vi.fn();
    const mockOnFn = vi.fn((event: AnyMessageType) => {
      recv = event.data;
    });

    const Page = () => {
      const { on, onOpen, data, readyState, send, close, eventSource } = useSSE(poster);
      on(IntervalEventName, mockOnFn as any);
      onOpen(mockOpenFn);

      return (
        <div>
          <span role="event-source-state">{eventSource?.readyState}</span>
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

    render(<Page />);
    expect(screen.getByRole('status')).toHaveTextContent('closed');
    expect(screen.getByRole('data')).toBeEmptyDOMElement();

    // If there is a problem with immediate, you will get at least one interval message within 1000ms.
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

    expect(screen.getByRole('event-source-state')).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('close-btn'));
    await delay(200);
    expect(screen.getByRole('status')).toHaveTextContent('closed');
  });

  // ! There is initial data and the request is not sent immediately
  test('should get the initial data and NOT send request immediately', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data: any) => alovaInst.Get<string>(`/${TriggerEventName}`, data);
    const initialData = 'initial-data';
    const testDataA = 'test-data-1';
    const testDataB = 'test-data-2';

    let recv = undefinedValue;
    const mockOpenFn = vi.fn();
    const mockOnFn = vi.fn((event: AnyMessageType) => {
      recv = event.data;
    });
    // const mockOpenFn = vi.fn();

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

    render(<Page />);
    expect(screen.getByRole('status')).toHaveTextContent('closed');
    expect(screen.getByRole('data')).toHaveTextContent(initialData);

    // If there is a problem with immediate, you will get at least one interval message within 1000ms.
    await delay(1000);

    expect(screen.getByRole('status')).toHaveTextContent('closed');
    expect(screen.getByRole('data')).toHaveTextContent(initialData);

    expect(mockOpenFn).not.toHaveBeenCalled();
    expect(mockOnFn).not.toHaveBeenCalled();

    // Server sends information
    await serverSend(testDataA);
    await delay(300);

    // Send has not been called at this time and the message should not be received.
    expect(screen.getByRole('status')).toHaveTextContent('closed');
    expect(screen.getByRole('data')).toHaveTextContent(initialData);
    expect(mockOnFn).not.toHaveBeenCalled();
    expect(mockOpenFn).not.toHaveBeenCalled();

    // Call send to connect to the server and let the server send information
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

  // ! With initial data, send the request immediately
  test('should get the initial data and send request immediately', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data: any) => alovaInst.Get<string>(`/${TriggerEventName}`, data);
    const initialData = 'initial-data';
    const testDataA = 'test-data-1';

    let recv = undefinedValue;
    const mockOpenFn = vi.fn();
    const mockOnFn = vi.fn((event: AnyMessageType) => {
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

    render(<Page />);

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

  // !Test reconnect after closing
  test('should not trigger handler after close', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data: any) => alovaInst.Get<string>(`/${TriggerEventName}`, data);
    const testDataA = 'test-data-1';
    const testDataB = 'test-data-2';

    let recv = undefinedValue;
    const mockOpenFn = vi.fn();
    const mockOnMessageFn = vi.fn((event: AnyMessageType) => {
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

    render(<Page />);
    expect(screen.getByRole('status')).toHaveTextContent('connecting');
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('opened');
      expect(screen.getByRole('data')).toBeEmptyDOMElement();
    });

    // Test sending data A
    await serverSend(testDataA);
    await waitFor(() => {
      expect(mockOnMessageFn).toHaveBeenCalledTimes(1);
      expect(recv).toStrictEqual(testDataA);
      expect(screen.getByRole('status')).toHaveTextContent('opened');
      expect(screen.getByRole('data')).toHaveTextContent(testDataA);
    });

    // close connection
    fireEvent.click(screen.getByRole('close'));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('closed');
    });

    // Test sending data B, the connection has been closed, the event should not be triggered, and the data should remain unchanged.
    await serverSend(testDataB);
    await waitFor(() => {
      expect(mockOnMessageFn).toHaveBeenCalledTimes(1);
      expect(recv).toStrictEqual(testDataA);
      expect(screen.getByRole('data')).toHaveTextContent(testDataA);
    });

    // Reconnect several times. . .
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

    // Test sending data B
    await serverSend(testDataB);
    await waitFor(() => {
      // When abortLast is true (default), calling send will disconnect the previously established connection.
      expect(mockOnMessageFn).toHaveBeenCalledTimes(2);
      expect(recv).toStrictEqual(testDataB);
      expect(screen.getByRole('data')).toHaveTextContent(testDataB);
    });
  });

  // ! If the opening fails, an error should be reported and the request will be sent immediately.
  test('should throw error then try to connect a not exist url', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data: any) => alovaInst.Get<string>('/not-exist-path', data);

    let recv = undefinedValue;
    const mockOpenFn = vi.fn();
    const mockErrorFn = vi.fn();
    const mockMessageFn = vi.fn((event: AnyMessageType) => {
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

    render(<Page />);
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('closed');
      expect(screen.getByRole('data')).toBeEmptyDOMElement();
      expect(recv).toBeUndefined();
      expect(mockOpenFn).not.toHaveBeenCalled();
      expect(mockMessageFn).not.toHaveBeenCalled();
      expect(mockErrorFn).toHaveBeenCalled();
    });
  });

  // ! If the opening fails, an error should be reported and the request will not be sent immediately.
  test('should throw error then try to connect a not exist url (immediate: false)', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data?: any) => alovaInst.Get<string>('/not-exist-path', data);

    let recv = undefinedValue;
    const mockOpenFn = vi.fn();
    const mockErrorFn = vi.fn();
    const mockMessageFn = vi.fn((event: AnyMessageType) => {
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
            onClick={() => send().catch()}>
            send request
          </button>
        </div>
      );
    };

    render(<Page />);
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

  // ! The interceptor should fire (interceptByGlobalResponded: true)
  // https://alova.js.org/zh-CN/tutorial/combine-framework/response
  test('should trigger global response', async () => {
    const initialData = 'initial-data';

    const replacedData = 'replaced-data';
    const dataReplaceMe = 'data-replace-me';

    const dataThrowError = 'never-gonna-give-you-up';

    const mockResponseFn = vi.fn();
    const mockResponseErrorFn = vi.fn();
    const mockResponseCompleteFn = vi.fn();

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
    const poster = (url = `/${TriggerEventName}`) => alovaInst.Get<string>(url);

    let recv = undefinedValue;
    const mockErrorFn = vi.fn();
    const mockOpenFn = vi.fn();
    const mockOnMessageFn = vi.fn((event: AnyMessageType) => {
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

    render(<Page />);

    expect(screen.getByRole('status')).toHaveTextContent('connecting');
    expect(screen.getByRole('data')).toHaveTextContent(initialData);
    await screen.findByText(/opened/);
    expect(mockOpenFn).toHaveBeenCalled();
    expect(mockResponseFn).not.toHaveBeenCalled();
    expect(mockResponseErrorFn).not.toHaveBeenCalled();

    // This data will be replaced by the response interceptor
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

    // Connecting to a non-existent address
    fireEvent.click(screen.getByRole('send-to-not-exist'));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('connecting');
    });
    await waitFor(() => {
      // Because the target does not exist, so:
      // 1. resErrorExpect will trigger
      // 2. onMessage, responseExpect will not be triggered, and the number of triggers is the same as above; onError will not be triggered because it is intercepted by onError
      // 3. resCompleteExpect will be triggered

      // The global error interceptor will return initialData
      expect(recv).toEqual(initialData);
      expect(screen.getByRole('data')).toHaveTextContent(initialData);

      expect(mockErrorFn).toHaveBeenCalledTimes(0);
      expect(mockResponseFn).toHaveBeenCalledTimes(1);

      // Because the error is intercepted by the global interceptor, onMessage will be called
      expect(mockOnMessageFn).toHaveBeenCalledTimes(2);
      expect(mockResponseErrorFn).toHaveBeenCalledTimes(1);
      expect(mockResponseCompleteFn).toHaveBeenCalledTimes(2);
    });

    // ! Test throws error

    // Connect to normal address
    fireEvent.click(screen.getByRole('send'));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('opened');
    });

    // This data will cause an exception to be thrown
    // Trigger responseExpect and onError
    await serverSend(dataThrowError);
    await waitFor(() => {
      // The global error interceptor will return initialData
      expect(recv).toEqual(initialData);
      expect(screen.getByRole('data')).toHaveTextContent(initialData);

      expect(mockErrorFn).toHaveBeenCalledTimes(1);
      expect(mockResponseFn).toHaveBeenCalledTimes(2);

      expect(mockOnMessageFn).toHaveBeenCalledTimes(2);
      expect(mockResponseErrorFn).toHaveBeenCalledTimes(1);
      expect(mockResponseCompleteFn).toHaveBeenCalledTimes(3);
    });
  });

  // ! The interceptor should not fire (interceptByGlobalResponded: false)
  test('should NOT trigger global response', async () => {
    const initialData = 'initial-data';
    const testDataA = 'test-data-1';
    const replacedData = 'replaced-data';

    const mockResponseFn = vi.fn();
    const mockResponseErrorFn = vi.fn();
    const mockResponseCompleteFn = vi.fn();

    const alovaInst = getAlovaInstance(ReactHook, {
      baseURL: `http://localhost:${port}`,
      responseExpect: () => {
        mockResponseFn();
        return replacedData;
      },
      resErrorExpect: mockResponseErrorFn,
      resCompleteExpect: mockResponseCompleteFn
    });
    const poster = (data: any) => alovaInst.Get<string>(`/${TriggerEventName}`, data);

    let recv = undefinedValue;
    const mockOpenFn = vi.fn();
    const mockErrorFn = vi.fn();
    const mockOnMessageFn = vi.fn((event: AnyMessageType) => {
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

    render(<Page />);

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

  // ! Test POST method with headers and data
  test('should send POST request with headers and data', async () => {
    const alovaInst = await prepareAlova();
    const requestData = { key: 'value' };
    const requestHeaders = { 'x-custom-header': 'custom-value' };
    const method = alovaInst.Post(`/${TriggerEventName}`, requestData, {
      headers: requestHeaders
    });

    const Page = () => {
      const { data } = useSSE(method, { immediate: true, responseType: 'json' });

      return (
        <div>
          <span role="data">{JSON.stringify(data)}</span>
        </div>
      );
    };

    render(<Page />);
    expect(screen.getByRole('data')).toBeEmptyDOMElement();

    await delay(100);
    await serverSend();
    await waitFor(
      () => {
        const data = JSON.parse(screen.getByRole('data').textContent || '{}');
        expect(data.url).toBe(method.url);
        expect(data.method).toBe(method.type);
        expect(data.headers['x-custom-header']).toBe(method.config.headers['x-custom-header']);
        expect(data.body).toStrictEqual(method.data);
      },
      { timeout: 4000 }
    );
  });

  // Test reconnection control functionality
  describe('reconnection control', () => {
    // Test case 1: reconnectionTime: 0 + server disconnect
    test('should NOT reconnect when reconnectionTime is 0 and server disconnects', async () => {
      const alovaInst = await prepareAlova();
      const poster = (data: any) => alovaInst.Get<string>(`/${CloseEventName}`, data);
      const testData = 'closing';

      let recv = undefinedValue;
      const mockOpenFn = vi.fn();
      const mockErrorFn = vi.fn();
      const mockMessageFn = vi.fn((event: AnyMessageType) => {
        recv = event.data;
      });

      const Page = () => {
        const { onMessage, onOpen, onError, data, readyState } = useSSE(poster, {
          immediate: true,
          reconnectionTime: 0
        });
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

      render(<Page />);

      // Wait for connection to be established
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('opened');
        expect(mockOpenFn).toHaveBeenCalledTimes(1);
      });

      // Send test data to confirm connection is working
      await waitFor(() => {
        expect(mockMessageFn).toHaveBeenCalledTimes(1);
        expect(recv).toBe(testData);
        expect(screen.getByRole('data')).toHaveTextContent(testData);
      });

      // wait a long enough time
      // if reconnect, the status should be opened
      await delay(1000);

      expect(mockOpenFn).toHaveBeenCalledTimes(1);
      expect(mockMessageFn).toHaveBeenCalledTimes(1);
      expect(mockErrorFn).toHaveBeenCalledTimes(0);
      expect(screen.getByRole('data')).toHaveTextContent(testData);
      expect(screen.getByRole('status')).toHaveTextContent('closed');
    });

    // Test case 2: reconnectionTime: 0 + user manual disconnect
    test('should NOT reconnect when reconnectionTime is 0 and user closes manually', async () => {
      const alovaInst = await prepareAlova();
      const poster = (data: any) => alovaInst.Get<string>(`/${TriggerEventName}`, data);
      const testData = 'test-data-before-close';

      let recv = undefinedValue;
      const mockOpenFn = vi.fn();
      const mockErrorFn = vi.fn();
      const mockMessageFn = vi.fn((event: AnyMessageType) => {
        recv = event.data;
      });

      const Page = () => {
        const { onMessage, onOpen, onError, data, readyState, close } = useSSE(poster, {
          immediate: true,
          reconnectionTime: 0
        });
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
              role="close"
              onClick={close}>
              Close
            </button>
          </div>
        );
      };

      render(<Page />);

      // Wait for connection to be established
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('opened');
        expect(mockOpenFn).toHaveBeenCalledTimes(1);
      });

      // Send test data to confirm connection is working
      await serverSend(testData);
      await waitFor(() => {
        expect(mockMessageFn).toHaveBeenCalledTimes(1);
        expect(recv).toBe(testData);
      });

      // User manually closes the connection
      fireEvent.click(screen.getByRole('close'));

      // Verify connection is immediately closed
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('closed');
      });

      // Wait long enough to ensure no reconnection attempts
      await delay(1000);

      // Verify no reconnection (onOpen called only once, status remains closed)
      expect(mockOpenFn).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('status')).toHaveTextContent('closed');

      // Verify subsequent messages are not received
      const afterCloseData = 'data-after-close';
      await serverSend(afterCloseData);
      await delay(500);
      expect(mockMessageFn).toHaveBeenCalledTimes(1); // Still only one call
      expect(recv).toBe(testData); // Data not updated
    });

    // Test case 3: reconnectionTime: 100 + server disconnect
    test('should reconnect when reconnectionTime > 0 and server disconnects', async () => {
      const alovaInst = await prepareAlova();
      const poster = (data: any) => alovaInst.Get<string>(`/${CloseEventName}`, data);

      const mockOpenFn = vi.fn();
      const mockErrorFn = vi.fn();
      const mockMessageFn = vi.fn();

      const Page = () => {
        const { onMessage, onOpen, onError, data, readyState } = useSSE(poster, {
          immediate: true,
          reconnectionTime: 100
        });
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

      render(<Page />);

      // Wait for initial connection to be established
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('opened');
        expect(mockOpenFn).toHaveBeenCalledTimes(1);
        expect(mockMessageFn).toHaveBeenCalledTimes(1);
      });

      // Since reconnectionTime is set to 100, it should attempt to reconnect
      // Wait for multiple reconnection attempts
      await delay(500); // Wait for several reconnection attempts

      // Since we are reconnecting, the status should keep opened unchanged.
      expect(screen.getByRole('status')).toHaveTextContent('opened');
      // Verify reconnection attempts occurred (onOpen should be called multiple times)
      expect(mockOpenFn.mock.calls.length).toBeGreaterThan(2);
    });

    // Test case 4: reconnectionTime: 100 + user manual disconnect
    test('should NOT reconnect when user closes manually even if reconnectionTime > 0', async () => {
      const alovaInst = await prepareAlova();
      const poster = (data: any) => alovaInst.Get<string>(`/${TriggerEventName}`, data);
      const testData = 'test-data-manual-close';

      let recv = undefinedValue;
      const mockOpenFn = vi.fn();
      const mockErrorFn = vi.fn();
      const mockMessageFn = vi.fn((event: AnyMessageType) => {
        recv = event.data;
      });

      const Page = () => {
        const { onMessage, onOpen, onError, data, readyState, close } = useSSE(poster, {
          immediate: true,
          reconnectionTime: 100
        });
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
              role="close"
              onClick={close}>
              Close
            </button>
          </div>
        );
      };

      render(<Page />);

      // Wait for connection to be established
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('opened');
        expect(mockOpenFn).toHaveBeenCalledTimes(1);
      });

      // Send test data to confirm connection is working
      await serverSend(testData);
      await waitFor(() => {
        expect(mockMessageFn).toHaveBeenCalledTimes(1);
        expect(recv).toBe(testData);
      });

      // User manually closes the connection
      fireEvent.click(screen.getByRole('close'));

      // Verify connection is immediately closed
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('closed');
      });

      // Wait longer than reconnection time to ensure no reconnection even with reconnectionTime set
      await delay(500); // Wait 5x the reconnection time

      // Verify no reconnection (onOpen called only once, status remains closed)
      expect(mockOpenFn).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('status')).toHaveTextContent('closed');
      expect(mockErrorFn).not.toHaveBeenCalled(); // Should not have errors
    });

    // Test case 5: Verify server retry time override functionality
    test('should use server-specified retry time when reconnectionTime is null', async () => {
      const alovaInst = await prepareAlova();
      const poster = (data: any) => alovaInst.Get<string>(`/${CloseEventName}`, data);

      const mockOpenFn = vi.fn();
      const mockErrorFn = vi.fn();
      const mockMessageFn = vi.fn();
      let reconnectStartTime = 0;
      let reconnectInterval = 0;

      const Page = () => {
        const { onMessage, onOpen, onError, data, readyState } = useSSE(poster, {
          immediate: true
        });
        onMessage(mockMessageFn);
        onOpen(event => {
          const currentTime = Date.now();
          if (reconnectStartTime > 0) {
            reconnectInterval = currentTime - reconnectStartTime;
          }
          reconnectStartTime = currentTime;
          mockOpenFn(event);
        });
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

      render(<Page />);

      // Wait for initial connection
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('opened');
        expect(mockOpenFn).toHaveBeenCalledTimes(1);
        expect(mockMessageFn).toHaveBeenCalledTimes(1); // CloseEventName will send 'closing' message then disconnect
      });

      // Wait for reconnection - server sent retry: 500, so should reconnect after ~500ms
      await waitFor(
        () => {
          expect(mockOpenFn).toHaveBeenCalledTimes(2);
        },
        { timeout: 2000 }
      );

      // Verify reconnection interval is around 500ms (allowing some margin)
      expect(reconnectInterval).toBeGreaterThan(300);
      expect(reconnectInterval).toBeLessThan(1000);
    });
  });
});
