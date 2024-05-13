import { getAlovaInstance } from '#/utils';
import { createAlova } from '@/alova';
import { Result, delay } from 'root/testUtils';

const alova = getAlovaInstance({
  responseExpect: r => r.json()
});
describe('method instance', () => {
  test('should send request when call `method.send` and return promise', async () => {
    const Get1 = alova.Get<Result>('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const prom = Get1.send();
    expect(prom).toBeInstanceOf(Promise);
    const { code, data } = await prom;
    expect(code).toBe(200);
    expect(data.path).toBe('/unit-test');
    expect(data.params).toEqual({ a: 'a', b: 'str' });
    expect(data.path).toBe('/unit-test');
    expect(data.params).toEqual({ a: 'a', b: 'str' });

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
      cacheFor: 100 * 1000
    });

    await Get1;
    expect(Get1.fromCache).toBeFalsy();

    await Get1;
    expect(Get1.fromCache).toBeTruthy();
  });

  test('`method.config.transformData` can also support async function', async () => {
    const Get = alova.Get('/unit-test', {
      params: { a: 'a22', b: 'str' },
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
    expect(data.params).toEqual({ a: 'a22', b: 'str' });
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
    await expect(p).rejects.toThrow('This operation was aborted');
  });

  test('request should be aborted with `clonedMethod.abort` in beforeRequest', async () => {
    const Get = getAlovaInstance({
      beforeRequestExpect(methodInstance) {
        methodInstance.abort();
      },
      responseExpect: r => r.json()
    }).Get('/unit-test');
    const p = Get.send(true);
    await expect(p).rejects.toThrow('This operation was aborted');
    expect(Get.fromCache).toBeFalsy();
  });

  test('should receive method metadata', async () => {
    const alovaInst = getAlovaInstance({
      beforeRequestExpect(methodInstance) {
        expect(methodInstance.meta).toBeUndefined();
      },
      responseExpect: r => r.json()
    });
    await alovaInst.Get('/unit-test');

    const mockFn = jest.fn();
    const alovaInst2 = getAlovaInstance({
      beforeRequestExpect(methodInstance) {
        mockFn({
          meta: methodInstance.meta,
          showMsg: (methodInstance as any).showMsg
        });
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
    await Get2;
    expect(mockFn.mock.calls[0][0]).toStrictEqual({
      meta: {
        a: 1,
        b: 2
      },
      showMsg: false
    });
  });

  test('should receive method metadata in a shorthand', async () => {
    const mockFn = jest.fn();
    const alovaInst = getAlovaInstance({
      beforeRequestExpect(methodInstance) {
        mockFn({
          meta: methodInstance.meta
        });
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
    await Get;
    expect(mockFn.mock.calls[0][0].meta).toStrictEqual({
      a: 1,
      b: 2
    });
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
    expect(errorReason.message).toMatch('Failed to fetch');
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
    const alovaInst = getAlovaInstance();

    const Get = alovaInst.Get('/unit-test-download', {
      transformData: (resp: Response) => resp.blob()
    });

    let progress = { total: 0, loaded: 0 };
    const offEvent = Get.onDownload(p => {
      progress = p;
    });
    await Get;
    expect(progress).toStrictEqual({ total: 250569, loaded: 250569 });
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

  test('should hit cache when custom the same method key, event if these two methods have different request info', async () => {
    const Get1 = alova.Get<Result>('/unit-test', {
      params: {
        a: 'aaa1',
        b: 'bbb1'
      }
    });
    Get1.__key__ = 'custom-key1';
    const Get2 = alova.Get<Result>('/unit-test', {
      params: {
        a: 'aaa2',
        b: 'bbb2'
      }
    });
    Get2.__key__ = 'custom-key1';

    const data1 = await Get1;
    expect(data1.data.params).toStrictEqual({ a: 'aaa1', b: 'bbb1' });

    const data2 = await Get2;
    expect(data2.data.params).toStrictEqual({ a: 'aaa1', b: 'bbb1' });
    expect(Get2.fromCache).toBeTruthy();
  });

  test('should share request when custom the same method key, event if these two methods have different request info', async () => {
    const requestMockFn = jest.fn();
    const beforeRequestMockFn = jest.fn();
    const responseMockFn = jest.fn();
    const alova = createAlova({
      baseURL: 'http://xxx',
      cacheFor: {
        GET: 0
      },
      beforeRequest() {
        beforeRequestMockFn();
      },
      responded(data) {
        responseMockFn();
        return data;
      },
      requestAdapter({ data }) {
        requestMockFn();
        return {
          response: async () => {
            await delay(5);
            return {
              status: 200,
              data
            };
          },
          headers: async () => ({}),
          abort() {}
        };
      }
    });

    const Post1 = alova.Post<{ status: number; data: { id: number } }>('/unit-test', { id: 1 });
    Post1.__key__ = 'custom-key111';
    const Post2 = alova.Post<{ status: number; data: { id: number } }>('/unit-test', { id: 2 });
    Post2.__key__ = 'custom-key111';

    const p1 = Post1.send();
    const p2 = Post2.send();
    const [data1, data2] = await Promise.all([p1, p2]);
    expect(data1.data).toStrictEqual({ id: 1 });
    expect(data2.data).toStrictEqual({ id: 1 });

    // Because the request is shared, it is only executed once
    expect(requestMockFn).toHaveBeenCalledTimes(1);

    // The number of global request hook calls remains unchanged
    expect(beforeRequestMockFn).toHaveBeenCalledTimes(2);
    expect(responseMockFn).toHaveBeenCalledTimes(2);
  });
});
