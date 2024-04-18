import { EnumHookType as TEnumHookType, FrontRequestState, Hook, UseHookConfig } from '~/typings';
import { Method } from '.';
import { falseValue, undefinedValue } from './utils/variables';

export const createHook = (ht: TEnumHookType, c: UseHookConfig) =>
  ({
    /** 最后一次请求的method实例 */
    m: undefinedValue as unknown as Method,

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
    c,

    /** enableDownload */
    ed: falseValue,

    /** enableUpload */
    eu: falseValue
  } as Hook);
