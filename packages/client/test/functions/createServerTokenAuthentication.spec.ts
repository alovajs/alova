/* eslint-disable @typescript-eslint/no-use-before-define */
import { createServerTokenAuthentication } from '@/functions/tokenAuthentication/createTokenAuthentication';
import type { Equal } from '@alova/shared/types';
import { Alova, createAlova, Method } from 'alova';
import { useRequest } from 'alova/client';
import adapterFetch from 'alova/fetch';
import VueHook, { type VueHookType } from 'alova/vue';
import { delay, generateContinuousNumbers, Result, untilCbCalled } from 'root/testUtils';
import type { Ref } from 'vue';
import { MockRequestAdapter, mockRequestAdapter } from '../mockData';

const baseURL = process.env.NODE_BASE_URL as string;
interface ListResponse {
  total: number;
  list: number[];
}
describe('createServerTokenAuthentication', () => {
  test('type check', async () => {
    const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<VueHookType>({});

    onResponseRefreshToken((response, method) => {
      type Response = typeof response;
      type Method = typeof method;

      expect<ReturnType<Response['json']> extends Promise<any> ? true : never>(true);
      expect<Response['status'] extends number ? true : never>(true);
      expect<Response['status'] extends number ? true : never>(true);
      expect<Method['context'] extends Alova<any> ? true : never>(true);
    });

    onAuthRequired(method => {
      type Method = typeof method;
      expect<Method['context'] extends Alova<any> ? true : never>(true);
    });
  });
  test('should emit custom request and response interceptors', async () => {
    const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<VueHookType, MockRequestAdapter>(
      {}
    );
    const beforeRequestFn = vi.fn();
    const responseFn = vi.fn();
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired(method => {
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
    const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<
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
    const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<VueHookType, MockRequestAdapter>(
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
      createServerTokenAuthentication<VueHookType, MockRequestAdapter>({
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
    const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<VueHookType, MockRequestAdapter>(
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
      createServerTokenAuthentication<VueHookType, MockRequestAdapter>({
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
    const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<VueHookType, MockRequestAdapter>(
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
    const { onSuccess, data } = useRequest(loginMethod);
    onSuccess(() => {
      orderAry.push('useHook.onSuccess');
    });

    await untilCbCalled(onSuccess);
    expect(orderAry).toStrictEqual(['login', 'global.onSuccess', 'useHook.onSuccess']);

    // 测试logout
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
    expect<Equal<typeof data, Ref<ListResponse>>>(true);
  });

  test('should refresh token first on error event when it is expired', async () => {
    let token = '';
    const expireFn = vi.fn();
    const refreshTokenFn = vi.fn();
    const beforeRequestFn = vi.fn();
    const responseFn = vi.fn();
    const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<VueHookType, MockRequestAdapter>(
      {
        refreshTokenOnError: {
          isExpired: (error, method) => {
            expect(method).toBeInstanceOf(Method);
            expireFn();
            return error.name === '401';
          },
          handler: async (error, method) => {
            expect(error.name).toBe('401');
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
      beforeRequest: onAuthRequired(beforeRequestFn),
      responded: onResponseRefreshToken(response => {
        responseFn();
        return response;
      })
    });
    const list = await alovaInst.Get<number[]>('/list-auth');
    expect(list).toStrictEqual(generateContinuousNumbers(5));
    expect(refreshTokenFn).toHaveBeenCalledTimes(1);
    expect(beforeRequestFn).toHaveBeenCalledTimes(3); // list-auth两次，refreshToken一次
    expect(responseFn).toHaveBeenCalledTimes(2); // refreshToken和list-auth各进入一次
    expect(expireFn).toHaveBeenCalledTimes(1); // 只有list-auth在报错时进入一次，refreshToken不进入
  });
  test('should refresh token first on success event when it is expired', async () => {
    let token = '';
    const expireFn = vi.fn();
    const refreshTokenFn = vi.fn();
    const beforeRequestFn = vi.fn();
    const responseFn = vi.fn();
    const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<VueHookType, MockRequestAdapter>(
      {
        refreshTokenOnSuccess: {
          isExpired: (response, method) => {
            expect(method).toBeInstanceOf(Method);
            expireFn();
            return response.status === 401;
          },
          handler: async (response, method) => {
            expect(response.status).toBe(401);
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
      beforeRequest: onAuthRequired(beforeRequestFn),
      responded: onResponseRefreshToken(response => {
        responseFn();
        return response;
      })
    });

    // 设置notError=1，当遇到错误时不抛出错误，而是以错误格式返回
    const list = await alovaInst.Get('/list-auth?notError=1', {
      transform: (data: number[]) => data.map(i => i + 5)
    });
    expect(list).toStrictEqual(generateContinuousNumbers(10, 5));
    expect(refreshTokenFn).toHaveBeenCalledTimes(1);
    expect(beforeRequestFn).toHaveBeenCalledTimes(3); // list-auth两次，refreshToken一次
    expect(responseFn).toHaveBeenCalledTimes(2); // refreshToken和list-auth各进入一次
    expect(expireFn).toHaveBeenCalledTimes(2); // list-auth进入两次，refreshToken不进入
  });
  test('the requests should wait until token refreshed when token is refreshing', async () => {
    let token = '';
    const expireFn = vi.fn();
    const refreshTokenFn = vi.fn();
    const beforeRequestFn = vi.fn();
    const method = (a: string) =>
      alovaInst.Get(`/list-auth?a=${a}`, {
        transform: (data: number[]) => data.map(i => i + 5)
      });
    const { onAuthRequired, onResponseRefreshToken, waitingList } = createServerTokenAuthentication<
      VueHookType,
      MockRequestAdapter
    >({
      refreshTokenOnError: {
        isExpired: error => {
          expireFn();
          return error.name === '401';
        },
        handler: async () => {
          const refreshMethod = alovaInst.Get<{ token: string }>('/refresh-token');
          refreshMethod.meta = {
            refreshToken: true
          };

          // 当tokenRefreshing为true时又发出了请求时，会等待token刷新再发出，因此可以正常请求到数据
          method('2').then(list => {
            expect(list).toStrictEqual(generateContinuousNumbers(10, 5));
          });
          token = (await refreshMethod).token;
          refreshTokenFn();
        },
        metaMatches: {
          refreshToken: true
        }
      },
      assignToken: method => {
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
    const list = await method('1');
    expect(list).toStrictEqual(generateContinuousNumbers(10, 5));
    expect(refreshTokenFn).toHaveBeenCalledTimes(1); // 多次请求，只会刷新一次token
    expect(beforeRequestFn).toHaveBeenCalledTimes(4); // 三次list-auth，1次refresh-token
    expect(expireFn).toHaveBeenCalledTimes(1); // list-auth在401时进入1次，另外两次进入了onSuccess，refreshToken不进入
    expect(waitingList).toHaveLength(0); // 等待列表中的请求已发出
  });
  test("shouldn't resend refresh request when multiple requests emit at the same time", async () => {
    let token = '';
    const refreshTokenFn = vi.fn();
    const beforeRequestFn = vi.fn();
    const { onAuthRequired, onResponseRefreshToken, waitingList } = createServerTokenAuthentication<
      VueHookType,
      MockRequestAdapter
    >({
      refreshTokenOnError: {
        isExpired: error => error.name === '401',
        handler: async () => {
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
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired(beforeRequestFn),
      responded: onResponseRefreshToken((response, method) => {
        if (method.meta?.authRole !== 'refreshToken') {
          expect(method.config.headers.Authorization).toBe('123');
        }
        return response;
      })
    });
    const method = (a: string) =>
      alovaInst.Get(`/list-auth?a=${a}`, {
        transform: (data: number[]) => data.map(i => i + 5)
      });

    const [list, list2] = await Promise.all([method('1'), method('2')]);
    expect(list).toStrictEqual(generateContinuousNumbers(10, 5));
    expect(list2).toStrictEqual(generateContinuousNumbers(10, 5));
    expect(refreshTokenFn).toHaveBeenCalledTimes(1); // 多次请求，只会刷新一次token
    expect(beforeRequestFn).toHaveBeenCalledTimes(5); // 分别是两次失败和两次重新请求后成功的list-auth，1次refresh-token
    expect(waitingList).toHaveLength(0); // 等待列表中的请求已发出
  });
  test("shouldn't continue run when throw error in refreshToken", async () => {
    let token = '';
    const refreshTokenFn = vi.fn();
    const redirectLoginFn = vi.fn();
    const { onAuthRequired, onResponseRefreshToken, waitingList } = createServerTokenAuthentication<
      VueHookType,
      MockRequestAdapter
    >({
      refreshTokenOnError: {
        isExpired: error => error.name === '401',
        handler: async () => {
          const refreshMethod = alovaInst.Get<{ token: string }>('/refresh-token?error=1');
          refreshMethod.meta = {
            authRole: 'refreshToken'
          };
          refreshTokenFn();
          try {
            token = (await refreshMethod).token;
            expect(waitingList).toHaveLength(1); // 等待列表中有一个请求
          } catch (error) {
            redirectLoginFn();
            throw error;
          }
        }
      },
      assignToken: method => {
        method.config.headers.Authorization = token;
      }
    });
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheFor: null,
      beforeRequest: onAuthRequired(),
      responded: onResponseRefreshToken((response, method) => {
        expect(method.config.headers.Authorization).toBeUndefined();
        return response;
      })
    });
    const method = alovaInst.Get<number[]>('/list-auth');
    await expect(method).rejects.toThrow();
    expect(refreshTokenFn).toHaveBeenCalledTimes(1);
    expect(redirectLoginFn).toHaveBeenCalledTimes(1);
    expect(waitingList).toHaveLength(0); // refreshToken.handler中抛出错误，也会清空等待列表
  });
  test('should emit bypass the token validation when set authRole to null', async () => {
    let token = '';
    const expireFn = vi.fn();
    const refreshTokenFn = vi.fn();
    const { onAuthRequired, onResponseRefreshToken } = createServerTokenAuthentication<VueHookType, MockRequestAdapter>(
      {
        refreshTokenOnError: {
          isExpired: error => {
            expireFn();
            return error.status === '401';
          },
          handler: async () => {
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
        expect(method.config.headers.Authorization).toBeUndefined(); // 绕过了token验证阶段，因此发送请求时不会带token
        return response;
      })
    });
    const method = alovaInst.Get<ListResponse>('/list');
    method.meta = {
      authRole: null
    };
    const { list } = await method;
    expect(list).toStrictEqual(generateContinuousNumbers(9));
    expect(refreshTokenFn).not.toHaveBeenCalled(); // authRole=null会直接放行
    expect(expireFn).not.toHaveBeenCalled();

    // 自定义忽略method规则;
    const { onAuthRequired: onAuthRequired2, onResponseRefreshToken: onResponseRefreshToken2 } =
      createServerTokenAuthentication<VueHookType, MockRequestAdapter>({
        visitorMeta: {
          loginRequired: false
        },
        refreshTokenOnError: {
          isExpired: error => {
            expireFn();
            return error.status === '401';
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
        expect(method.config.headers.Authorization).toBeUndefined(); // 绕过了token验证阶段，因此发送请求时不会带token
        return response;
      })
    });
    const method2 = alovaInst2.Get<ListResponse>('/list');
    method2.meta = {
      loginRequired: false
    };
    const { list: list2 } = await method2;
    expect(list2).toStrictEqual(generateContinuousNumbers(9));
    expect(refreshTokenFn).not.toHaveBeenCalled(); // authRole=null会直接放行
    expect(expireFn).not.toHaveBeenCalled();
  });
});
