/// <reference path="../node_modules/@dcloudio/types/index.d.ts" />

import { falseValue, forEach, isFn, newInstance, pushItem, setTimeoutFn, trueValue } from '@alova/shared';

const MessageTypeOpen = 'open';
const MessageTypeMessage = 'message';
const MessageTypeClose = 'close';
const MessageTypeError = 'error';

interface EventSourceEvent {
  type: string;
  data: string;
  lastEventId: string;
  origin: string;
  error?: Error;
  defaultPrevented?: boolean;
}

interface ChunkDecoder {
  decode: (input: Uint8Array, options?: { stream?: boolean }) => string;
}

/**
 * An EventSource-compatible implementation for the **uniapp** platform.
 *
 * Unlike the browser/node implementation (`EventSourceFetch`, which relies on
 * `fetch` + `ReadableStream`), uniapp does not expose streaming fetch. Instead
 * it provides `uni.request({ enableChunked: true })` whose `onChunkReceived`
 * callback delivers the stream as `ArrayBuffer`s. This class decodes those
 * chunks, splits them into SSE lines and feeds them into the exact same
 * event-parsing / dispatch / reconnection logic as `EventSourceFetch`, so
 * `useSSE` behaves identically across platforms.
 */
export default class UniappEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  url: string;
  readyState: number;
  private _reconnectTime: number | null;
  private _options: Record<string, any>;
  private _lines: string[];
  private _eventSourceListeners: Record<string, any[]>;
  private _eventSourceListenerRemoved: Record<string, any[]>;
  private _lastEventId: string;
  private _origin: string;
  private _retryConnectCount: number;
  private _isClosed: boolean;
  private _isOpen: boolean;
  private _task?: any;

  constructor(url: string, reconnectTime: number | null = 1000, options: Record<string, any> = {}) {
    this.url = url;
    this._reconnectTime = reconnectTime;
    this._options = options;
    this._lines = [];
    this._eventSourceListeners = {};
    this._eventSourceListenerRemoved = {};
    this._lastEventId = '';
    let origin = '';
    try {
      origin = newInstance(URL, url).origin;
    } catch {
      origin = '';
    }
    this._origin = origin;
    this._retryConnectCount = 0;
    this._isClosed = falseValue;
    this._isOpen = falseValue;
    this.readyState = UniappEventSource.CONNECTING;
    this._connect();
  }

  private _connect() {
    const { _options: options } = this;
    const { method = 'GET', headers, body } = options;
    const header: Record<string, any> = {
      ...(headers || {}),
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...(this._lastEventId ? { 'Last-Event-ID': this._lastEventId } : {})
    };

    const task: any = uni.request({
      url: this.url,
      method: (method as any) || 'GET',
      header,
      data: body,
      enableChunked: true,
      success: () => {
        // The stream ended (server closed the connection).
        if (this._isOpen && !this._isClosed) {
          this._dispatchEvent({ type: MessageTypeClose, data: '' });
        }
      },
      fail: (err: any) => {
        // An abort triggered by `close()` surfaces as a "fail" with an
        // `abort` message. Treat it as a silent close (matching the
        // `AbortError` handling in the fetch-based implementation).
        if (err?.errMsg && /abort/i.test(err.errMsg)) {
          return;
        }
        this._onError(err instanceof Error ? err : newInstance(Error, err?.errMsg || 'request failed'));
      }
    });
    this._task = task;
    this._isOpen = trueValue;
    this.readyState = UniappEventSource.OPEN;
    this._dispatchEvent({ type: MessageTypeOpen, data: '' });

    const decoder = this._createDecoder();
    let buffer = '';
    task.onChunkReceived((res: { data: ArrayBuffer }) => {
      buffer += this._decodeChunk(decoder, res.data);
      const lines = buffer.split(/\r\n|\r|\n/);
      // The last line may be incomplete (no trailing newline yet); keep it in
      // the buffer and only process the complete lines.
      buffer = lines.pop() || '';
      if (lines.length > 0) {
        this._processEventStream(lines);
      }
    });
  }

  private _createDecoder(): ChunkDecoder {
    try {
      return new TextDecoder();
    } catch {
      // Fallback for environments without TextDecoder (older mini-programs).
      return {
        decode: (input: Uint8Array) => decodeURIComponent(escape(String.fromCharCode(...input)))
      };
    }
  }

  private _decodeChunk(decoder: ChunkDecoder, data: ArrayBuffer): string {
    const bytes = new Uint8Array(data);
    try {
      return decoder.decode(bytes, { stream: true });
    } catch {
      return decoder.decode(bytes);
    }
  }

  private _processEventStream(lines: string[]) {
    if (this._lines.length <= 0) {
      forEach(lines, line => pushItem(this._lines, line));
    } else {
      const lastLine = this._lines[this._lines.length - 1];
      if (lastLine !== '') {
        this._lines[this._lines.length - 1] = lastLine + lines[0];
      }
      forEach(lines.slice(1), line => pushItem(this._lines, line));
    }
    const bufferedLines = this._lines;
    const defaultOpenEvent = MessageTypeOpen;
    let eventType: string = defaultOpenEvent;
    let data: string = '';
    let lastEventId = '';
    let reconnectTime: number | null = 1000;
    let isEventEmitted = falseValue;
    forEach(bufferedLines, line => {
      if (line === '') {
        if (eventType || data) {
          this._dispatchEvent({
            type: eventType === defaultOpenEvent ? MessageTypeMessage : eventType,
            data: data === '' ? ' ' : data
          });
          isEventEmitted = trueValue;
        }
        // reset
        eventType = defaultOpenEvent;
        data = '';
        lastEventId = '';
        reconnectTime = 1000;
      } else if (line[0] === ':') {
        // comment, ignore
      } else {
        const index = line.indexOf(':');
        if (index === -1) {
          var field = line;
          var value = '';
        } else {
          field = line.slice(0, index);
          value = line.slice(index + 1, index + 2) === ' ' ? line.slice(index + 2) : line.slice(index + 1);
        }
        switch (field) {
          case 'event':
            eventType = value;
            break;
          case 'data':
            data += (data ? '\n' : '') + value;
            break;
          case 'id':
            lastEventId = value;
            break;
          case 'retry':
            reconnectTime = value !== '' ? Number(value) : 1000;
            break;
          default:
            break;
        }
      }
    });

    if (isEventEmitted) {
      // only keep the last incomplete line
      const incompleteLine =
        bufferedLines[bufferedLines.length - 1] !== '' ? bufferedLines[bufferedLines.length - 1] : '';
      this._lines = incompleteLine !== '' ? [incompleteLine] : [];
      this._lastEventId = lastEventId;
    } else if (bufferedLines.length > 0 && bufferedLines[bufferedLines.length - 1] !== '') {
      // keep the incomplete line, drop the rest
      this._lines = [bufferedLines[bufferedLines.length - 1]];
    } else {
      this._lines = [];
    }

    void reconnectTime;
  }

  private _dispatchEvent(eventParams: { type: string; data: string; error?: Error }) {
    const { type, data, error } = eventParams;
    const event: EventSourceEvent = {
      type,
      data,
      lastEventId: this._lastEventId,
      origin: this._origin,
      error
    };
    this.dispatchEvent(event);
  }

  addEventListener(type: string, listener: (event: EventSourceEvent) => void) {
    if (!this._eventSourceListeners[type]) {
      this._eventSourceListeners[type] = [];
    }
    pushItem(this._eventSourceListeners[type], listener);
  }

  removeEventListener(type: string, listener: (event: EventSourceEvent) => void) {
    const listeners = this._eventSourceListeners[type];
    if (listeners) {
      this._eventSourceListeners[type] = listeners.filter(l => l !== listener);
    }
    if (!this._eventSourceListenerRemoved[type]) {
      this._eventSourceListenerRemoved[type] = [];
    }
    pushItem(this._eventSourceListenerRemoved[type], listener);
  }

  dispatchEvent(event: EventSourceEvent): boolean {
    const { type } = event;
    const listeners = this._eventSourceListeners[type];
    if (listeners) {
      forEach(listeners, listener => {
        const l = (listener as any).handleEvent ? (listener as any).handleEvent : listener;
        isFn(l) && l(event);
      });
    }
    const handlerName = `on${type}`;
    const handler = (this as any)[handlerName];
    isFn(handler) && handler(event);
    return !(event.defaultPrevented ?? false);
  }

  get open() {
    return this.readyState === UniappEventSource.OPEN;
  }

  close() {
    this._isClosed = trueValue;
    this.readyState = UniappEventSource.CLOSED;
    this._task?.abort();
  }

  private _onError(error: Error) {
    this._dispatchEvent({ type: MessageTypeError, data: '', error });
    if (this.readyState !== UniappEventSource.CLOSED) {
      this._reconnect();
    }
  }

  private _reconnect() {
    if (this._isClosed) {
      return;
    }
    const { _retryConnectCount: retryConnectCount } = this;
    const CUSTOM_EVENT = 'reconnect';
    void retryConnectCount;
    void CUSTOM_EVENT;
    const reconnectTime = this._reconnectTime;
    this.readyState = UniappEventSource.CONNECTING;
    if (reconnectTime !== null && reconnectTime > 0) {
      const timer = setTimeoutFn(() => {
        if (this._isClosed) {
          return;
        }
        this._retryConnectCount++;
        this._connect();
      }, reconnectTime);
      void timer;
    } else {
      // no reconnection
      this._isClosed = trueValue;
      this.readyState = UniappEventSource.CLOSED;
    }
  }
}
