import { AlovaGlobalCacheAdapter, Method, StatesHook, createAlova } from 'alova';
import GlobalFetch from 'alova/fetch';

export const untilCbCalled = <T>(setCb: (cb: (arg: T, ...args: any[]) => any, ...others: any[]) => any, ...args: any[]) =>
  new Promise<T>(resolve => {
    setCb(
      d => {
        resolve(d);
      },
      ...args
    );
  });

export const generateContinuousNumbers = (
  end: number,
  start = 0,
  transform: ((i: number) => any) | Record<string | number, any> = i => i
) => {
  const transformFn = typeof transform === 'object' ? (i: number) => transform[i] || i : transform;
  return Array.from({ length: Math.abs(end - start + 1) }).map((_, i) => transformFn(start + i));
};

type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;
type FetchMethod = Method<any, any, any, any, any, any, FetchRequestInit, Response, Headers>;
export const getAlovaInstance = <State, Computed, Watched, Export>(
  statesHook: StatesHook<State, Computed, Watched, Export>,
  {
    baseURL = 'http://localhost:3000',
    l1Cache,
    l2Cache,
    beforeRequestExpect,
    responseExpect,
    resErrorExpect,
    resCompleteExpect
  }: {
    baseURL?: string;
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
    alovaInst.options.l1Cache = l1Cache;
  }
  if (l2Cache !== undefined) {
    alovaInst.options.l2Cache = l2Cache;
  }
  return alovaInst;
};
