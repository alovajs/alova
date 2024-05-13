import { EventManager } from '@alova/shared/createEventManager';
import { falseValue, undefinedValue } from '@alova/shared/vars';
import type { AlovaEvent, FrontRequestState, Hook, ReferingObject, EnumHookType as TEnumHookType, UseHookConfig } from 'alova';
import { Method } from 'alova';

export default (
  ht: TEnumHookType,
  c: UseHookConfig,
  eventManager: EventManager<'success' | 'error' | 'complete', AlovaEvent<any, any, any, any, any, any, any, any, any>>,
  ro: ReferingObject,
  upd: Hook['upd']
) =>
  ({
    /** 最后一次请求的method实例 */
    m: undefinedValue as unknown as Method,

    /** saveStatesFns */
    sf: [],

    /** removeStatesFns */
    rf: [],

    /** frontStates */
    fs: {} as FrontRequestState,

    /** eventManager */
    em: eventManager,

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
