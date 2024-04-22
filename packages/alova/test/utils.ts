import { createAlova } from '@/index';
import GlobalFetch from '@/predefine/GlobalFetch';
import { GlobalLocalCacheConfig, Method, StatesHook } from '~/typings';

type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;
type FetchMethod = Method<any, any, any, any, FetchRequestInit, Response, Headers>;
export const getAlovaInstance = <S, E>(
  statesHook: StatesHook<S, E>,
  {
    endWithSlash = false,
    localCache,
    beforeRequestExpect,
    responseExpect,
    resErrorExpect,
    resCompleteExpect
  }: {
    endWithSlash?: boolean;
    localCache?: GlobalLocalCacheConfig;
    beforeRequestExpect?: (methodInstance: FetchMethod) => void;
    responseExpect?: (response: Response, method: FetchMethod) => void;
    resErrorExpect?: (err: Error, method: FetchMethod) => void;
    resCompleteExpect?: (method: FetchMethod) => void;
  } = {}
) => {
  const alovaInst = createAlova({
    baseURL: process.env.NODE_BASE_URL + (endWithSlash ? '/' : ''),
    timeout: 3000,
    statesHook: statesHook,
    requestAdapter: GlobalFetch(),
    beforeRequest(config) {
      beforeRequestExpect && beforeRequestExpect(config);
    },
    responded:
      responseExpect && !resErrorExpect && !resCompleteExpect
        ? responseExpect
        : {
            onSuccess: responseExpect,
            onError: resErrorExpect,
            onComplete: resCompleteExpect
          },
    errorLogger: false,
    cacheLogger: false
  });
  if (localCache !== undefined) {
    alovaInst.options.localCache = localCache;
  }
  return alovaInst;
};
