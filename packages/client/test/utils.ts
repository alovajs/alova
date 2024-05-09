import { act } from '@testing-library/react';
import { GlobalLocalCacheConfig, Method, StatesHook, createAlova } from 'alova';
import GlobalFetch, { FetchRequestInit } from 'alova/GlobalFetch';

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

export async function waitForWithFakeTimers(cb: () => void) {
  let waiting = true;
  while (waiting) {
    await act(() =>
      Promise.resolve()
        .then(() => jest.runAllTimers())
        .then(() => new Promise(resolve => setTimeout(resolve, 0)))
    );
    try {
      cb();
      waiting = false;
    } catch {}
  }
}

type FetchMethod = Method<any, any, any, any, FetchRequestInit, Response, Headers>;
export const getAlovaInstance = <S, E>(
  statesHook: StatesHook<S, E>,
  {
    baseURL,
    localCache,
    beforeRequestExpect,
    responseExpect,
    resErrorExpect,
    resCompleteExpect
  }: {
    baseURL?: string;
    localCache?: GlobalLocalCacheConfig;
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
    errorLogger: false,
    cacheLogger: false
  });
  if (localCache !== undefined) {
    alovaInst.options.localCache = localCache;
  }
  return alovaInst;
};
