import { EventSourceFetchEvent } from '@/event';

interface EventSourceFetchInit extends RequestInit {
  /** Whether to include credentials in the request */
  withCredentials?: boolean;
  /** Reconnection time in milliseconds */
  reconnectionTime?: number;
}

type EventSourceFetchEventListener = ((event: EventSourceFetchEvent) => void) | null;
type EventSourceFetchEventListenerObject = { handleEvent: (event: EventSourceFetchEvent) => void };
type EventSourceFetchEventListenerOrEventListenerObject =
  | EventSourceFetchEventListener
  | EventSourceFetchEventListenerObject;

export default class EventSourceFetch implements EventTarget {
  /** EventSource is connecting */
  static readonly CONNECTING: number = 0;
  /** EventSource is open */
  static readonly OPEN: number = 1;
  /** EventSource is closed */
  static readonly CLOSED: number = 2;

  /** URL of the event source */
  readonly url: string;
  /** Whether to include credentials in requests */
  readonly withCredentials: boolean;
  /** Current state of the connection */
  readyState: number;
  /** Handler for open events */
  onopen: EventSourceFetchEventListener = null;
  /** Handler for message events */
  onmessage: EventSourceFetchEventListener = null;
  /** Handler for error events */
  onerror: EventSourceFetchEventListener = null;

  private _options: EventSourceFetchInit;
  private _listeners: Record<string, EventSourceFetchEventListenerOrEventListenerObject[]> = {};
  private _reconnectTime: number = 1000;
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
    this.withCredentials = options.withCredentials || false;

    this._options = { ...options };

    // Extract EventSource specific options
    if (options.reconnectionTime !== undefined) {
      this._reconnectTime = options.reconnectionTime;
    }

    try {
      // Get origin from URL
      const urlObj = new URL(url, window.location.href);
      this._origin = urlObj.origin;
    } catch (e) {
      // Invalid URL, origin will be set when connection is established
    }

    if (url) {
      // Auto-connect like native EventSource
      setTimeout(() => this._connect(), 0);
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
      l =>
        l === listener ||
        (typeof l === 'object' && typeof listener === 'object' && l?.handleEvent === listener.handleEvent)
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

    this._listeners[type] = this._listeners[type].filter(
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
      return true;
    }

    const listeners = this._listeners[event.type] || [];

    // Call all event listeners
    for (const listener of listeners) {
      try {
        if (typeof listener === 'function') {
          listener(event);
        } else if (listener && typeof listener.handleEvent === 'function') {
          listener.handleEvent(event);
        }
      } catch (e) {
        console.error('Error in event listener', e);
      }
    }

    // Call specific handler if exists
    const handlerName = `on${event.type}` as keyof EventSourceFetch;
    const handler = this[handlerName] as EventSourceFetchEventListener;

    if (typeof handler === 'function') {
      try {
        handler(event);
      } catch (e) {
        console.error(`Error in on${event.type} handler`, e);
      }
    }

    return !event.defaultPrevented;
  }

  /**
   * Closes the connection
   */
  close(): void {
    if (this.readyState === EventSourceFetch.CLOSED) return;

    this.readyState = EventSourceFetch.CLOSED;
    if (this._controller) {
      this._controller.abort();
      this._controller = null;
    }
  }

  /**
   * Establishes connection to the event source
   */
  private _connect(): void {
    if (this.readyState === EventSourceFetch.CLOSED) return;

    this._controller = new AbortController();

    const headers: HeadersInit & { 'Last-Event-ID': string } = {
      Accept: 'text/event-stream',
      ...(this._options.headers || {})
    };

    if (this._lastEventId) {
      headers['Last-Event-ID'] = this._lastEventId;
    }

    // Start with base fetch options from user options
    const fetchOptions: RequestInit = {
      ...this._options,
      headers,
      signal: this._controller.signal
    };

    // Override/set specific options required for SSE
    fetchOptions.method = fetchOptions.method || 'GET';
    fetchOptions.cache = 'no-cache';
    fetchOptions.credentials = this.withCredentials ? 'include' : 'same-origin';

    fetch(this.url, fetchOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported');
        }

        // Update origin if available
        try {
          const responseUrl = new URL(response.url);
          this._origin = responseUrl.origin;
        } catch (e) {
          // Unable to get origin from response URL
        }

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
            return Promise.resolve();
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
              return Promise.resolve();
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
    let eventComplete = false;

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

        // Process retry value if present
        if (retry !== null) {
          const retryInt = parseInt(retry, 10);
          if (!isNaN(retryInt)) {
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
        eventComplete = true;
        dispatchPendingEvent();
        continue;
      }

      // Skip comments
      if (line.startsWith(':')) continue;

      eventComplete = false;

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
          data = data ? data + '\n' + value : value;
          break;
        case 'id':
          // Null character in ID field terminates the connection
          if (value.includes('\0')) {
            console.warn('EventSource: ID field contained null character, ignoring');
            continue;
          }
          eventId = value;
          break;
        case 'retry':
          retry = value;
          break;
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
    const event = new EventSourceFetchEvent(type, {
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
    const event = new EventSourceFetchEvent('error', {
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
    if (this.readyState !== EventSourceFetch.CLOSED) {
      this.readyState = EventSourceFetch.CONNECTING;
      setTimeout(() => this._connect(), this._reconnectTime);
    }
  }
}
