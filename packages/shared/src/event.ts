/* eslint-disable max-classes-per-file */
import { AlovaEvent, AlovaGenerics, Method } from '../../alova/typings';

export class AlovaEventBase<AG extends AlovaGenerics> implements AlovaEvent<AG> {
  readonly sendArgs: any[];

  readonly method: Method<AG>;

  constructor(method: Method<AG>, sendArgs: any[]) {
    this.method = method;
    this.sendArgs = sendArgs;
  }

  clone() {
    return { ...this };
  }

  static spawn(method: Method, sendArgs: any[]) {
    return new AlovaEventBase(method, sendArgs);
  }
}

export class AlovaSuccessEvent<AG extends AlovaGenerics> extends AlovaEventBase<AG> {
  readonly fromCache: boolean;

  readonly data: AG['Responded'];

  constructor(base: AlovaEventBase<AG>, data: AG['Responded'], fromCache: boolean) {
    super(base.method, base.sendArgs);
    this.data = data;
    this.fromCache = fromCache;
  }
}

export class AlovaErrorEvent<AG extends AlovaGenerics> extends AlovaEventBase<AG> {
  readonly error: any;

  constructor(base: AlovaEventBase<AG>, error: any) {
    super(base.method, base.sendArgs);
    this.error = error;
  }
}

export class AlovaCompleteEvent<AG extends AlovaGenerics> extends AlovaEventBase<AG> {
  /** 响应状态 */
  status: 'success' | 'error';

  /** data数据是否来自缓存，当status为error时，fromCache始终为false */
  readonly fromCache: boolean;

  readonly data: AG['Responded'];

  readonly error: any;

  constructor(base: AlovaEventBase<AG>, status: 'success' | 'error', data: AG['Responded'], fromCache: boolean, error: any) {
    super(base.method, base.sendArgs);
    this.status = status;
    this.data = data;
    this.fromCache = status === 'error' ? false : fromCache;
    this.error = error;
  }
}
