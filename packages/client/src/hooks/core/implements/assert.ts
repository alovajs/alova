import { EnumHookType } from '@/util/helper';
import { createAssert, instanceOf } from '@alova/shared';
import { AlovaGenerics, Method } from 'alova';

export const coreAssert = createAssert('');
export const requestHookAssert = createAssert('useRequest');
export const watcherHookAssert = createAssert('useWatcher');
export const fetcherHookAssert = createAssert('useFetcher');

export const coreHookAssert = (hookType: EnumHookType) =>
  ({
    [EnumHookType.USE_REQUEST]: requestHookAssert,
    [EnumHookType.USE_WATCHER]: watcherHookAssert,
    [EnumHookType.USE_FETCHER]: fetcherHookAssert
  })[hookType];

/**
 * 断言是否为method实例
 * @param methodInstance method实例
 */
export const assertMethod = <AG extends AlovaGenerics>(assert: typeof requestHookAssert, methodInstance?: Method<AG>) =>
  assert(instanceOf(methodInstance, Method), 'expected a method instance.');
