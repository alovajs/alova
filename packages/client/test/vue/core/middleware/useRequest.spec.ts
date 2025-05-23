import { getAlovaInstance } from '#/utils';
import { useRequest } from '@/index';
import VueHook from '@/statesHook/vue';
import { delay, Result, untilCbCalled } from 'root/testUtils';

describe('useRequest middleware', () => {
  test('middleware function can set with a common function', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transform: ({ data }: Result<true>) => data
    });

    const { loading, onSuccess } = useRequest(getGetterObj, {
      middleware: (context: any, next: any) => {
        expect(context.method).toBe(getGetterObj);
        next();
      }
    });
    const { data: rawData } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(!!rawData).toBeTruthy();
  });

  test('the behavior would be the same as the behavior not set middleware', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transform: ({ data }: Result<true>) => data
    });
    const { loading, onSuccess } = useRequest(getGetterObj, {
      middleware: (_, next) => next()
    });

    expect(loading.value).toBeTruthy();
    await delay();
    expect(loading.value).toBeTruthy(); // Start request
    const { data: rawData } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(!!rawData).toBeTruthy();
  });

  test('should get an error when throw error in middleware function', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transform: ({ data }: Result<true>) => data
    });

    const errorObj = new Error('middleware error');
    const { loading, error, onError, data, send } = useRequest(getGetterObj, {
      middleware: async (_, next) => {
        await next();
        throw errorObj;
      }
    });

    const mockFn = vi.fn();
    onError(mockFn);
    expect(loading.value).toBeTruthy();
    expect(error.value).toBeUndefined();
    await delay();
    expect(loading.value).toBeTruthy(); // Start request
    const { error: errRaw } = await untilCbCalled(onError);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBe(errorObj);
    expect(error.value).toBe(errRaw);
    const mockFn2 = vi.fn();
    try {
      await send();
    } catch {
      mockFn2();
    }
    expect(mockFn2).toHaveBeenCalledTimes(1);
  });

  test('should send request until async middleware function is called', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transform: ({ data }: Result<true>) => data
    });
    const { loading, onSuccess } = useRequest(getGetterObj, {
      middleware: async (context, next) => {
        expect(context.method).toBe(getGetterObj);
        await delay(500);
        const resp = await next();
        expect(resp).toEqual({
          path: '/unit-test',
          method: 'GET',
          params: {}
        });
      }
    });
    expect(loading.value).toBeTruthy();
    const startTs = Date.now();
    const rawData = await untilCbCalled(onSuccess);
    const endTs = Date.now();
    expect(!!rawData).toBeTruthy();
    expect(endTs - startTs).toBeGreaterThan(500);
  });

  test("shouldn't send request when not call next in middleware function", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transform: ({ data }: Result<true>) => data
    });
    const { loading, data, onSuccess, send } = useRequest(getGetterObj, {
      middleware: async () => {}
    });

    const mockFn = vi.fn();
    onSuccess(mockFn);

    // next is not called in Middleware, so the request will not be sent
    expect(loading.value).toBeTruthy();
    await delay(1000);
    expect(mockFn).toHaveBeenCalledTimes(0);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();

    const rawData = await send();
    expect(rawData).toBeUndefined();
  });

  test('we can change method instance in middleware function', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transform: ({ data }: Result<true>) => data
    });
    const { loading, data, onSuccess, send } = useRequest(getGetterObj, {
      middleware: async (_, next) => {
        const resp = await next({
          force: true,
          method: alova.Get('/unit-test', {
            transform: ({ data: responseData }: Result<true>) => responseData,
            params: {
              a: 'a',
              b: 'b'
            }
          })
        });
        expect(resp).toEqual({
          path: '/unit-test',
          method: 'GET',
          params: {
            a: 'a',
            b: 'b'
          }
        });
      }
    });
    const mockFn = vi.fn();
    onSuccess(mockFn);
    expect(loading.value).toBeTruthy();
    await delay();
    expect(loading.value).toBeTruthy(); // Start request
    await untilCbCalled(onSuccess);
    expect(data.value.params.a).toBe('a');
    expect(data.value.params.b).toBe('b');

    const rawData = await send();
    expect(rawData.params.a).toBe('a');
    expect(rawData.params.b).toBe('b');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  test('can catch error in middleware function when request error', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test-404', {
      transform: ({ data }: Result<true>) => data
    });
    const { loading, error, onSuccess, data, send } = useRequest(getGetterObj, {
      middleware: async (_, next) => {
        await delay(400);
        try {
          await next();
        } catch {}
      }
    });

    // After the error is caught in the middleware, the error is no longer received externally
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(error.value).toBeUndefined();
    expect(data.value).toBeUndefined();
    const mockFn = vi.fn();
    try {
      await send();
    } catch {
      mockFn();
    }
    expect(mockFn).toHaveBeenCalledTimes(0);
  });

  test('should change response data when return custom data in middleware', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transform: ({ data }: Result<true>) => data
    });
    const middlewareResp = {};
    const { loading, error, onSuccess, data } = useRequest(getGetterObj, {
      middleware: async () => middlewareResp
    });

    // Only continue to obtain the real response data when no data is returned or undefined is returned in the middleware, otherwise the return data is used and no longer waits for the response promise
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(error.value).toBeUndefined();
    expect(data.value).toEqual(middlewareResp);
  });

  test('the behavior should be the same as normal when return another promise instance', async () => {
    const alova = getAlovaInstance(VueHook);
    const getGetterObj = alova.Get('/unit-test', {
      transform: ({ data }: Result<true>) => data
    });

    // Successful Examples
    const { loading, onSuccess, data } = useRequest(getGetterObj, {
      middleware: () =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({ anotherData: '123' });
          }, 20);
        })
    });
    expect(loading.value).toBeTruthy();
    const { data: dataRaw } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toStrictEqual({ anotherData: '123' });
    expect(dataRaw).toStrictEqual({ anotherData: '123' });

    // Failure example
    const {
      loading: loadingFail,
      onError,
      data: failData,
      error
    } = useRequest(getGetterObj, {
      middleware: ({ proxyStates }) => {
        proxyStates.loading.v = true;
        expect(loadingFail.value).toBeTruthy();
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('middleware custom error'));
          }, 20);
        });
      }
    });
    expect(loadingFail.value).toBeTruthy();
    await delay();
    expect(loadingFail.value).toBeTruthy(); // Start request
    const { error: errorRaw } = await untilCbCalled(onError);
    expect(loadingFail.value).toBeFalsy();
    expect(failData.value).toBeUndefined();
    expect(errorRaw.message).toBe('middleware custom error');
    expect(error.value?.message).toBe('middleware custom error');
  });

  test("shouldn't change loading state after response when prevent loaded", async () => {
    const alova = getAlovaInstance(VueHook);
    const getGetterObj = alova.Get('/unit-test', {
      transform: ({ data }: Result<true>) => data
    });

    // After calling control loading, the loading state will be customized.
    const { loading: loading1, onSuccess: onSuccess1 } = useRequest(getGetterObj, {
      middleware: ({ controlLoading }, next) => {
        controlLoading();
        return next();
      }
    });
    await delay();
    expect(loading1.value).toBeFalsy(); // Loading asynchronously controlled
    await untilCbCalled(onSuccess1);
    expect(loading1.value).toBeFalsy();

    const { loading: loading2, onSuccess: onSuccess2 } = useRequest(getGetterObj, {
      middleware: ({ proxyStates, controlLoading }, next) => {
        controlLoading();
        proxyStates.loading.v = true;
        expect(loading2.value).toBeTruthy();
        return next();
      }
    });
    await delay();
    expect(loading2.value).toBeTruthy(); // Loading is controlled in middleware and modified to true
    await untilCbCalled(onSuccess2);
    expect(loading2.value).toBeTruthy();
  });

  test('should send request like send function in returns when call send in middleware', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json(),
      // Set not to cache, and the loading status can only be observed when repeated requests are made.
      cacheFor: null
    });
    const getGetter = (d?: { a: string; b: string }) =>
      alova.Get('/unit-test', {
        timeout: 10000,
        transform: ({ data }: Result) => data,
        params: {
          a: d?.a,
          b: d?.b
        }
      });

    // After calling control loading, the loading state will be customized.
    let sendInMiddleware: any;
    const { loading, data, onSuccess } = useRequest(getGetter, {
      middleware: ({ send }, next) => {
        sendInMiddleware = send;
        return next();
      }
    });
    await delay();
    expect(sendInMiddleware).toBeInstanceOf(Function);
    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} });

    // Use send in middleware to send requests, the effect should be the same as send
    const resPromise = sendInMiddleware({ a: 'a', b: 'b' });
    await untilCbCalled(setTimeout, 10);
    expect(loading.value).toBeTruthy();
    const res = await resPromise;
    expect(res).toStrictEqual({ path: '/unit-test', method: 'GET', params: { a: 'a', b: 'b' } });
    expect(data.value).toStrictEqual({ path: '/unit-test', method: 'GET', params: { a: 'a', b: 'b' } });
  });

  test('should abort request like abort function in returns when call abort in middleware', async () => {
    const alova = getAlovaInstance(VueHook, {
      resErrorExpect: error => Promise.reject(error)
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-1s');
    const { loading, data, error, onError } = useRequest(Get, {
      middleware({ abort }, next) {
        setTimeout(() => {
          abort();
        }, 100);
        return next();
      }
    });
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    await delay();
    expect(loading.value).toBeTruthy();

    const err = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeInstanceOf(DOMException);
    expect(error.value).toStrictEqual(err.error);
    expect(error.value?.message).toBe('The operation was aborted.');
  });

  test('should abort request like abort function in returns when call abort in middleware(non-immediate)', async () => {
    const alova = getAlovaInstance(VueHook, {
      resErrorExpect: error => Promise.reject(error)
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-1s');
    const { loading, data, error, onError } = useRequest(Get, {
      immediate: false,
      middleware({ abort }, next) {
        setTimeout(() => {
          // fix #314
          expect(abort).not.toThrow();
        }, 100);
        return next();
      }
    });

    const errFn = vi.fn();
    onError(errFn);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    await delay(200);
    expect(errFn).not.toHaveBeenCalled();

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
  });
});
