import { createAlova } from '@/index';
import GlobalFetch from '@/predefine/adapterFetch';
import { AlovaGenerics, GlobalCacheConfig, Method } from '~/typings';

type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;
type FetchMethod = Method<AlovaGenerics<any, any, any, any, any, any, FetchRequestInit, Response, Headers>>;
export const getAlovaInstance = ({
  endWithSlash = false,
  cacheFor,
  beforeRequestExpect,
  responseExpect,
  resErrorExpect,
  resCompleteExpect,
  limitSnapshots
}: {
  endWithSlash?: boolean;
  cacheFor?: GlobalCacheConfig;
  beforeRequestExpect?: (methodInstance: FetchMethod) => void;
  responseExpect?: (response: Response, method: FetchMethod) => void;
  resErrorExpect?: (err: Error, method: FetchMethod) => void;
  resCompleteExpect?: (method: FetchMethod) => void;
  limitSnapshots?: number;
} = {}) => {
  const alovaInst = createAlova({
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
    cacheLogger: false
  });
  if (cacheFor !== undefined) {
    alovaInst.options.cacheFor = cacheFor;
  }
  return alovaInst;
};

/**
 * resolve returned promise when param promise is rejected
 */
export const untilReject = (promise: Promise<any> | Method) =>
  new Promise<Error>(resolve => {
    promise.catch(resolve);
  });
