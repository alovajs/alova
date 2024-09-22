import { AlovaGenerics, Method } from '../../alova/typings';
import { AlovaEvent } from '../../client/typings/clienthook';

export class AlovaEventBase<AG extends AlovaGenerics, Args extends any[]> implements AlovaEvent<AG, Args> {
  readonly args: Args;

  readonly method: Method<AG>;

  constructor(method: Method<AG>, args: Args) {
    this.method = method;
    this.args = args;
  }

  clone() {
    return { ...this };
  }

  static spawn<AG extends AlovaGenerics, Args extends any[]>(method: Method<AG>, args: Args) {
    return new AlovaEventBase<AG, Args>(method, args);
  }
}

export class AlovaSuccessEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaEventBase<AG, Args> {
  readonly fromCache: boolean;

  readonly data: AG['Responded'];

  constructor(base: AlovaEventBase<AG, Args>, data: AG['Responded'], fromCache: boolean) {
    super(base.method, base.args);
    this.data = data;
    this.fromCache = fromCache;
  }
}

export class AlovaErrorEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaEventBase<AG, Args> {
  readonly error: any;

  constructor(base: AlovaEventBase<AG, Args>, error: any) {
    super(base.method, base.args);
    this.error = error;
  }
}

export class AlovaCompleteEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaEventBase<AG, Args> {
  /** 响应状态 */
  status: 'success' | 'error';

  /** data数据是否来自缓存，当status为error时，fromCache始终为false */
  readonly fromCache: boolean;

  readonly data: AG['Responded'];

  readonly error: any;

  constructor(
    base: AlovaEventBase<AG, Args>,
    status: 'success' | 'error',
    data: AG['Responded'],
    fromCache: boolean,
    error: any
  ) {
    super(base.method, base.args);
    this.status = status;
    this.data = data;
    this.fromCache = status === 'error' ? false : fromCache;
    this.error = error;
  }
}
