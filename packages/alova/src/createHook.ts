import Method from '@/Method';
import { falseValue, undefinedValue } from '@alova/shared/vars';
import { FrontRequestState, Hook, ReferingObject, EnumHookType as TEnumHookType, UseHookConfig } from '~/typings';

export default (ht: TEnumHookType, c: UseHookConfig, ro: ReferingObject, upd: Hook['upd']) =>
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
    eu: falseValue,

    /** update states */
    upd,

    /** referingObject */
    ro
  }) as Hook;
