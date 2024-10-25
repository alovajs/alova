import { EnumHookType } from '@/util/helper';
import { noop, objAssign } from '@alova/shared/function';
import { deleteAttr } from '@alova/shared/vars';
import { AlovaGenerics, Method } from 'alova';
import type { FetcherHookConfig, FetcherType } from '~/typings/clienthook';
import { assertMethod, fetcherHookAssert } from './implements/assert';
import createRequestState from './implements/createRequestState';

/**
 * Fetch request data and cache
 * @param method request method object
 */
export default function useFetcher<F extends FetcherType<any>>(config: FetcherHookConfig = {}) {
  const props = createRequestState<
    Omit<AlovaGenerics, 'StatesExport'> & {
      StatesExport: F['StatesExport'];
    },
    any[],
    FetcherHookConfig
  >(EnumHookType.USE_FETCHER, noop as any, config);
  const { send } = props;
  deleteAttr(props, 'send');
  return objAssign(props, {
    /**
     * Fetch data
     * fetch will definitely send a request, and if the currently requested data has a corresponding management state, this state will be updated.
     * @param matcher Method object
     */
    fetch: <Responded>(matcher: Method<AlovaGenerics<any, any, any, any, Responded>>, ...args: any[]) => {
      assertMethod(fetcherHookAssert, matcher);
      return send(args, matcher);
    }
  });
}
