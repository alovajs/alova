import { FrameworkState } from '@alova/shared/FrameworkState';
import { undefinedValue } from '@alova/shared/vars';
import type { AlovaGenerics, FrontRequestState, Progress, ReferingObject } from 'alova';
import { Method } from 'alova';
import { Hook, EnumHookType as TEnumHookType, UseHookConfig } from '~/typings/clienthook';

export default <AG extends AlovaGenerics>(
  ht: TEnumHookType,
  c: UseHookConfig<AG>,
  eventManager: Hook['em'],
  ro: ReferingObject
) =>
  ({
    /** 最后一次请求的method实例 */
    m: undefinedValue as unknown as Method,

    /** saveStatesFns */
    sf: [],

    /** removeStatesFns */
    rf: [],

    /** frontStates */
    fs: {} as FrontRequestState<
      FrameworkState<boolean, 'loading'>,
      FrameworkState<AG['Responded'], 'data'>,
      FrameworkState<Error | undefined, 'error'>,
      FrameworkState<Progress, 'downloading'>,
      FrameworkState<Progress, 'uploading'>
    >,

    /** eventManager */
    em: eventManager,

    /** hookType, useRequest=1, useWatcher=2, useFetcher=3 */
    ht,

    /** hook config */
    c,

    /** referingObject */
    ro
  }) as Hook;
