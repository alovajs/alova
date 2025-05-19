import { AlovaEventBase } from '@/event';
import { trueValue } from '@alova/shared';
import { AlovaGenerics } from 'alova';
import type EventSourceFetch from './EventSourceFetch';

interface EventSourceFetchEventInit {
  /** Event type */
  type: string;
  /** Event data */
  data: string;
  /** Last event ID */
  lastEventId: string;
  /** Origin of the event */
  origin?: string;
  /** Error object (for error events) */
  error?: Error;
}

export class EventSourceFetchEvent extends Event {
  /** Event data */
  readonly data: string;
  /** Last event ID */
  readonly lastEventId: string;
  /** Origin of the event */
  readonly origin: string;
  /** Error object (for error events) */
  readonly error?: Error;

  constructor(type: string, eventInitDict: EventSourceFetchEventInit) {
    super(type, {
      bubbles: trueValue,
      cancelable: trueValue,
      composed: trueValue
    });
    this.data = eventInitDict.data;
    this.lastEventId = eventInitDict.lastEventId;
    this.origin = eventInitDict.origin || '';
    this.error = eventInitDict.error;
  }
}

// extend event
export class AlovaSSEEvent<AG extends AlovaGenerics, Args extends any[] = any[]> extends AlovaEventBase<AG, Args> {
  eventSource: EventSourceFetch; // EventSourceFetch instance

  constructor(base: AlovaEventBase<AG, Args>, eventSource: EventSourceFetch) {
    super(base.method, base.args);
    this.eventSource = eventSource;
  }
}

export class AlovaSSEErrorEvent<AG extends AlovaGenerics, Args extends any[] = any[]> extends AlovaSSEEvent<AG, Args> {
  error: Error; // error object

  constructor(base: AlovaSSEEvent<AG, Args>, error: Error) {
    super(base, base.eventSource);
    this.error = error;
  }
}

export class AlovaSSEMessageEvent<AG extends AlovaGenerics, Args extends any[] = any[]> extends AlovaSSEEvent<
  AG,
  Args
> {
  data: AG['Responded']; // Data converted by the interceptor for each response

  constructor(base: AlovaSSEEvent<AG, Args>, data: AG['Responded']) {
    super(base, base.eventSource);
    this.data = data;
  }
}
