import Taro from '@tarojs/taro';
import TaroEventSource from '@/TaroEventSource';

vi.mock('@tarojs/taro', () => ({ __esModule: true, default: { request: vi.fn() } }));

const str2ab = (str: string): ArrayBuffer => new TextEncoder().encode(str).buffer;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('TaroEventSource', () => {
  let chunkCb: ((res: { data: ArrayBuffer }) => void) | null = null;
  let lastOptions: any = null;
  let aborted = false;

  beforeEach(() => {
    aborted = false;
    chunkCb = null;
    lastOptions = null;
    (Taro.request as any).mockImplementation((options: any) => {
      lastOptions = options;
      return {
        onChunkReceived: (cb: any) => {
          chunkCb = cb;
        },
        offChunkReceived: () => {},
        abort: () => {
          aborted = true;
          lastOptions?.fail && lastOptions.fail({ errMsg: 'request:fail abort' });
        }
      };
    });
  });

  const emit = (str: string) => chunkCb && chunkCb({ data: str2ab(str) });

  test('opens the connection and reports OPEN state', () => {
    const es = new TaroEventSource('http://test/sse');
    expect(es.readyState).toBe(TaroEventSource.OPEN);
    es.close();
  });

  test('dispatches open again after a reconnect', async () => {
    const es = new TaroEventSource('http://test/sse', 60);
    const open = vi.fn();
    es.addEventListener('open', open);
    expect(open).toHaveBeenCalledTimes(0);
    lastOptions.fail({ errMsg: 'network down' });
    await delay(90);
    expect(open).toHaveBeenCalledTimes(1);
    es.close();
  });

  test('dispatches message events with parsed data', () => {
    const es = new TaroEventSource('http://test/sse');
    const message = vi.fn();
    es.addEventListener('message', message);
    emit('data: hello\n\n');
    expect(message).toHaveBeenCalledTimes(1);
    expect(message.mock.calls[0][0].data).toBe('hello');
    es.close();
  });

  test('dispatches custom event types', () => {
    const es = new TaroEventSource('http://test/sse');
    const custom = vi.fn();
    es.addEventListener('myevent', custom);
    emit('event: myevent\ndata: payload\n\n');
    expect(custom).toHaveBeenCalledTimes(1);
    expect(custom.mock.calls[0][0].data).toBe('payload');
    es.close();
  });

  test('ignores comment lines and concatenates multi-line data', () => {
    const es = new TaroEventSource('http://test/sse');
    const message = vi.fn();
    es.addEventListener('message', message);
    emit(': this is a comment\ndata: line1\ndata: line2\n\n');
    expect(message).toHaveBeenCalledTimes(1);
    expect(message.mock.calls[0][0].data).toBe('line1\nline2');
    es.close();
  });

  test('handles events split across chunks', () => {
    const es = new TaroEventSource('http://test/sse');
    const message = vi.fn();
    es.addEventListener('message', message);
    emit('data: par');
    emit('tial\n\n');
    expect(message).toHaveBeenCalledTimes(1);
    expect(message.mock.calls[0][0].data).toBe('partial');
    es.close();
  });

  test('dispatches error and reconnects when reconnectTime > 0', async () => {
    const es = new TaroEventSource('http://test/sse', 60);
    const error = vi.fn();
    es.addEventListener('error', error);
    lastOptions.fail({ errMsg: 'network down' });
    expect(error).toHaveBeenCalledTimes(1);
    await delay(90);
    expect(lastOptions).toBeTruthy();
    const message = vi.fn();
    es.addEventListener('message', message);
    emit('data: after-reconnect\n\n');
    expect(message).toHaveBeenCalledTimes(1);
    es.close();
  });

  test('does not reconnect and emits close when reconnectTime is 0', async () => {
    const es = new TaroEventSource('http://test/sse', 0);
    const beforeOptions = lastOptions;
    const error = vi.fn();
    es.addEventListener('error', error);
    lastOptions.fail({ errMsg: 'network down' });
    expect(error).toHaveBeenCalledTimes(1);
    await delay(60);
    // no new connection should have been established
    expect(lastOptions).toBe(beforeOptions);
    es.close();
  });

  test('close() aborts the underlying request and does not emit error', () => {
    const es = new TaroEventSource('http://test/sse');
    const error = vi.fn();
    es.addEventListener('error', error);
    es.close();
    expect(aborted).toBe(true);
    expect(error).not.toHaveBeenCalled();
  });

  test('dispatches close when the stream ends', () => {
    const es = new TaroEventSource('http://test/sse');
    const close = vi.fn();
    es.addEventListener('close', close);
    lastOptions.success({ statusCode: 200 });
    expect(close).toHaveBeenCalledTimes(1);
  });

  test('dispatchEvent returns false when defaultPrevented is set', () => {
    const es = new TaroEventSource('http://test/sse');
    es.addEventListener('message', (e: any) => {
      e.defaultPrevented = true;
    });
    const ret = es.dispatchEvent({ type: 'message', data: 'x', lastEventId: '', origin: '' });
    expect(ret).toBe(false);
    es.close();
  });
});
