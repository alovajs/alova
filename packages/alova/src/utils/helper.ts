import { boundStatesHook } from '@/alova';
import { FrontRequestState } from '~/typings';
import myAssert from './myAssert';

/**
 * 导出fetchStates map
 * @param frontStates front states map
 * @returns fetchStates map
 */
export const exportFetchStates = <L = any, R = any, E = any, D = any, U = any>(frontStates: FrontRequestState<L, R, E, D, U>) => ({
  fetching: frontStates.loading,
  error: frontStates.error,
  downloading: frontStates.downloading,
  uploading: frontStates.uploading
});
export const promiseStatesHook = () => {
  myAssert(!!boundStatesHook, `\`statesHook\` is not set in alova instance`);
  return boundStatesHook as NonNullable<typeof boundStatesHook>;
};
