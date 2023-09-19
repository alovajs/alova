import { FrontRequestState, Hook, HookType, UseHookConfig } from '~/typings';
import { noop } from './utils/helper';
import { undefinedValue } from './utils/variables';

export default (ht: HookType, c: UseHookConfig) =>
  ({
    /** 最后一次请求的method实例 */
    m: undefinedValue,

    /** abortRequest */
    ar: noop,

    /** saveStatesFns */
    sf: [],

    /** removeStatesFns */
    rf: [],

    /** frontStates */
    fs: {} as FrontRequestState,

    /** successHandlers */
    sh: [],

    /** errorHandlers */
    eh: [],

    /** completeHandlers */
    ch: [],

    /** hookType, useRequest=1, useWatcher=2, useFetcher=3 */
    ht,

    /** hook config */
    c
  } as Hook);
