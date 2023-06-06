import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { useRequest } from '@/index';
import VueHook from '@/predefine/VueHook';

describe('useRequet middleware', function () {
  test('middleware function must be set with a async function', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });

    expect(() => {
      useRequest(getGetterObj, {
        middleware: ((context: any, next: any) => {
          expect(context.method).toBe(getGetterObj);
          next();
        }) as any
      });
    }).toThrowError();
  });

  test('the behavior would be the same as the behavior not set middleware', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });
    const { loading, onSuccess } = useRequest(getGetterObj, {
      middleware: (_, next) => next()
    });

    expect(loading.value).toBeTruthy();
    const rawData = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(!!rawData).toBeTruthy();
  });

  test('should get an error when throw error in middleware function', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });

    const errorObj = new Error('middleware error');
    const { loading, error, onError, data, send } = useRequest(getGetterObj, {
      middleware: async (_, next) => {
        await next();
        throw errorObj;
      }
    });

    const mockFn = jest.fn();
    onError(mockFn);
    expect(loading.value).toBeTruthy();
    expect(error.value).toBeUndefined();
    const { error: errRaw } = await untilCbCalled(onError);
    expect(mockFn).toBeCalledTimes(1);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBe(errorObj);
    expect(error.value).toBe(errRaw);
    const mockFn2 = jest.fn();
    try {
      await send();
    } catch (error) {
      mockFn2();
    }
    expect(mockFn2).toBeCalledTimes(1);
  });

  test('should send request until async middleware function is called', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });
    const { loading, onSuccess } = useRequest(getGetterObj, {
      middleware: async (context, next) => {
        expect(context.method).toBe(getGetterObj);
        await untilCbCalled(setTimeout, 500);
        const resp = await next();
        expect(resp).toEqual({
          path: '/unit-test',
          method: 'GET',
          params: {}
        });
      }
    });
    expect(loading.value).toBeFalsy(); // 延迟1秒发送请求，表示异步发送请求，因此loading为false
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
      transformData: ({ data }: Result<true>) => data
    });
    const { loading, data, onSuccess, send } = useRequest(getGetterObj, {
      middleware: async () => {}
    });

    const mockFn = jest.fn();
    onSuccess(mockFn);
    // middleware中未调用next，因此不会发送请求
    expect(loading.value).toBeFalsy();
    await untilCbCalled(setTimeout, 1000);
    expect(mockFn).toBeCalledTimes(0);
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
      transformData: ({ data }: Result<true>) => data
    });
    const { loading, data, onSuccess, send } = useRequest(getGetterObj, {
      middleware: async (_, next) => {
        const resp = await next({
          force: true,
          method: alova.Get('/unit-test', {
            transformData: ({ data }: Result<true>) => data,
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
    const mockFn = jest.fn();
    onSuccess(mockFn);
    expect(loading.value).toBeTruthy();
    await untilCbCalled(onSuccess);
    expect(data.value.params.a).toBe('a');
    expect(data.value.params.b).toBe('b');

    const rawData = await send();
    expect(rawData.params.a).toBe('a');
    expect(rawData.params.b).toBe('b');
    expect(mockFn).toBeCalledTimes(2);
  });

  test('the behavior will be the same as normal when request error', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test-404', {
      transformData: ({ data }: Result<true>) => data
    });
    const mockFn = jest.fn();
    const mockFn2 = jest.fn();
    const { loading, error, onError, onComplete, data } = useRequest(getGetterObj, {
      middleware: async ({ decorateError, decorateComplete }, next) => {
        decorateError((handler, event, index) => {
          mockFn();
          expect(event.error).toBeInstanceOf(Error);
          expect(event.method).toBe(getGetterObj);
          expect(event.sendArgs).toStrictEqual([]);
          (event as any).index = index;
          const ret = handler(event);
          expect(ret).toBe('a');
        });
        decorateComplete((_, event) => {
          expect(event.status).toBe('error');
          expect(event.error).toBeInstanceOf(Error);
          expect(event.method).toBe(getGetterObj);
          expect(event.sendArgs).toStrictEqual([]);
          mockFn2();
        });
        await untilCbCalled(setTimeout, 400);
        await next();
      }
    });

    onError(event => {
      expect((event as any).index).toBe(0);
      return 'a';
    });
    onError(event => {
      expect((event as any).index).toBe(1);
      return 'a';
    });
    onComplete(() => {
      // 因为装饰函数中未调用handler，因此这个函数不会被执行
      mockFn2();
    });

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
    await untilCbCalled(setTimeout, 500);
    expect(loading.value).toBeFalsy();
    expect(error.value).toBeInstanceOf(Error);
    expect(data.value).toBeUndefined();

    expect(mockFn).toBeCalledTimes(2);
    expect(mockFn2).toBeCalledTimes(1);
  });

  test('can catch error in middleware function when request error', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test-404', {
      transformData: ({ data }: Result<true>) => data
    });
    const { loading, error, onSuccess, data, send } = useRequest(getGetterObj, {
      middleware: async (_, next) => {
        await untilCbCalled(setTimeout, 400);
        try {
          await next();
        } catch (e) {}
      }
    });

    // 错误在middleware中捕获后，外部不再接收到错误
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(error.value).toBeUndefined();
    expect(data.value).toBeUndefined();
    const mockFn = jest.fn();
    try {
      await send();
    } catch (error) {
      mockFn();
    }
    expect(mockFn).toBeCalledTimes(0);
  });

  test('should change response data when return custom data in middleware', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });
    const middlewareResp = {};
    const { loading, error, onSuccess, data } = useRequest(getGetterObj, {
      middleware: async () => {
        return middlewareResp;
      }
    });

    // 只有在中间件中未返回数据或返回undefined时才继续获取真实的响应数据，否则使用返回数据并不再等待响应promise
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(error.value).toBeUndefined();
    expect(data.value).toEqual(middlewareResp);
  });

  test('should decorate callbacks when set decorators', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });
    const mockFn = jest.fn();
    const mockFn2 = jest.fn();
    const { onSuccess, onComplete } = useRequest(getGetterObj, {
      middleware: async ({ decorateSuccess, decorateComplete }, next) => {
        // 在成功回调中注入代码
        decorateSuccess((handler, event, index, length) => {
          mockFn();
          (event as any).index = index;
          const ret = handler(event);
          expect(ret).toBe('a');
          expect(length).toBe(2);
        });
        decorateComplete((handler, event) => {
          mockFn2();
          expect(event.status).toBe('success');
          expect(event.data).not.toBeUndefined();
          expect(event.method).toBe(getGetterObj);
          expect(event.sendArgs).toStrictEqual([]);
          handler(1 as any);
        });
        await next();
      }
    });

    onSuccess(event => {
      expect((event as any).index).toBe(0);
      return 'a';
    });
    onSuccess(event => {
      expect((event as any).index).toBe(1);
      return 'a';
    });
    onComplete(customNum => {
      mockFn2();
      expect(customNum).toBe(1);
    });
    await untilCbCalled(setTimeout, 100);
    expect(mockFn).toBeCalledTimes(2);
    expect(mockFn2).toBeCalledTimes(2);
  });

  test('the behavior should be the same as normal when return another promise instance', async () => {
    const alova = getAlovaInstance(VueHook);
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });

    // 成功示例
    const { loading, onSuccess, data } = useRequest(getGetterObj, {
      middleware: () => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({ anotherData: '123' });
          }, 20);
        });
      }
    });
    expect(loading.value).toBeFalsy(); // loading是需要调用next才会改变
    const { data: dataRaw } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toStrictEqual({ anotherData: '123' });
    expect(dataRaw).toStrictEqual({ anotherData: '123' });

    // 失败示例
    const {
      loading: loadingFail,
      onError,
      data: failData,
      error
    } = useRequest(getGetterObj, {
      middleware: ({ update }) => {
        update({ loading: true });
        return new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('middleware custom error'));
          }, 20);
        });
      }
    });
    expect(loadingFail.value).toBeTruthy(); // middleware函数中手动更改了loading值
    const { error: errorRaw } = await untilCbCalled(onError);
    expect(loadingFail.value).toBeFalsy();
    expect(failData.value).toBeUndefined();
    expect(errorRaw.message).toBe('middleware custom error');
    expect(error.value?.message).toBe('middleware custom error');
  });

  test("shouldn't change loading state after response when prevent loaded", async () => {
    const alova = getAlovaInstance(VueHook);
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });

    // 调用了controlLoading后将自定义控制loading状态
    const state1 = useRequest(getGetterObj, {
      middleware: ({ controlLoading }, next) => {
        controlLoading();
        return next();
      }
    });
    expect(state1.loading.value).toBeFalsy(); // loading已受控
    await untilCbCalled(state1.onSuccess);
    expect(state1.loading.value).toBeFalsy();

    const state2 = useRequest(getGetterObj, {
      middleware: ({ controlLoading, update }, next) => {
        controlLoading();
        update({ loading: true });
        return next();
      }
    });
    expect(state2.loading.value).toBeTruthy(); // loading已受控
    await untilCbCalled(state2.onSuccess);
    expect(state2.loading.value).toBeTruthy();
  });

  test('should send request like send function in returns when call send in middleware', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json(),
      // 设置不缓存，重复发起请求时才可以观察loading状态
      localCache: null
    });
    const getGetter = (d?: { a: string; b: string }) =>
      alova.Get('/unit-test', {
        timeout: 10000,
        transformData: ({ data }: Result) => data,
        params: {
          a: d?.a,
          b: d?.b
        }
      });

    // 调用了controlLoading后将自定义控制loading状态
    let sendInMiddleware: any = undefined;
    const { loading, data, onSuccess } = useRequest(getGetter, {
      middleware: ({ send }, next) => {
        sendInMiddleware = send;
        return next();
      }
    });
    expect(sendInMiddleware).toBeInstanceOf(Function);
    await untilCbCalled(onSuccess);
    expect(data.value).toStrictEqual({ path: '/unit-test', method: 'GET', params: {} });

    // 使用sendInMiddleware发送请求，效果应该与send相同
    const resPromise = sendInMiddleware({ a: 'a', b: 'b' });
    expect(loading.value).toBeTruthy();
    const res = await resPromise;
    expect(res).toStrictEqual({ path: '/unit-test', method: 'GET', params: { a: 'a', b: 'b' } });
    expect(data.value).toStrictEqual({ path: '/unit-test', method: 'GET', params: { a: 'a', b: 'b' } });
  });

  test('should abort request like abort function in returns when call abort in middleware', async () => {
    const alova = getAlovaInstance(VueHook, {
      resErrorExpect: error => {
        return Promise.reject(error);
      }
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-10s');
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

    const err = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeInstanceOf(Object);
    expect(error.value).toBe(err.error);
    expect(error.value?.message).toBe('[alova]The user aborted a request.');
  });
});
