import { createAlova } from '@/index';
import GlobalFetch from '@/predefine/GlobalFetch';
import { GlobalLocalCacheConfig, Method, StatesHook } from '~/typings';
import { baseURL } from '../../shared/src/mockServer';

type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;
type GetData = {
  path: string;
  method: string;
  params: Record<string, string>;
};
type PostData = {
  path: string;
  method: string;
  params: Record<string, string>;
  data: Record<string, string>;
};
export type Result<T = string> = {
  code: number;
  msg: string;
  data: T extends string ? GetData : PostData;
};

export const untilCbCalled = <T>(setCb: (cb: (arg: T) => void, ...others: any[]) => void, ...args: any[]) =>
  new Promise<T>(resolve => {
    setCb(d => {
      resolve(d);
    }, ...args);
  });

export const delay = (ts = 0) => new Promise<void>(resolve => setTimeout(resolve, ts));

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
    baseURL: baseURL + (endWithSlash ? '/' : ''),
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
