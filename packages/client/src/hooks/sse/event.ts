import { AlovaEventBase } from '@/event';
import { falseValue, nullValue, trueValue } from '@alova/shared';
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

interface BaseEventInit {
  bubbles?: boolean;
  cancelable?: boolean;
  composed?: boolean;
}
class BaseEvent {
  readonly type: string;
  readonly bubbles: boolean;
  readonly cancelable: boolean;
  readonly composed: boolean;
  readonly timeStamp: number;

  // Event standard properties
  cancelBubble: boolean = falseValue;
  currentTarget: EventTarget | null = nullValue;
  defaultPrevented: boolean = falseValue;
  eventPhase: number = 0;
  isTrusted: boolean = falseValue;
  returnValue: boolean = trueValue;
  srcElement: EventTarget | null = nullValue;
  target: EventTarget | null = nullValue;

  // Event standard constants
  static readonly NONE = 0;
  static readonly CAPTURING_PHASE = 1;
  static readonly AT_TARGET = 2;
  static readonly BUBBLING_PHASE = 3;

  readonly NONE = 0;
  readonly CAPTURING_PHASE = 1;
  readonly AT_TARGET = 2;
  readonly BUBBLING_PHASE = 3;

  constructor(type: string, eventInitDict: BaseEventInit = {}) {
    this.type = type;
    this.bubbles = eventInitDict.bubbles ?? false;
    this.cancelable = eventInitDict.cancelable ?? false;
    this.composed = eventInitDict.composed ?? false;
    this.timeStamp = Date.now();
  }

  // Event 标准方法
  preventDefault(): void {
    if (this.cancelable) {
      this.defaultPrevented = true;
    }
  }

  stopImmediatePropagation(): void {}

  stopPropagation(): void {
    this.cancelBubble = true;
  }

  composedPath(): EventTarget[] {
    return [];
  }

  initEvent(type: string, bubbles?: boolean, cancelable?: boolean): void {
    type;
    bubbles;
    cancelable;
  }
}

const EventConstructor = typeof Event !== 'undefined' ? Event : BaseEvent;
export class EventSourceFetchEvent extends EventConstructor {
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

export class AlovaSSEMessageEvent<Data, AG extends AlovaGenerics, Args extends any[] = any[]> extends AlovaSSEEvent<
  AG,
  Args
> {
  data: Data; // Data converted by the interceptor for each response

  constructor(base: AlovaSSEEvent<AG, Args>, data: Data) {
    super(base, base.eventSource);
    this.data = data;
  }
}
