/* eslint-disable max-classes-per-file */
import { AlovaEventBase } from '@alova/shared/event';
import { AlovaGenerics } from 'alova';

export class AlovaSSEEvent<AG extends AlovaGenerics> extends AlovaEventBase<AG> {
  eventSource: EventSource; // eventSource实例

  constructor(base: AlovaEventBase<AG>, eventSource: EventSource) {
    super(base.method, base.sendArgs);
    this.eventSource = eventSource;
  }
}

export class AlovaSSEErrorEvent<AG extends AlovaGenerics> extends AlovaSSEEvent<AG> {
  error: Error; // 错误对象

  constructor(base: AlovaSSEEvent<AG>, error: Error) {
    super(base, base.eventSource);
    this.error = error;
  }
}

export class AlovaSSEMessageEvent<AG extends AlovaGenerics, Data> extends AlovaSSEEvent<AG> {
  data: Data; // 每次响应的，经过拦截器转换后的数据

  constructor(base: AlovaSSEEvent<AG>, data: Data) {
    super(base, base.eventSource);
    this.data = data;
  }
}
