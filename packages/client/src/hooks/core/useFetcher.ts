import { noop, omit } from '@alova/shared/function';
import { AlovaGenerics, Method } from 'alova';
import { EnumHookType, FetcherHookConfig, FetcherType, type UseFetchHookReturnType } from '~/typings';
import { assertMethod, fetcherHookAssert } from './implements/assert';
import createRequestState from './implements/createRequestState';

/**
 * Fetch request data and cache
 * @param method request method object
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
  } as UseFetchHookReturnType<SE['state']>;
}
