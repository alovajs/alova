import { createAlova } from '@/index';
import GlobalFetch from '@/predefine/GlobalFetch';
import { GlobalLocalCacheConfig, Method, StatesHook } from '~/typings';
import { FetchRequestInit } from '~/typings/globalfetch';

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

type FetchMethod = Method<any, any, any, any, FetchRequestInit, Response, Headers>;
export const getAlovaInstance = <S, E>(
  statesHook: StatesHook<S, E>,
  {
    endWithSlash = false,
    localCache,
    beforeRequestExpect,
    responseExpect,
    resErrorExpect
  }: {
    endWithSlash?: boolean;
    localCache?: GlobalLocalCacheConfig;
    beforeRequestExpect?: (methodInstance: FetchMethod) => void;
    responseExpect?: (response: Response, method: FetchMethod) => void;
    resErrorExpect?: (err: Error, method: FetchMethod) => void;
  } = {}
) => {
  const alovaInst = createAlova({
    baseURL: 'http://localhost:3000' + (endWithSlash ? '/' : ''),
    timeout: 3000,
    statesHook: statesHook,
    requestAdapter: GlobalFetch(),
    beforeRequest(config) {
      beforeRequestExpect && beforeRequestExpect(config);
    },
    responded:
      responseExpect && !resErrorExpect
        ? responseExpect
        : resErrorExpect
        ? {
            onSuccess: responseExpect,
            onError: resErrorExpect
          }
        : undefined
  });
  if (localCache !== undefined) {
    alovaInst.options.localCache = localCache;
  }
  return alovaInst;
};
