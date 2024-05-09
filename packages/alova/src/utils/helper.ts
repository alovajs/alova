import { boundStatesHook } from '@/alova';
import { getContextOptions } from '@alova/shared/function';
import { Alova, FrontRequestState } from '~/typings';
import myAssert from './myAssert';

/**
 * 获取alova实例的statesHook
 * @returns statesHook对象
 */
export const getStatesHook = <States, Computed, Watched, Export, RequestConfig, Response, ResponseHeader>(
  alovaInstance: Alova<States, Computed, Watched, Export, RequestConfig, Response, ResponseHeader>
) => getContextOptions(alovaInstance).statesHook;

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
