import { CompleteHandler, ErrorHandler, FrontRequestState, SuccessHandler } from '~/typings';
import { Method } from '.';
import { noop } from './utils/helper';

export type HookType = 1 | 2 | 3;
export type SaveStateFn = (frontStates: FrontRequestState) => void;
export default class Hook<S, E, R, T, RC, RE, RH> {
  /** 最后一次请求的method实例 */
  public m: Method<S, E, R, T, RC, RE, RH>;

  /** abortRequest */
  public ar = noop;

  /** saveStatesFns */
  public sf: SaveStateFn[] = [];

  /** removeStatesFns */
  public rf: (typeof noop)[] = [];

  /** frontStates */
  public fs: FrontRequestState;

  /** successHandlers */
  public sh: SuccessHandler<S, E, R, T, RC, RE, RH>[];

  /** errorHandlers */
  public eh: ErrorHandler<S, E, R, T, RC, RE, RH>[];

  /** completeHandlers */
  public ch: CompleteHandler<S, E, R, T, RC, RE, RH>[];

  /** hookType, useRequest=1, useWatcher=2, useFetcher=3 */
  public ht: HookType;
  constructor(hookType: HookType) {
    this.ht = hookType;
  }
}
