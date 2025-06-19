import {
  AlovaError,
  createAssert,
  falseValue,
  filterItem,
  instanceOf,
  isArray,
  isFn,
  isObject,
  newInstance,
  promiseResolve,
  pushItem,
  setTimeoutFn,
  trueValue
} from '@alova/shared';
import { EventSourceFetchInit } from '~/typings/clienthook';
import { EventSourceFetchEvent } from './event';

const assert: ReturnType<typeof createAssert> = createAssert('EventSourceFetch');

type EventSourceFetchEventListener = ((event: EventSourceFetchEvent) => void) | null;
type EventSourceFetchEventListenerObject = { handleEvent: (event: EventSourceFetchEvent) => void };
type EventSourceFetchEventListenerOrEventListenerObject =
  | EventSourceFetchEventListener
  | EventSourceFetchEventListenerObject;

export default class EventSourceFetch implements EventTarget {
  /**
   * connecting status
   */
  static readonly CONNECTING: number = 0;
  /**
   * open status
   */
  static readonly OPEN: number = 1;
  /**
   * closed status
   */
  static readonly CLOSED: number = 2;
  /**
   * connecting status
   */
  readonly CONNECTING: number = 0;
  /**
   * open status
   */
  readonly OPEN: number = 1;
  /**
   * closed status
   */
  readonly CLOSED: number = 2;

  /**
   * URL of the event source
   */
  readonly url: string;
  /**
   * Whether to include credentials in requests
   */
  readonly withCredentials: boolean;
  /**
   * Current state of the connection
   */
  readyState: number;
  /**
   * Handler for open events
   */
  onopen: EventSourceFetchEventListener = null;
  /**
   * Handler for message events
   */
  onmessage: EventSourceFetchEventListener = null;
  /**
   * Handler for error events
   */
  onerror: EventSourceFetchEventListener = null;

  private _options: EventSourceFetchInit;
  private _listeners: Record<string, EventSourceFetchEventListenerOrEventListenerObject[]> = {};
  private _reconnectTime: number | null = null;
  private _controller: AbortController | null = null;
  private _lastEventId: string = '';
  private _origin: string = '';

  /**
   * Creates a new EventSourceFetch instance
   *
   * @param url The URL to connect to
   * @param options Configuration options (includes all fetch options plus EventSource specific options)
   */
  constructor(url: string, options: EventSourceFetchInit = {}) {
    this.url = url;
    this.readyState = EventSourceFetch.CONNECTING;
    this.withCredentials = options.withCredentials || falseValue;

    this._options = { ...options };

    // Extract EventSource specific options
    if (options.reconnectionTime !== undefined) {
      this._reconnectTime = options.reconnectionTime;
    }

    // Get origin from URL
    const urlObj = newInstance(URL, url, window.location.href);
    this._origin = urlObj.origin;

    if (url) {
      // Auto-connect like native EventSource
      setTimeoutFn(() => this._connect());
    }
  }

  /**
   * Adds an event listener for the specified event
   *
   * @param type Event type to listen for
   * @param listener Function or object to call when event is received
   * @param options EventListener options
   */
  addEventListener(type: string, listener: EventSourceFetchEventListenerOrEventListenerObject): void {
    this._listeners[type] = this._listeners[type] || [];

    // Don't add the same listener twice
    const existing = this._listeners[type].find(
      l => l === listener || (isObject(l) && isObject(listener) && l?.handleEvent === listener.handleEvent)
    );

    if (!existing) {
      this._listeners[type].push(listener);
    }
  }

  /**
   * Removes an event listener for the specified event
   *
   * @param type Event type to remove listener from
   * @param listener Function to remove
   * @param options EventListener options
   */
  removeEventListener(type: string, listener: EventSourceFetchEventListenerOrEventListenerObject): void {
    if (!listener || !this._listeners[type]) return;

    this._listeners[type] = filterItem(
      this._listeners[type],
      l =>
        l !== listener &&
        !(typeof l === 'object' && typeof listener === 'object' && l?.handleEvent === listener.handleEvent)
    );
  }

  /**
   * Dispatches an event
   *
   * @param event Event to dispatch
   * @returns Whether preventDefault was called
   */
  dispatchEvent(event: Event): boolean {
    if (!(event instanceof EventSourceFetchEvent)) {
      return trueValue;
    }

    const listeners = this._listeners[event.type] || [];

    // Call all event listeners
    for (const listener of listeners) {
      if (isFn(listener)) {
        listener(event);
      } else if (listener && isFn(listener.handleEvent)) {
        listener.handleEvent(event);
      }
    }

    // Call specific handler if exists
    const handlerName = `on${event.type}` as keyof EventSourceFetch;
    const handler = this[handlerName] as EventSourceFetchEventListener;

    if (isFn(handler)) {
      handler(event);
    }
    return !event.defaultPrevented;
  }

  /**
   * Closes the connection
   */
  close() {
    if (this.readyState === EventSourceFetch.CLOSED) {
      return;
    }
    this.readyState = EventSourceFetch.CLOSED;
    this._dispatchEvent('close', '');
    if (this._controller) {
      this._controller.abort();
      this._controller = null;
    }
  }

  /**
   * Establishes connection to the event source
   */
  private _connect() {
    if (this.readyState === EventSourceFetch.CLOSED) {
      return;
    }
    this._controller = newInstance(AbortController);
    const options = this._options;
    const headers = options.headers || {};
    const accept = ['Accept', 'text/event-stream'];
    const lastEventIdKey = 'Last-Event-ID';
    const lastEventId = this._lastEventId;
    if (isArray(headers)) {
      pushItem(headers, accept);
      lastEventId && pushItem(headers, [lastEventIdKey, lastEventId]);
    } else if (instanceOf(headers, Headers)) {
      headers.append(accept[0], accept[1]);
      lastEventId && headers.append(lastEventIdKey, lastEventId);
    } else if (isObject(headers)) {
      const [acceptHeaderKey, acceptHeaderValue] = accept;
      headers[acceptHeaderKey] = acceptHeaderValue;
      lastEventId && (headers[lastEventIdKey] = lastEventId);
    }

    // Start with base fetch options from user options
    const fetchOptions: RequestInit = {
      ...options,
      headers,
      signal: this._controller.signal
    };

    // Override/set specific options required for SSE
    fetchOptions.credentials = fetchOptions.credentials || (this.withCredentials ? 'include' : 'same-origin');

    fetch(this.url, fetchOptions)
      .then(response => {
        assert(response.ok, `HTTP error: ${response.status}`);
        assert(response.body, 'ReadableStream not supported');

        // Update origin if available
        const responseUrl = newInstance(URL, response.url);
        this._origin = responseUrl.origin;

        this.readyState = EventSourceFetch.OPEN;
        this._dispatchEvent('open', '');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processStream = ({ done, value }: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
          if (done) {
            if (this.readyState !== EventSourceFetch.CLOSED) {
              this._reconnect();
            }
            return promiseResolve();
          }

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split(/\r\n|\r|\n/);
          buffer = lines.pop() || '';

          this._processEventStream(lines);

          return reader
            .read()
            .then(processStream)
            .catch(e => {
              if (e.name !== 'AbortError' && this.readyState !== EventSourceFetch.CLOSED) {
                this._onError(e);
              }
              return promiseResolve();
            });
        };

        return reader
          .read()
          .then(processStream)
          .catch(e => {
            if (e.name !== 'AbortError' && this.readyState !== EventSourceFetch.CLOSED) {
              this._onError(e);
            }
          });
      })
      .catch(err => {
        if (err.name !== 'AbortError' && this.readyState !== EventSourceFetch.CLOSED) {
          this._onError(err);
        }
      });
  }

  /**
   * Processes received event stream lines
   *
   * @param lines Lines received from the event stream
   */
  private _processEventStream(lines: string[]): void {
    let eventType = 'message';
    let data = '';
    let eventId: string | null = null;
    let retry: string | null = null;

    const dispatchPendingEvent = () => {
      if (data) {
        // Remove the last newline if present
        if (data.endsWith('\n')) {
          data = data.substring(0, data.length - 1);
        }

        // Update lastEventId if we got one
        if (eventId !== null) {
          this._lastEventId = eventId;
        }

        // Process retry value if present and _reconnectTime is null
        if (retry !== null && this._reconnectTime === null) {
          const retryInt = parseInt(retry, 10);
          if (!Number.isNaN(retryInt)) {
            this._reconnectTime = retryInt;
          }
        }

        // Dispatch the event
        this._dispatchEvent(eventType, data);
      }

      // Reset for next event
      eventType = 'message';
      data = '';
      eventId = null;
      retry = null;
    };

    for (const line of lines) {
      if (line === '') {
        // Empty line means the event is complete
        dispatchPendingEvent();
        continue;
      }

      // Skip comments
      if (line.startsWith(':')) {
        continue;
      }

      // Parse field:value
      let field: string;
      let value: string;
      const colonIndex = line.indexOf(':');

      if (colonIndex === -1) {
        field = line;
        value = '';
      } else {
        field = line.slice(0, colonIndex);
        value = line.slice(colonIndex + (line[colonIndex + 1] === ' ' ? 2 : 1));
      }

      // Process field
      switch (field) {
        case 'event':
          eventType = value;
          break;
        case 'data':
          data = data ? `${data}\n${value}` : value;
          break;
        case 'id':
          // Null character in ID field terminates the connection
          if (value.includes('\0')) {
            continue;
          }
          eventId = value;
          break;
        case 'retry':
          retry = value;
          break;
        default:
          throw newInstance(AlovaError, 'EventSource', `EventSource: Unknown field "${field}", ignoring`);
      }
    }

    // If last line in buffer wasn't an empty line but we had data, consider the current event incomplete
    // It will be completed on next chunk or if the connection closes
  }

  /**
   * Dispatches an event
   *
   * @param type Event type
   * @param data Event data
   */
  private _dispatchEvent(type: string, data: string): void {
    const event = newInstance(EventSourceFetchEvent, type, {
      type,
      data,
      lastEventId: this._lastEventId,
      origin: this._origin
    });

    this.dispatchEvent(event);
  }

  /**
   * Handles errors
   *
   * @param error Error object
   */
  private _onError(error: Error): void {
    const event = newInstance(EventSourceFetchEvent, 'error', {
      type: 'error',
      data: '',
      lastEventId: this._lastEventId,
      origin: this._origin,
      error
    });

    this.dispatchEvent(event);

    if (this.readyState !== EventSourceFetch.CLOSED) {
      this._reconnect();
    }
  }

  /**
   * Attempts to reconnect after connection closed or error
   */
  private _reconnect(): void {
    if (this._reconnectTime !== null && this._reconnectTime <= 0) {
      this.close();
      return;
    }

    if (this.readyState !== EventSourceFetch.CLOSED) {
      this.readyState = EventSourceFetch.CONNECTING;
      // 如果 _reconnectTime 为 null，使用默认值 1000ms
      const reconnectDelay = this._reconnectTime ?? 1000;
      setTimeoutFn(() => this._connect(), reconnectDelay);
    }
  }
}
