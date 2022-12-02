import { useRequest } from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { getAlovaInstance, mockServer, untilCbCalled } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('useRequet middleware', function () {
  test('middleware function must be set with a async function', async () => {
    const alova = getAlovaInstance(VueHook);
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
    }).toThrow();
  });

  test('the behavior would be the same as the behavior not set middleware', async () => {
    const alova = getAlovaInstance(VueHook);
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
    const alova = getAlovaInstance(VueHook);
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
    const errRaw = await untilCbCalled(onError);
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
    const alova = getAlovaInstance(VueHook);
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });
    const { loading, onSuccess } = useRequest(getGetterObj, {
      middleware: async (context, next) => {
        expect(context.method).toBe(getGetterObj);
        await untilCbCalled(setTimeout, 500);
        await next();
      }
    });
    expect(loading.value).toBeFalsy(); // 延迟1秒发送请求，表示异步发送请求，因此loading为false
    let startTs = Date.now();
    const rawData = await untilCbCalled(onSuccess);
    let endTs = Date.now();
    expect(!!rawData).toBeTruthy();
    expect(endTs - startTs).toBeGreaterThan(500);
  });

  test("shouldn't send request when not call next in middleware function", async () => {
    const alova = getAlovaInstance(VueHook);
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
    const alova = getAlovaInstance(VueHook);
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });
    const { loading, data, onSuccess, send } = useRequest(getGetterObj, {
      middleware: async (_, next) => {
        await next({
          force: true,
          method: alova.Get('/unit-test', {
            transformData: ({ data }: Result<true>) => data,
            params: {
              a: 'a',
              b: 'b'
            }
          })
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

  test('we can change method instance in middleware function', async () => {
    const alova = getAlovaInstance(VueHook);
    const getGetterObj = alova.Get('/unit-test', {
      transformData: ({ data }: Result<true>) => data
    });
    const { onSuccess } = useRequest(getGetterObj, {
      middleware: async (context, next) => {
        context;
        expect(context.method).toBe(getGetterObj);
        await untilCbCalled(setTimeout, 500);
        await next();
      }
    });

    // const alova = getAlovaInstance(VueHook);
    // const getGetterObj = alova.Get('/unit-test', {
    //   transformData: ({ data }: Result<true>) => data
    // });
    // const { onSuccess, onError } = useRequest(getGetterObj, {
    //   middleware: async (_, next) => {
    //     await untilCbCalled(setTimeout, 500);
    //     // 替换method实例，并强制请求
    //     await next({
    //       force: true,
    //       method: alova.Get('/unit-test', {
    //         transformData: ({ data }: Result<true>) => data,
    //         params: {
    //           a: 'a',
    //           b: 'b'
    //         }
    //       })
    //     });
    //   }
    // });

    // const mockFn = jest.fn();
    onSuccess(() => {
      console.log('---------====');
      // mockFn();
    });
    // onError(() => {
    //   console.log('fail');
    // });
    // expect(loading.value).toBeTruthy();
    // await untilCbCalled(onSuccess);
    // expect(data.value.params.a).toBe('a');
    // expect(data.value.params.b).toBe('b');

    // const rawData = await send();
    // expect(rawData.params.a).toBe('a');
    // expect(rawData.params.b).toBe('b');
    // expect(mockFn).toBeCalledTimes(2);
  });

  test('the behavior will be the same as normal when request error', async () => {
    const alova = getAlovaInstance(VueHook);
    const getGetterObj = alova.Get('/unit-test-404', {
      transformData: ({ data }: Result<true>) => data
    });
    const { loading, error, onError, data } = useRequest(getGetterObj, {
      middleware: async (_, next) => {
        await untilCbCalled(setTimeout, 400);
        await next();
      }
    });

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
    await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(error.value).toBeInstanceOf(Error);
    expect(data.value).toBeUndefined();
  });

  test('can catch error in middleware function when request error', async () => {
    const alova = getAlovaInstance(VueHook);
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
});
