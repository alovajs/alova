import { AlovaGenerics, AlovaGlobalCacheAdapter, GlobalCacheConfig, Method, StatesHook, createAlova } from 'alova';
import GlobalFetch from 'alova/fetch';

type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;
type FetchMethod = Method<AlovaGenerics<any, any, any, any, any, any, FetchRequestInit, Response, Headers>>;
export const getAlovaInstance = <State, Computed, Watched, Export>(
  statesHook: StatesHook<State, Computed, Watched, Export>,
  {
    baseURL = 'http://localhost:3000',
    cacheFor,
    l1Cache,
    l2Cache,
    beforeRequestExpect,
    responseExpect,
    resErrorExpect,
    resCompleteExpect
  }: {
    baseURL?: string;
    cacheFor?: GlobalCacheConfig;
    l1Cache?: AlovaGlobalCacheAdapter;
    l2Cache?: AlovaGlobalCacheAdapter;
    beforeRequestExpect?: (methodInstance: FetchMethod) => void;
    responseExpect?: (response: Response, method: FetchMethod) => void;
    resErrorExpect?: (err: Error, method: FetchMethod) => void;
    resCompleteExpect?: (method: FetchMethod) => void;
  } = {}
) => {
  const alovaInst = createAlova({
    baseURL,
    timeout: 3000,
    statesHook,
    requestAdapter: GlobalFetch(),
    cacheFor,
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
    cacheLogger: false
  });
  if (l1Cache !== undefined) {
    alovaInst.l1Cache = l1Cache;
  }
  if (l2Cache !== undefined) {
    alovaInst.l2Cache = l2Cache;
  }
  return alovaInst;
};

export default getAlovaInstance;
