/* eslint-disable @typescript-eslint/no-use-before-define */
import { createClientTokenAuthentication } from '@/functions/tokenAuthentication/createTokenAuthentication';
import { useRequest } from '@/index';
import VueHook from '@/statesHook/vue';
import type { Equal } from '@alova/shared';
import { Alova, createAlova, Method } from 'alova';
import adapterFetch from 'alova/fetch';
import { delay } from 'msw';
import { generateContinuousNumbers, Result, untilCbCalled } from 'root/testUtils';
import type { Ref } from 'vue';
import { type VueHookType } from '~/typings/stateshook/vue';
import { MockRequestAdapter, mockRequestAdapter } from '../mockData';

const baseURL = process.env.NODE_BASE_URL as string;
interface ListResponse {
  total: number;
  list: number[];
}
describe('createClientTokenAuthentication', () => {
  test('type check', async () => {
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<VueHookType>({});

    onResponseRefreshToken((response, _method) => {
      type Response = typeof response;
      type Method = typeof _method;

      expect<ReturnType<Response['json']> extends Promise<any> ? true : never>(true);
      expect<Response['status'] extends number ? true : never>(true);
      expect<Response['status'] extends number ? true : never>(true);
      expect<Method['context'] extends Alova<any> ? true : never>(true);
    });

    onAuthRequired(_method => {
      type Method = typeof _method;
      expect<Method['context'] extends Alova<any> ? true : never>(true);
    });
  });

  test('should emit custom request and response interceptors', async () => {
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<VueHookType, MockRequestAdapter>(
      {}
    );
    const beforeRequestFn = vi.fn();
    const responseFn = vi.fn();
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired(async method => {
        expect(method).toBeInstanceOf(Method);
        beforeRequestFn();
      }),
      responded: onResponseRefreshToken((response, method) => {
        expect(method).toBeInstanceOf(Method);
        responseFn();
        return response;
      })
    });
    const { list } = await alovaInst.Get<ListResponse>('/list');
    expect(list).toStrictEqual(generateContinuousNumbers(9));
    expect(beforeRequestFn).toHaveBeenCalledTimes(1);
    expect(responseFn).toHaveBeenCalledTimes(1);

    const responseErrorFn = vi.fn();
    const completeFn = vi.fn();
    const alovaInst2 = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired(method => {
        expect(method).toBeInstanceOf(Method);
        beforeRequestFn();
      }),
      responded: onResponseRefreshToken({
        onSuccess: (response, method) => {
          expect(response.total).toBe(300);
          expect(method).toBeInstanceOf(Method);
          responseFn();
          return response;
        },
        onError: (error, method) => {
          expect(error.message).toBe('server error');
          expect(method).toBeInstanceOf(Method);
          responseErrorFn();
          return error;
        },
        onComplete: method => {
          expect(method).toBeInstanceOf(Method);
          completeFn();
        }
      })
    });
    const { list: list2 } = await alovaInst2.Get<ListResponse>('/list');
    expect(list2).toStrictEqual(generateContinuousNumbers(9));
    expect(beforeRequestFn).toHaveBeenCalledTimes(2);
    expect(responseFn).toHaveBeenCalledTimes(2);
    expect(responseErrorFn).toHaveBeenCalledTimes(0);
    expect(completeFn).toHaveBeenCalledTimes(1);

    await alovaInst2.Get('list-error');
    expect(beforeRequestFn).toHaveBeenCalledTimes(3);
    expect(responseFn).toHaveBeenCalledTimes(2);
    expect(responseErrorFn).toHaveBeenCalledTimes(1);
    expect(completeFn).toHaveBeenCalledTimes(2);
  });

  test('the callback should support async function', async () => {
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<
      VueHookType,
      typeof adapterFetch
    >({});
    const alovaInst = createAlova({
      baseURL,
      statesHook: VueHook,
      requestAdapter: adapterFetch(),
      cacheFor: null,
      beforeRequest: onAuthRequired(async method => {
        await delay(10);
        method.config.params = {
          a: 7,
          b: 8
        };
      }),
      responded: onResponseRefreshToken({
        onSuccess: response => response.json(),
        onError: async error => {
          await delay(10);
          return error.message;
        }
      })
    });

    expect(await alovaInst.Get<Result>('/unit-test')).toStrictEqual({
      code: 200,
      msg: '',
      data: {
        method: 'GET',
        params: {
          a: '7',
          b: '8'
        },
        path: '/unit-test'
      }
    });
    expect(await alovaInst.Get<Result>('/unit-test-error')).toStrictEqual('Failed to fetch');
  });

  test('should emit login interceptor when set authRole to `login`', async () => {
    const loginInterceptorFn = vi.fn();
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<VueHookType, MockRequestAdapter>(
      {
        login(response, method) {
          expect(response.total).toBe(300);
          expect(method).toBeInstanceOf(Method);
          loginInterceptorFn();
        }
      }
    );
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired(),
      responded: onResponseRefreshToken()
    });
    const loginMethod = alovaInst.Get<ListResponse>('/list');
    loginMethod.meta = {
      authRole: 'login'
    };
    const res = await loginMethod;
    expect(res.list).toStrictEqual(generateContinuousNumbers(9));
    expect(loginInterceptorFn).toHaveBeenCalledTimes(1);

    const { onAuthRequired: onAuthRequired2, onResponseRefreshToken: onResponseRefreshToken2 } =
      createClientTokenAuthentication<VueHookType, MockRequestAdapter>({
        login: {
          metaMatches: {
            login: true
          },
          handler(response, method) {
            expect(response.total).toBe(300);
            expect(method).toBeInstanceOf(Method);
            loginInterceptorFn();
          }
        }
      });
    const alovaInst2 = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired2(),
      responded: onResponseRefreshToken2()
    });
    const loginMethod2 = alovaInst2.Get<ListResponse>('/list');
    loginMethod2.meta = {
      login: true
    };
    const res2 = await loginMethod2;
    expect(res2.list).toStrictEqual(generateContinuousNumbers(9));
    expect(loginInterceptorFn).toHaveBeenCalledTimes(2);
  });
  test('should emit logout interceptor when set authRole to `logout`', async () => {
    const logoutInterceptorFn = vi.fn();
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<VueHookType, MockRequestAdapter>(
      {
        logout(response, method) {
          expect(response.total).toBe(300);
          expect(method).toBeInstanceOf(Method);
          logoutInterceptorFn();
        }
      }
    );
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired(),
      responded: onResponseRefreshToken()
    });
    const logoutMethod = alovaInst.Get<ListResponse>('/list');
    logoutMethod.meta = {
      authRole: 'logout'
    };
    const res = await logoutMethod;
    expect(res.list).toStrictEqual(generateContinuousNumbers(9));
    expect(logoutInterceptorFn).toHaveBeenCalledTimes(1);

    const { onAuthRequired: onAuthRequired2, onResponseRefreshToken: onResponseRefreshToken2 } =
      createClientTokenAuthentication<VueHookType, MockRequestAdapter>({
        logout: {
          metaMatches: {
            logout: true
          },
          handler(response, method) {
            expect(response.total).toBe(300);
            expect(method).toBeInstanceOf(Method);
            logoutInterceptorFn();
          }
        }
      });
    const alovaInst2 = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired2(),
      responded: onResponseRefreshToken2()
    });
    const logoutMethod2 = alovaInst2.Get<ListResponse>('/list');
    logoutMethod2.meta = {
      logout: true
    };
    const res2 = await logoutMethod2;
    expect(res2.list).toStrictEqual(generateContinuousNumbers(9));
    expect(logoutInterceptorFn).toHaveBeenCalledTimes(2);
  });

  test('The async functions runing order should be `login -> logout -> global.onSuccess -> useHook.onSuccess`', async () => {
    let orderAry = [] as string[];
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<VueHookType, MockRequestAdapter>(
      {
        async login() {
          await untilCbCalled(setTimeout, 100);
          orderAry.push('login');
        },
        async logout() {
          await untilCbCalled(setTimeout, 100);
          orderAry.push('logout');
        }
      }
    );
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired(),
      responded: onResponseRefreshToken(response => {
        orderAry.push('global.onSuccess');
        return response;
      })
    });
    const loginMethod = alovaInst.Get<ListResponse>('/list');
    loginMethod.meta = {
      authRole: 'login'
    };
    const { onSuccess, data: dataUnused } = useRequest(loginMethod);
    onSuccess(() => {
      orderAry.push('useHook.onSuccess');
    });

    await untilCbCalled(onSuccess);
    expect(orderAry).toStrictEqual(['login', 'global.onSuccess', 'useHook.onSuccess']);

    // test logout
    orderAry = [];
    const logoutMethod = alovaInst.Get<ListResponse>('/list');
    logoutMethod.meta = {
      authRole: 'logout'
    };
    const { onSuccess: onLogoutSuccess } = useRequest(logoutMethod);
    onLogoutSuccess(() => {
      orderAry.push('useHook.onSuccess');
    });

    await untilCbCalled(onLogoutSuccess);
    expect(orderAry).toStrictEqual(['logout', 'global.onSuccess', 'useHook.onSuccess']);
    expect<Equal<typeof dataUnused, Ref<ListResponse>>>(true);
  });

  test('should refresh token first when it is expired', async () => {
    let token = '';
    const refreshTokenFn = vi.fn();
    const beforeRequestFn = vi.fn();
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<VueHookType, MockRequestAdapter>(
      {
        refreshToken: {
          isExpired: () => !token,
          handler: async method => {
            expect(method).toBeInstanceOf(Method);
            const refreshMethod = alovaInst.Get<{ token: string }>('/refresh-token');
            refreshMethod.meta = {
              authRole: 'refreshToken'
            };
            token = (await refreshMethod).token;
            refreshTokenFn();
          }
        },
        assignToken: method => {
          expect(method).toBeInstanceOf(Method);
          method.config.headers.Authorization = token;
        }
      }
    );
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired(beforeRequestFn),
      responded: onResponseRefreshToken()
    });
    const list = await alovaInst.Get<number[]>('/list-auth');
    expect(list).toStrictEqual(generateContinuousNumbers(5));
    expect(refreshTokenFn).toHaveBeenCalledTimes(1);
    expect(beforeRequestFn).toHaveBeenCalledTimes(2);
  });
  test('the requests should wait until token refreshed when token is refreshing', async () => {
    let token = '';

    const refreshTokenFn = vi.fn();
    const beforeRequestFn = vi.fn();
    const { onAuthRequired, onResponseRefreshToken, waitingList } = createClientTokenAuthentication<
      VueHookType,
      MockRequestAdapter
    >({
      refreshToken: {
        isExpired: () => !token,
        handler: async method => {
          expect(method).toBeInstanceOf(Method);
          const refreshMethod = alovaInst.Get<{ token: string }>('/refresh-token');
          refreshMethod.meta = {
            refreshToken: true
          };
          token = (await refreshMethod).token;
          expect(waitingList).toHaveLength(1); // There is a request in the waiting list
          refreshTokenFn();
        },
        metaMatches: {
          refreshToken: true
        }
      },
      assignToken: method => {
        expect(method).toBeInstanceOf(Method);
        method.config.headers.Authorization = token;
      }
    });

    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired(beforeRequestFn),
      responded: onResponseRefreshToken((response, method) => {
        if (!method.meta?.refreshToken) {
          expect(method.config.headers.Authorization).toBe('123');
        }
        return response;
      })
    });
    const method = alovaInst.Get('/list-auth', {
      transform: (data: number[]) => data.map(i => i + 5)
    });
    const [list, list2] = await Promise.all([method, method]);
    expect(list).toStrictEqual(generateContinuousNumbers(10, 5));
    expect(list2).toStrictEqual(generateContinuousNumbers(10, 5));
    expect(refreshTokenFn).toHaveBeenCalledTimes(1); // Multiple requests will only refresh the token once.
    expect(beforeRequestFn).toHaveBeenCalledTimes(3); // List auth twice, refresh token once
    expect(waitingList).toHaveLength(0); // The request in the waiting list has been issued
  });
  test("shouldn't continue run when throw error in refreshToken", async () => {
    let token = '';
    const refreshTokenFn = vi.fn();
    const redirectLoginFn = vi.fn();
    const { onAuthRequired, onResponseRefreshToken, waitingList } = createClientTokenAuthentication<
      VueHookType,
      MockRequestAdapter
    >({
      refreshToken: {
        isExpired: () => !token,
        handler: async method => {
          expect(method).toBeInstanceOf(Method);
          const refreshMethod = alovaInst.Get<{ token: string }>('/refresh-token?error=1');
          refreshMethod.meta = {
            authRole: 'refreshToken'
          };
          refreshTokenFn();
          try {
            token = (await refreshMethod).token;
            expect(waitingList).toHaveLength(1); // There is a request in the waiting list
          } catch (error) {
            redirectLoginFn();
            throw error;
          }
        }
      },
      assignToken: method => {
        expect(method).toBeInstanceOf(Method);
        method.config.headers.Authorization = token;
      }
    });
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired(),
      responded: onResponseRefreshToken((response, method) => {
        expect(method.config.headers.Authorization).toBe('');
        return response;
      })
    });
    const method = alovaInst.Get<number[]>('/list-auth');
    await expect(method).rejects.toThrow();
    expect(refreshTokenFn).toHaveBeenCalledTimes(1);
    expect(redirectLoginFn).toHaveBeenCalledTimes(1);
    expect(waitingList).toHaveLength(0); // An error is thrown in Refresh token.handler and the waiting list will also be cleared.
  });
  test('should emit bypass the token validation when set authRole to null', async () => {
    let token = '';
    const expireFn = vi.fn();
    const refreshTokenFn = vi.fn();
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<VueHookType, MockRequestAdapter>(
      {
        refreshToken: {
          isExpired: () => {
            expireFn();
            return !token;
          },
          handler: async method => {
            expect(method).toBeInstanceOf(Method);
            const refreshMethod = alovaInst.Get<{ token: string }>('/refresh-token');
            refreshMethod.meta = {
              authRole: 'refreshToken'
            };
            token = (await refreshMethod).token;
            refreshTokenFn();
          }
        },
        assignToken: method => {
          method.config.headers.Authorization = token;
        }
      }
    );
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired(),
      responded: onResponseRefreshToken((response, method) => {
        expect(method.config.headers.Authorization).toBeUndefined(); // The token verification phase is bypassed, so the token will not be included when sending the request.
        return response;
      })
    });
    const method = alovaInst.Get<ListResponse>('/list');
    method.meta = {
      authRole: null
    };
    const { list } = await method;
    expect(list).toStrictEqual(generateContinuousNumbers(9));
    expect(refreshTokenFn).not.toHaveBeenCalled(); // Auth role=null will be released directly.
    expect(expireFn).not.toHaveBeenCalled();

    // Customize ignore method rules
    const { onAuthRequired: onAuthRequired2, onResponseRefreshToken: onResponseRefreshToken2 } =
      createClientTokenAuthentication<VueHookType, MockRequestAdapter>({
        visitorMeta: {
          loginRequired: false
        },
        refreshToken: {
          isExpired: () => {
            expireFn();
            return !token;
          },
          handler: async method => {
            expect(method).toBeInstanceOf(Method);
            const refreshMethod = alovaInst.Get<{ token: string }>('/refresh-token');
            refreshMethod.meta = {
              authRole: 'refreshToken'
            };
            token = (await refreshMethod).token;
            refreshTokenFn();
          }
        },
        assignToken: method => {
          method.config.headers.Authorization = token;
        }
      });
    const alovaInst2 = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired2(),
      responded: onResponseRefreshToken2((response, method) => {
        expect(method.config.headers.Authorization).toBeUndefined(); // The token verification phase is bypassed, so the token will not be included when sending the request.
        return response;
      })
    });
    const method2 = alovaInst2.Get<ListResponse>('/list');
    method2.meta = {
      loginRequired: false
    };
    const { list: list2 } = await method2;
    expect(list2).toStrictEqual(generateContinuousNumbers(9));
    expect(refreshTokenFn).not.toHaveBeenCalled(); // Auth role=null will be released directly.
    expect(expireFn).not.toHaveBeenCalled();
  });
});
