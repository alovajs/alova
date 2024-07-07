import { createAlova } from '@/index';
import GlobalFetch from '@/predefine/adapterFetch';
import { AlovaGenerics, AlovaGlobalCacheAdapter, GlobalCacheConfig, Method } from '~/typings';

type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;
type FetchMethod = Method<AlovaGenerics<any, any, FetchRequestInit, Response, Headers>>;
export const getAlovaInstance = ({
  id,
  endWithSlash = false,
  cacheFor,
  beforeRequestExpect,
  responseExpect,
  resErrorExpect,
  resCompleteExpect,
  limitSnapshots,
  l1Cache,
  l2Cache
}: {
  id?: number | string;
  endWithSlash?: boolean;
  cacheFor?: GlobalCacheConfig<any>;
  beforeRequestExpect?: (methodInstance: FetchMethod) => void;
  responseExpect?: (response: Response, method: FetchMethod) => void;
  resErrorExpect?: (err: Error, method: FetchMethod) => void;
  resCompleteExpect?: (method: FetchMethod) => void;
  limitSnapshots?: number;
  l1Cache?: AlovaGlobalCacheAdapter;
  l2Cache?: AlovaGlobalCacheAdapter;
} = {}) => {
  const alovaInst = createAlova({
    id,
    baseURL: process.env.NODE_BASE_URL + (endWithSlash ? '/' : ''),
    timeout: 3000,
    requestAdapter: GlobalFetch(),
    snapshots: limitSnapshots,
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
    cacheLogger: false,
    l1Cache,
    l2Cache
  });
  if (cacheFor !== undefined) {
    alovaInst.options.cacheFor = cacheFor;
  }
  return alovaInst;
};

export const tt = {};
