/* eslint-disable max-classes-per-file */
import { AlovaEventBase } from '@alova/shared/event';

export class AlovaSSEEvent<
  State = any,
  Computed = any,
  Watched = any,
  Export = any,
  Responded = any,
  Transformed = any,
  RequestConfig = any,
  Response = any,
  ResponseHeader = any
> extends AlovaEventBase<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> {
  eventSource: EventSource; // eventSource实例

  constructor(base: AlovaEventBase, eventSource: EventSource) {
    super(base.method, base.sendArgs);
    this.eventSource = eventSource;
  }
}

export class AlovaSSEErrorEvent<
  State,
  Computed,
  Watched,
  Export,
  Responded,
  Transformed,
  RequestConfig,
  Response,
  ResponseHeader
> extends AlovaSSEEvent<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> {
  error: Error; // 错误对象

  constructor(base: AlovaSSEEvent, error: Error) {
    super(base, base.eventSource);
    this.error = error;
  }
}

export class AlovaSSEMessageEvent<
  Data,
  State,
  Computed,
  Watched,
  Export,
  Responded,
  Transformed,
  RequestConfig,
  Response,
  ResponseHeader
> extends AlovaSSEEvent<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> {
  data: Data; // 每次响应的，经过拦截器转换后的数据

  constructor(base: AlovaSSEEvent, data: Data) {
    super(base, base.eventSource);
    this.data = data;
  }
}
