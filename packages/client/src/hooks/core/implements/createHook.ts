import { falseValue, undefinedValue } from '@alova/shared/vars';
import type { AlovaGenerics, FrontRequestState, ReferingObject } from 'alova';
import { Method } from 'alova';
import { Hook, EnumHookType as TEnumHookType, UseHookConfig } from '~/typings';

export default <AG extends AlovaGenerics>(
  ht: TEnumHookType,
  c: UseHookConfig<AG>,
  eventManager: Hook['em'],
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
