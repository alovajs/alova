import { SSEHookReadyState } from '@/hooks/useSSE';
import { useSSE } from '@/index';
import VueHook from '@/statesHook/vue';
import { GeneralFn } from '@alova/shared/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { AlovaGenerics, createAlova } from 'alova';
import GlobalFetch from 'alova/fetch';
import ES from 'eventsource';
import { AddressInfo } from 'net';
import mockServer from 'root/mockServer';
import { delay, untilCbCalled } from 'root/testUtils';
import { IntervalEventName, IntervalMessage, TriggerEventName, server, send as serverSend } from '~/test/sseServer';
import { AlovaSSEMessageEvent } from '~/typings/clienthook';
import CompUseSSEGlobalResponse from './components/use-sse-global-response.vue';
import CompUseSSE from './components/use-sse.vue';

Object.defineProperty(global, 'EventSource', { value: ES, writable: false });
let port = 0;
beforeAll(() => {
  port = (server.listen().address() as AddressInfo).port;
  // 关掉默认的server，避免抛出大量警告
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
 * 准备 Alova 实例环境，并且开始 SSE 服务器的监听
 */
const prepareAlova = async () =>
  createAlova({
    baseURL: `http://127.0.0.1:${port}`,
    statesHook: VueHook,
    requestAdapter: GlobalFetch(),
    cacheLogger: false
  });

describe('vue => useSSE', () => {
  // ! 无初始数据，不立即发送请求
  test('should default NOT request immediately', async () => {
    const alovaInst = await prepareAlova();
    const poster = (data?: any) => alovaInst.Get(`/${IntervalEventName}`, data);
    const { on, onOpen, data, readyState, send, close } = useSSE(poster);
    const cb = vi.fn();
    const openCb = vi.fn();
    on(IntervalEventName, cb);
    onOpen(openCb);
    const onIntervalCb = (cb: GeneralFn) => on(IntervalEventName, cb);

    expect(readyState.value).toStrictEqual(SSEHookReadyState.CLOSED);
    expect(data.value).toBeUndefined();

    // 如果 immediate 有问题，1000ms 内就会得到至少一个 interval 消息
    await delay(1000);

    expect(readyState.value).toStrictEqual(SSEHookReadyState.CLOSED);
    expect(data.value).toBeUndefined();

    // 调用 send 方法前不应该收到消息
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

  // ! 有初始数据，不立即发送请求
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

    // 调用 send 方法前不应该收到消息
    expect(cb).not.toHaveBeenCalled();
    expect(openCb).not.toHaveBeenCalled();

    // 服务器发送信息
    await serverSend(testDataA);
    await delay(300);

    // 此时还没有调用 send，不应该收到信息
    expect(readyState.value).toStrictEqual(SSEHookReadyState.CLOSED);
    expect(data.value).toStrictEqual(initialData);

    expect(openCb).not.toHaveBeenCalled();
    expect(cb).not.toHaveBeenCalled();

    // 调用 send 连接服务器，并使服务器发送信息
    await send();
    serverSend(testDataB);

    const { data: recvData } = (await untilCbCalled(onMessage)) as AnyMessageType;

    expect(readyState.value).toStrictEqual(SSEHookReadyState.OPEN);
    expect(cb).toHaveBeenCalled();

    expect(recvData).toEqual(testDataB);
    expect(data.value).toStrictEqual(testDataB);
    close();
  });

  // ! 有初始数据，立即发送请求
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

  // ! 测试关闭后重新连接
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

    // 测试发送数据 A
    await serverSend(testDataA);
    await delay(300);

    expect(screen.getByRole('onopen')).toHaveTextContent('1');
    expect(screen.getByRole('status')).toHaveTextContent('opened');
    expect(screen.getByRole('data')).toHaveTextContent(testDataA);

    // 关闭连接
    fireEvent.click(screen.getByRole('close'));
    await delay(500);
    expect(screen.getByRole('status')).toHaveTextContent('closed');

    // 测试发送数据 B
    await serverSend(testDataB);

    // 连接已经关闭，不应该触发事件，数据也应该不变
    expect(screen.getByRole('onmessage')).toHaveTextContent('1');
    expect(screen.getByRole('data')).toHaveTextContent(testDataA);

    // 重新连接若干次。。。
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

    // 测试发送数据 B
    await serverSend(testDataB);
    await delay(300);

    // abortLast 为 true（默认）时，调用 send 会断开之前建立的连接
    expect(screen.getByRole('onmessage')).toHaveTextContent('2');
    expect(screen.getByRole('data')).toHaveTextContent(testDataB);
  });

  // ! 打开失败应该报错，立即发送请求
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

  // ! 打开失败应该报错，不立即发送请求
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

  // ! 拦截器应该触发 (interceptByGlobalResponded: true)
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

    // 这个数据会被响应拦截器替换掉
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

    // 连接到不存在的地址
    fireEvent.click(screen.getByRole('send-to-not-exist'));

    // 等 useSSE 反应一会儿
    await delay(100);

    // 因为目标不存在，所以：
    // 1. resErrorExpect 会触发
    // 2. onMessage, responseExpect 不会被触发，触发次数和上面一样；onError不被触发，因为被 onError 拦截
    // 3. resCompleteExpect 会被触发

    // 全局错误拦截器会返回 initialData
    expect(screen.getByRole('data')).toHaveTextContent(initialData);

    expect(screen.getByRole('onerror')).toHaveTextContent('0');
    expect(screen.getByRole('on-response')).toHaveTextContent('1');

    // 因为错误被全局拦截器拦截，所以 会调用 onMessage
    expect(screen.getByRole('onmessage')).toHaveTextContent('2');
    expect(screen.getByRole('on-response-error')).toHaveTextContent('1');
    expect(screen.getByRole('on-response-complete')).toHaveTextContent('2');

    // ! 测试抛出错误

    // 连接到正常地址
    fireEvent.click(screen.getByRole('send'));
    // 等 useSSE 反应一会儿
    await delay(100);
    expect(screen.getByRole('status')).toHaveTextContent('opened');

    // 这个数据会导致抛出异常
    // 触发responseExpect 和 onError
    await serverSend(dataThrowError);
    await delay(300);

    expect(screen.getByRole('onerror')).toHaveTextContent('1');
    expect(screen.getByRole('on-response')).toHaveTextContent('2');

    expect(screen.getByRole('onmessage')).toHaveTextContent('2');
    expect(screen.getByRole('on-response-error')).toHaveTextContent('1');
    expect(screen.getByRole('on-response-complete')).toHaveTextContent('3');
  });

  // ! 拦截器不应该触发 (interceptByGlobalResponded: false)
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

    // 这个数据会被响应拦截器替换掉
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
});
