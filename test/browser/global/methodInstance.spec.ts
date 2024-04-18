import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import xhrRequestAdapter from '#/xhrRequestAdapter';
import { createAlova, useRequest } from '@/index';
import VueHook from '@/predefine/VueHook';
import { baseURL } from '~/test/mockServer';

const alova = getAlovaInstance(VueHook, {
  responseExpect: r => r.json()
});
describe('method instance', function () {
  test('should send request when call `method.send` and return promise', async () => {
    const Get1 = alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      transformData(result: Result) {
        expect(result.code).toBe(200);
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toEqual({ a: 'a', b: 'str' });
        return result.data;
      },
      localCache: 100 * 1000
    });

    const rawData = await Get1.send();
    expect(rawData.path).toBe('/unit-test');
    expect(rawData.params).toEqual({ a: 'a', b: 'str' });

    const Get2 = alova.Get<Result>('/unit-test-error', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    await expect(Get2.send()).rejects.toThrow();
  });

  test('fromCache should be true when request with cache', async () => {
    const Get1 = alova.Get('/unit-test', {
      params: { aa1: 'aa1', b: 'str' },
      timeout: 10000,
      transformData(result: Result) {
        return result.data;
      },
      localCache: 100 * 1000
    });

    await Get1;
    expect(Get1.fromCache).toBeFalsy();

    await Get1;
    expect(Get1.fromCache).toBeTruthy();
  });

  test('`method.config.transformData` can also support async function', async () => {
    const Get = alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      async transformData(result: Result) {
        await new Promise(resolve => {
          setTimeout(resolve, 200);
        });
        return result.data;
      }
    });
    const data = await Get.send();
    expect(data.path).toBe('/unit-test');
    expect(data.params).toEqual({ a: 'a', b: 'str' });
  });

  test('should emit onError event when `method.config.transformData` throws an error', async () => {
    const Get = (async = true) =>
      alova.Get('/unit-test', {
        transformData() {
          if (async) {
            return Promise.reject(new Error('reject in transformData'));
          }
          throw new Error('error in transformData');
        }
      });

    const { onError } = useRequest(Get);
    const { error } = await untilCbCalled(onError);
    expect(error.message).toBe('reject in transformData');
    await expect(Get().send()).rejects.toThrow('reject in transformData');

    const { onError: onError2 } = useRequest(Get(false));
    const { error: error2 } = await untilCbCalled(onError2);
    expect(error2.message).toBe('error in transformData');
    await expect(Get(false).send()).rejects.toThrow('error in transformData');
  });

  test('should set method name dynamically when call `method.setName`', () => {
    const Get = alova.Get('/unit-test');
    expect(Get.config.name).toBeUndefined();
    Get.setName('name-test');
    expect(Get.config.name).toBe('name-test');
  });

  test('request should be aborted with `method.abort`', async () => {
    const Get = alova.Get('/unit-test');
    const p = Get.send(true);
    Get.abort();
    await expect(p).rejects.toThrow('The user aborted a request.');
  });

  test('request should be aborted with `clonedMethod.abort` in beforeRequest', async () => {
    const Get = getAlovaInstance(VueHook, {
      beforeRequestExpect(methodInstance) {
        methodInstance.abort();
      },
      responseExpect: r => r.json()
    }).Get('/unit-test');
    const p = Get.send(true);
    await expect(p).rejects.toThrow('The user aborted a request.');
  });

  test('request should be aborted with `clonedMethod.abort` in beforeRequest', async () => {
    const Get = getAlovaInstance(VueHook, {
      beforeRequestExpect(methodInstance) {
        methodInstance.abort();
      },
      responseExpect: r => r.json()
    }).Get('/unit-test');
    await expect(Get.send(true)).rejects.toThrow('The user aborted a request.');
    expect(Get.fromCache).toBeFalsy();
  });

  test('should receive method metadata', async () => {
    const alovaInst = getAlovaInstance(VueHook, {
      beforeRequestExpect(methodInstance) {
        expect(methodInstance.meta).toBeUndefined();
      },
      responseExpect: r => r.json()
    });
    await alovaInst.Get('/unit-test');

    const alovaInst2 = getAlovaInstance(VueHook, {
      beforeRequestExpect(methodInstance) {
        throw new Error(
          JSON.stringify({
            meta: methodInstance.meta,
            showMsg: (methodInstance as any).showMsg
          })
        );
      },
      responseExpect: r => r.json()
    });
    const Get2 = alovaInst2.Get('/unit-test');
    (Get2 as any).meta = {
      a: 1,
      b: 2
    };
    (Get2 as any).showMsg = false;

    // 从beforeRequest中抛出json字符串
    await expect(Get2.send(true)).rejects.toThrow(
      JSON.stringify({
        meta: {
          a: 1,
          b: 2
        },
        showMsg: false
      })
    );
  });

  test('should receive method metadata in a shorthand', async () => {
    const alovaInst = getAlovaInstance(VueHook, {
      beforeRequestExpect(methodInstance) {
        throw new Error(
          JSON.stringify({
            meta: methodInstance.meta
          })
        );
      },
      responseExpect: r => r.json()
    });
    const Get = alovaInst.Get('/unit-test', {
      meta: {
        a: 1,
        b: 2
      }
    });
    // 从beforeRequest中抛出json字符串
    await expect(Get.send(true)).rejects.toThrow(
      JSON.stringify({
        meta: {
          a: 1,
          b: 2
        }
      })
    );
  });

  // 2.16.0+ 已将method实例转换为PromiseLike
  test('should send request when call `method.then` or await method instance', async () => {
    const rawData = await alova.Get('/unit-test', {
      params: { e: 'e', f: 'gty' },
      transformData: (result: Result) => result.data
    });
    expect(rawData.path).toBe('/unit-test');
    expect(rawData.params).toStrictEqual({ e: 'e', f: 'gty' });

    const rawDataParams = await alova
      .Get('/unit-test', {
        params: { e2: 'gg', f: 'gty2' },
        transformData: (result: Result) => result.data
      })
      .then(result => result.params);
    expect(rawDataParams).toStrictEqual({ e2: 'gg', f: 'gty2' });

    await expect(alova.Get<Result>('/unit-test-error')).rejects.toThrow();
  });
  test('should send request when call `method.catch`', async () => {
    const catchMockFn = jest.fn();
    const errorReason = await alova.Get<Result>('/unit-test-error').catch(reason => {
      catchMockFn(reason);
      return reason;
    });
    expect(errorReason.message).toMatch(/server error/);
    expect(catchMockFn).toHaveBeenCalledTimes(1);
    expect(catchMockFn).toHaveBeenCalledWith(errorReason);
  });

  test('should send request when call `method.finally`', async () => {
    const finallyMockFn = jest.fn();
    const finallyPromiseMockFn = jest.fn();
    const rawData = await alova
      .Get('/unit-test', {
        params: { gb: 'gb', f: 'gty' },
        transformData: (result: Result) => result.data
      })
      .finally(() => {
        finallyMockFn();
        return Promise.resolve().then(finallyPromiseMockFn);
      });
    expect(rawData.path).toBe('/unit-test');
    expect(rawData.params).toStrictEqual({ gb: 'gb', f: 'gty' });
    expect(finallyMockFn).toHaveBeenCalledTimes(1);
    expect(finallyPromiseMockFn).toHaveBeenCalledTimes(1);

    await expect(
      alova.Get<Result>('/unit-test-error').finally(() => {
        finallyMockFn();
        return Promise.resolve().then(finallyPromiseMockFn);
      })
    ).rejects.toThrow();
    expect(finallyMockFn).toHaveBeenCalledTimes(2);
    expect(finallyPromiseMockFn).toHaveBeenCalledTimes(2);
  });

  test('should download file and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: xhrRequestAdapter,
      statesHook: VueHook,
      responded: ({ data }) => data,
      cacheLogger: null
    });

    const Get = alovaInst.Get('/unit-test-download', {
      responseType: 'blob'
    });

    let progress = { total: 0, loaded: 0 };
    const offEvent = Get.onDownload(p => {
      progress = p;
    });
    await Get;
    expect(progress).toStrictEqual({ total: 451268, loaded: 451268 });
    expect(Get.dhs).toHaveLength(1);
    offEvent();
    expect(Get.dhs).toHaveLength(0);
  });

  test('should hit cache whatever params are given when set the custom key', async () => {
    const createCustomKeyGetter = (paramA: string) => {
      const getter = alova.Get<Result>('/unit-test', {
        params: {
          paramA
        }
      });
      getter.__key__ = 'custom key';
      return getter;
    };

    const getterA = createCustomKeyGetter('a');
    const dataA = await getterA;
    expect(dataA.data).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        paramA: 'a'
      }
    });
    expect(getterA.fromCache).toBeFalsy();

    const getterB = createCustomKeyGetter('b');
    const dataB = await getterB;
    expect(dataB.data).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        paramA: 'a'
      }
    });
    expect(getterB.fromCache).toBeTruthy();
  });
});
