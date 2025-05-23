import { SSEHookReadyState } from '@/hooks/sse/useSSE';
import { useSSE } from '@/index';
import VueHook from '@/statesHook/vue';
import { GeneralFn } from '@alova/shared';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { AlovaGenerics, createAlova } from 'alova';
import GlobalFetch from 'alova/fetch';
import { AddressInfo } from 'net';
import mockServer from 'root/mockServer';
import { delay, untilCbCalled } from 'root/testUtils';
import { IntervalEventName, IntervalMessage, TriggerEventName, server, send as serverSend } from '~/test/sseServer';
import { AlovaSSEMessageEvent } from '~/typings/clienthook';
import CompUseSSEGlobalResponse from './components/use-sse-global-response.vue';
import CompUseSSE from './components/use-sse.vue';

let port = 0;
beforeAll(() => {
  port = (server.listen().address() as AddressInfo).port;
  // Turn off the default server to avoid throwing a lot of warnings
  mockServer.close();
});
afterAll(() => {
  server.close();
});

type AnyMessageType<AG extends AlovaGenerics = AlovaGenerics, Args extends any[] = any[]> = AlovaSSEMessageEvent<
  any,
  AG,
  Args
>;

/**
 * Prepare the Alova instance environment and start monitoring the SSE server
 */
const prepareAlova = async () =>
  createAlova({
    baseURL: `http://127.0.0.1:${port}`,
    statesHook: VueHook,
    requestAdapter: GlobalFetch(),
    cacheLogger: false
  });

describe('vue => useSSE', () => {
  // ! No initial data, do not send request immediately
  test('should default NOT request immediately', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data?: any) => alovaInst.Get<string>(`/${IntervalEventName}`, data);
    const { on, onOpen, data, readyState, send, close } = useSSE(poster);
    const cb = vi.fn();
    const openCb = vi.fn();
    on(IntervalEventName, cb);
    onOpen(openCb);
    const onIntervalCb = (cb: GeneralFn) => on(IntervalEventName, cb);

    expect(readyState.value).toStrictEqual(SSEHookReadyState.CLOSED);
    expect(data.value).toBeUndefined();

    // If there is a problem with immediate, you will get at least one interval message within 1000ms.
    await delay(1000);

    expect(readyState.value).toStrictEqual(SSEHookReadyState.CLOSED);
    expect(data.value).toBeUndefined();

    // The message should not be received before calling the send method
    expect(cb).not.toHaveBeenCalled();
    expect(openCb).not.toHaveBeenCalled();

    await send();
    await delay(100);
    expect(openCb).toHaveBeenCalled();

    const { data: recvData } = (await untilCbCalled(onIntervalCb)) as AnyMessageType;

    expect(readyState.value).toStrictEqual(SSEHookReadyState.OPEN);
    expect(cb).toHaveBeenCalled();

    expect(recvData).toEqual(IntervalMessage);
    expect(data.value).toStrictEqual(IntervalMessage);
    close();
  }, 3000);

  // ! There is initial data and the request is not sent immediately
  test('should get the initial data and NOT send request immediately', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data?: any) => alovaInst.Get(`/${TriggerEventName}`, data);
    const initialData = {
      id: 9527,
      name: 'Tom',
      age: 18
    };
    const { onMessage, onOpen, data, readyState, send, close } = useSSE(poster, { initialData });

    const testDataA = 'test-data-1';
    const testDataB = 'test-data-2';

    const cb = vi.fn();
    const openCb = vi.fn();
    onMessage(cb);
    onOpen(openCb);

    expect(readyState.value).toStrictEqual(SSEHookReadyState.CLOSED);
    expect(data.value).toStrictEqual(initialData);

    // The message should not be received before calling the send method
    expect(cb).not.toHaveBeenCalled();
    expect(openCb).not.toHaveBeenCalled();

    // Server sends information
    await serverSend(testDataA);
    await delay(300);

    // Send has not been called at this time and the message should not be received.
    expect(readyState.value).toStrictEqual(SSEHookReadyState.CLOSED);
    expect(data.value).toStrictEqual(initialData);

    expect(openCb).not.toHaveBeenCalled();
    expect(cb).not.toHaveBeenCalled();

    // Call send to connect to the server and let the server send information
    await send();
    serverSend(testDataB);

    const { data: recvData } = await untilCbCalled(onMessage);

    expect(readyState.value).toStrictEqual(SSEHookReadyState.OPEN);
    expect(cb).toHaveBeenCalled();

    expect(recvData).toEqual(testDataB);
    expect(data.value).toStrictEqual(testDataB);
    close();
  });

  // ! With initial data, send the request immediately
  test('should get the initial data and send request immediately', async () => {
    const initialData = 'initial-data';
    const testDataA = 'test-data-1';

    render(CompUseSSE, {
      props: {
        port,
        path: `/${TriggerEventName}`,
        initialData,
        immediate: true
      }
    });

    expect(screen.getByRole('data')).toHaveTextContent(initialData);

    await screen.findByText(/opened/);
    await delay(100);

    expect(screen.getByRole('onopen')).toHaveTextContent('1');

    await serverSend(testDataA);

    await waitFor(
      () => {
        expect(screen.getByRole('onmessage')).toHaveTextContent('1');
        expect(screen.getByRole('data')).toHaveTextContent(testDataA);
      },
      { timeout: 4000 }
    );
  });

  // !Test reconnect after closing
  test('should not trigger handler after close', async () => {
    render(CompUseSSE, {
      props: {
        port,
        path: `/${TriggerEventName}`,
        immediate: true
      }
    });

    const testDataA = 'test-data-1';
    const testDataB = 'test-data-2';

    await screen.findByText(/opened/);

    expect(screen.getByRole('data')).toBeEmptyDOMElement();

    // Test sending data A
    await serverSend(testDataA);
    await delay(300);

    expect(screen.getByRole('onopen')).toHaveTextContent('1');
    expect(screen.getByRole('status')).toHaveTextContent('opened');
    expect(screen.getByRole('data')).toHaveTextContent(testDataA);

    // close connection
    fireEvent.click(screen.getByRole('close'));
    await delay(500);
    expect(screen.getByRole('status')).toHaveTextContent('closed');

    // Test sending data B
    await serverSend(testDataB);

    // The connection has been closed, the event should not be triggered, and the data should remain unchanged.
    expect(screen.getByRole('onmessage')).toHaveTextContent('1');
    expect(screen.getByRole('data')).toHaveTextContent(testDataA);

    // Reconnect several times. . .
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

    expect(screen.getByRole('onopen')).toHaveTextContent('6');
    expect(screen.getByRole('status')).toHaveTextContent('opened');
    expect(screen.getByRole('data')).toHaveTextContent(testDataA);

    // Test sending data B
    await serverSend(testDataB);
    await delay(300);

    // When abortLast is true (default), calling send will disconnect the previously established connection.
    expect(screen.getByRole('onmessage')).toHaveTextContent('2');
    expect(screen.getByRole('data')).toHaveTextContent(testDataB);
  });

  // ! If the opening fails, an error should be reported and the request will be sent immediately.
  test('should throw error then try to connect a not exist url', async () => {
    render(CompUseSSE, {
      props: {
        port,
        path: '/not-exist-path',
        immediate: true
      }
    });

    await delay(500);
    await screen.findByText(/closed/);
    expect(screen.getByRole('data')).toBeEmptyDOMElement();
    expect(screen.getByRole('onopen')).toHaveTextContent('0');
    expect(screen.getByRole('onerror')).toHaveTextContent('1');
    expect(screen.getByRole('onmessage')).toHaveTextContent('0');
  });

  // ! If the opening fails, an error should be reported and the request will not be sent immediately.
  test('should throw error then try to connect a not exist url (immediate: false)', async () => {
    render(CompUseSSE, {
      props: {
        port,
        path: '/not-exist-path'
      }
    });

    await screen.findByText(/closed/);
    expect(screen.getByRole('data')).toBeEmptyDOMElement();
    expect(screen.getByRole('onopen')).toHaveTextContent('0');
    expect(screen.getByRole('onerror')).toHaveTextContent('0');
    expect(screen.getByRole('onmessage')).toHaveTextContent('0');

    fireEvent.click(screen.getByRole('send'));
    await screen.findByText(/connecting/);
    await delay(500);

    await screen.findByText(/closed/);
    expect(screen.getByRole('data')).toBeEmptyDOMElement();
    expect(screen.getByRole('onopen')).toHaveTextContent('0');
    expect(screen.getByRole('onerror')).toHaveTextContent('1');
    expect(screen.getByRole('onmessage')).toHaveTextContent('0');
  });

  // ! The interceptor should fire (interceptByGlobalResponded: true)
  test('should trigger global response', async () => {
    const initialData = 'initial-data';

    const replacedData = 'replaced-data';
    const dataReplaceMe = 'data-replace-me';

    const dataThrowError = 'never-gonna-give-you-up';

    render(CompUseSSEGlobalResponse, {
      props: {
        port,
        interceptByGlobalResponded: true,
        immediate: true,
        initialData,
        path: `/${TriggerEventName}`
      }
    });

    expect(screen.getByRole('data')).toHaveTextContent(initialData);

    await screen.findByText(/opened/);
    await delay(100);

    expect(screen.getByRole('onopen')).toHaveTextContent('1');
    expect(screen.getByRole('on-response')).toHaveTextContent('0');
    expect(screen.getByRole('on-response-error')).toHaveTextContent('0');

    // This data will be replaced by the response interceptor
    await serverSend(dataReplaceMe);
    await delay(500);

    await waitFor(
      () => {
        expect(screen.getByRole('data')).toHaveTextContent(replacedData);
        expect(screen.getByRole('onerror')).toHaveTextContent('0');
        expect(screen.getByRole('onmessage')).toHaveTextContent('1');

        expect(screen.getByRole('on-response')).toHaveTextContent('1');
        expect(screen.getByRole('on-response-error')).toHaveTextContent('0');
        expect(screen.getByRole('on-response-complete')).toHaveTextContent('1');
      },
      { timeout: 4000 }
    );

    // Connecting to a non-existent address
    fireEvent.click(screen.getByRole('send-to-not-exist'));

    // Wait for useSSE to react for a while
    await delay(100);

    // Because the target does not exist, so:
    // 1. resErrorExpect will trigger
    // 2. onMessage, responseExpect will not be triggered, and the number of triggers is the same as above; onError will not be triggered because it is intercepted by onError
    // 3. resCompleteExpect will be triggered

    // The global error interceptor will return initialData
    expect(screen.getByRole('data')).toHaveTextContent(initialData);

    expect(screen.getByRole('onerror')).toHaveTextContent('0');
    expect(screen.getByRole('on-response')).toHaveTextContent('1');

    // Because the error is intercepted by the global interceptor, onMessage will be called
    expect(screen.getByRole('onmessage')).toHaveTextContent('2');
    expect(screen.getByRole('on-response-error')).toHaveTextContent('1');
    expect(screen.getByRole('on-response-complete')).toHaveTextContent('2');

    // ! Test throws error

    // Connect to normal address
    fireEvent.click(screen.getByRole('send'));
    // Wait for useSSE to react for a while
    await delay(100);
    expect(screen.getByRole('status')).toHaveTextContent('opened');

    // This data will cause an exception to be thrown
    // Trigger responseExpect and onError
    await serverSend(dataThrowError);
    await delay(300);

    expect(screen.getByRole('onerror')).toHaveTextContent('1');
    expect(screen.getByRole('on-response')).toHaveTextContent('2');

    expect(screen.getByRole('onmessage')).toHaveTextContent('2');
    expect(screen.getByRole('on-response-error')).toHaveTextContent('1');
    expect(screen.getByRole('on-response-complete')).toHaveTextContent('3');
  });

  // ! The interceptor should not fire (interceptByGlobalResponded: false)
  test('should NOT trigger global response', async () => {
    const initialData = 'initial-data';
    const testDataA = 'test-data-1';

    render(CompUseSSEGlobalResponse, {
      props: {
        port,
        interceptByGlobalResponded: false,
        immediate: true,
        initialData,
        path: `/${TriggerEventName}`
      }
    });

    expect(screen.getByRole('data')).toHaveTextContent(initialData);

    await screen.findByText(/opened/);
    await delay(100);

    expect(screen.getByRole('onopen')).toHaveTextContent('1');
    expect(screen.getByRole('on-response')).toHaveTextContent('0');
    expect(screen.getByRole('on-response-error')).toHaveTextContent('0');
    expect(screen.getByRole('on-response-complete')).toHaveTextContent('0');

    // This data will be replaced by the response interceptor
    await serverSend(testDataA);
    await delay(500);

    await waitFor(
      () => {
        expect(screen.getByRole('data')).toHaveTextContent(testDataA);
        expect(screen.getByRole('onmessage')).toHaveTextContent('1');
        expect(screen.getByRole('onerror')).toHaveTextContent('0');

        expect(screen.getByRole('on-response')).toHaveTextContent('0');
        expect(screen.getByRole('on-response-error')).toHaveTextContent('0');
        expect(screen.getByRole('on-response-complete')).toHaveTextContent('0');
      },
      { timeout: 4000 }
    );
  });

  // ! Test POST method with headers and data
  test('should send POST request with headers and data', async () => {
    const alovaInst = await prepareAlova();
    const requestData = { key: 'value' };
    const requestHeaders = { 'x-custom-header': 'custom-value' };
    const method = alovaInst.Post<{
      url: string;
      method: string;
      headers: Record<string, string>;
      body: Record<string, string>;
    }>(`/${TriggerEventName}`, requestData, {
      headers: requestHeaders
    });
    const { data } = useSSE(method, { immediate: true, responseType: 'json' });

    await delay(100);
    // Server sends information
    await serverSend();
    await delay(1000);

    expect(data.value.url).toBe(method.url);
    expect(data.value.method).toBe(method.type);
    expect(data.value.headers['x-custom-header']).toBe(method.config.headers['x-custom-header']);
    expect(data.value.body).toStrictEqual(method.data);
  });
});
