import { createAlova, Method, useRequest } from 'alova';
import VueHook from 'alova/vue';
import { generateContinuousNumbers, untilCbCalled } from 'root/testUtils';
import { createClientTokenAuthentication } from '../../packages/scene-vue';
import { mockRequestAdapter } from '../mockData';

interface ListResponse {
  total: number;
  list: number[];
}
describe('createClientTokenAuthentication', () => {
  test('should emit custom request and response interceptors', async () => {
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<typeof VueHook, typeof mockRequestAdapter>({});
    const beforeRequestFn = jest.fn();
    const responseFn = jest.fn();
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      localCache: null,
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

    const responseErrorFn = jest.fn();
    const completeFn = jest.fn();
    const alovaInst2 = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      localCache: null,
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

  test('should emit login interceptor when set authRole to `login`', async () => {
    const loginInterceptorFn = jest.fn();
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<typeof VueHook, typeof mockRequestAdapter>({
      login(response, method) {
        expect(response.total).toBe(300);
        expect(method).toBeInstanceOf(Method);
        loginInterceptorFn();
      }
    });
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      localCache: null,
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

    const { onAuthRequired: onAuthRequired2, onResponseRefreshToken: onResponseRefreshToken2 } = createClientTokenAuthentication<
      typeof VueHook,
      typeof mockRequestAdapter
    >({
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
      localCache: null,
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
    const logoutInterceptorFn = jest.fn();
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<typeof VueHook, typeof mockRequestAdapter>({
      logout(response, method) {
        expect(response.total).toBe(300);
        expect(method).toBeInstanceOf(Method);
        logoutInterceptorFn();
      }
    });
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      localCache: null,
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

    const { onAuthRequired: onAuthRequired2, onResponseRefreshToken: onResponseRefreshToken2 } = createClientTokenAuthentication<
      typeof VueHook,
      typeof mockRequestAdapter
    >({
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
      localCache: null,
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
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<typeof VueHook, typeof mockRequestAdapter>({
      async login() {
        await untilCbCalled(setTimeout, 100);
        orderAry.push('login');
      },
      async logout() {
        await untilCbCalled(setTimeout, 100);
        orderAry.push('logout');
      }
    });
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      localCache: null,
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
    const { onSuccess } = useRequest(loginMethod);
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
  });

  test('should refresh token first when it is expired', async () => {
    let token = '';
    const refreshTokenFn = jest.fn();
    const beforeRequestFn = jest.fn();
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<typeof VueHook, typeof mockRequestAdapter>({
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
    });
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      localCache: null,
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
    const refreshTokenFn = jest.fn();
    const beforeRequestFn = jest.fn();
    const { onAuthRequired, onResponseRefreshToken, waitingList } = createClientTokenAuthentication<
      typeof VueHook,
      typeof mockRequestAdapter
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
          expect(waitingList).toHaveLength(1); // 等待列表中有一个请求
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
      localCache: null,
      beforeRequest: onAuthRequired(beforeRequestFn),
      responded: onResponseRefreshToken((response, method) => {
        if (!method.meta?.refreshToken) {
          expect(method.config.headers.Authorization).toBe('123');
        }
        return response;
      })
    });
    const method = alovaInst.Get('/list-auth', {
      transformData: (data: number[]) => data.map(i => i + 5)
    });
    const [list, list2] = await Promise.all([method, method]);
    expect(list).toStrictEqual(generateContinuousNumbers(10, 5));
    expect(list2).toStrictEqual(generateContinuousNumbers(10, 5));
    expect(refreshTokenFn).toHaveBeenCalledTimes(1); // 多次请求，只会刷新一次token
    expect(beforeRequestFn).toHaveBeenCalledTimes(3); // 两次list-auth，1次refresh-token
    expect(waitingList).toHaveLength(0); // 等待列表中的请求已发出
  });
  test("shouldn't continue run when throw error in refreshToken", async () => {
    let token = '';
    const refreshTokenFn = jest.fn();
    const redirectLoginFn = jest.fn();
    const { onAuthRequired, onResponseRefreshToken, waitingList } = createClientTokenAuthentication<
      typeof VueHook,
      typeof mockRequestAdapter
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
            expect(waitingList).toHaveLength(1); // 等待列表中有一个请求
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
      localCache: null,
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
    expect(waitingList).toHaveLength(0); // refreshToken.handler中抛出错误，也会清空等待列表
  });
  test('should emit bypass the token validation when set authRole to null', async () => {
    let token = '';
    const expireFn = jest.fn();
    const refreshTokenFn = jest.fn();
    const { onAuthRequired, onResponseRefreshToken } = createClientTokenAuthentication<typeof VueHook, typeof mockRequestAdapter>({
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
    const alovaInst = createAlova({
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      localCache: null,
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

    // 自定义忽略method规则
    const { onAuthRequired: onAuthRequired2, onResponseRefreshToken: onResponseRefreshToken2 } = createClientTokenAuthentication<
      typeof VueHook,
      typeof mockRequestAdapter
    >({
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
      localCache: null,
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
