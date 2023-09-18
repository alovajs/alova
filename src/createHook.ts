import { FrontRequestState, Hook, HookType, UseHookConfig } from '~/typings';
import { noop } from './utils/helper';
import { undefinedValue } from './utils/variables';

export default (ht: HookType, c: UseHookConfig) =>
  ({
    m: undefinedValue,
    ar: noop,
    sf: [],
    rf: [],
    fs: {} as FrontRequestState,
    sh: [],
    eh: [],
    ch: [],
    ht,
    c
  } as Hook);
