/* eslint-disable max-classes-per-file */
import { AlovaEvent, Method } from '../../alova/typings';

type AnyMethod = Method<any, any, any, any, any, any, any, any, any>;

export class AlovaEventBase<
  State = any,
  Computed = any,
  Watched = any,
  Export = any,
  Responded = any,
  Transformed = any,
  RequestConfig = any,
  Response = any,
  ResponseHeader = any
> implements AlovaEvent<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
{
  readonly sendArgs: any[];

  readonly method: AnyMethod;

  constructor(method: AnyMethod, sendArgs: any[]) {
    this.method = method;
    this.sendArgs = sendArgs;
  }

  clone() {
    return { ...this };
  }

  static spawn(method: AnyMethod, sendArgs: any[]) {
    return new AlovaEventBase(method, sendArgs);
  }
}

export class AlovaSuccessEvent<
  State,
  Computed,
  Watched,
  Export,
  Responded,
  Transformed,
  RequestConfig,
  Response,
  ResponseHeader
> extends AlovaEventBase<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> {
  readonly fromCache: boolean;

  readonly data: Responded;

  constructor(base: AlovaEventBase, data: Responded, fromCache: boolean) {
    super(base.method, base.sendArgs);
    this.data = data;
    this.fromCache = fromCache;
  }
}

export class AlovaErrorEvent<
  State,
  Computed,
  Watched,
  Export,
  Responded,
  Transformed,
  RequestConfig,
  Response,
  ResponseHeader
> extends AlovaEventBase<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> {
  readonly error: any;

  constructor(base: AlovaEventBase, error: any) {
    super(base.method, base.sendArgs);
    this.error = error;
  }
}

export class AlovaCompleteEvent<
  State,
  Computed,
  Watched,
  Export,
  Responded,
  Transformed,
  RequestConfig,
  Response,
  ResponseHeader
> extends AlovaEventBase<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> {
  /** 响应状态 */
  status: 'success' | 'error';

  /** data数据是否来自缓存，当status为error时，fromCache始终为false */
  readonly fromCache: boolean;

  readonly data: Responded;

  readonly error: any;

  constructor(base: AlovaEventBase, status: 'success' | 'error', data: Responded, fromCache: boolean, error: any) {
    super(base.method, base.sendArgs);
    this.status = status;
    this.data = data;
    this.fromCache = status === 'error' ? false : fromCache;
    this.error = error;
  }
}
