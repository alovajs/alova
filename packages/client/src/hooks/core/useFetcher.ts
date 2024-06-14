import { noop, omit } from '@alova/shared/function';
import { AlovaGenerics, Method } from 'alova';
import { EnumHookType, FetcherHookConfig, FetcherType, UseFetchHookExposure } from '~/typings';
import { assertMethod, fetcherHookAssert } from './implements/assert';
import createRequestState from './implements/createRequestState';

/**
 * 数据预拉取
 * @example
 * ```js
 * const { fetching, error, fetch } = useFetcher();
 * const handleFetch = () => {
 *   fetch(alova.Get('/api/profile'));
 * };
 * ```
 * @param config 配置项
 * @returns 响应式请求数据、操作函数及事件绑定函数
 */
export default function useFetcher<SE extends FetcherType<any>>(config: FetcherHookConfig = {}) {
  const props = createRequestState<AlovaGenerics<SE['state'], SE['export']>, FetcherHookConfig>(
    EnumHookType.USE_FETCHER,
    noop as any,
    config
  );
  const { send } = props;
  return {
    ...omit(props, 'send'),
    /**
     * Fetch data
     * fetch will definitely send a request, and if the currently requested data has a corresponding management state, this state will be updated.
     * @param matcher Method object
     */
    fetch: <Responded>(matcher: Method<AlovaGenerics<any, any, any, any, Responded>>, ...args: any[]) => {
      assertMethod(fetcherHookAssert, matcher);
      return send(args, matcher);
    }
  } as UseFetchHookExposure<SE['state']>;
}
