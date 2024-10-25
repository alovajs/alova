import { getAlovaInstance } from '#/utils';
import { useRequest } from '@/index';
import VueHook from '@/statesHook/vue';
import { AlovaEventBase } from '@alova/shared/event';
import { queryCache, setCache } from 'alova';
import { Result, delay, untilCbCalled } from 'root/testUtils';

describe('use useRequest hook to send GET with vue', () => {
  test('should not have initial data', async () => {
    const alova = getAlovaInstance(VueHook);
    const { data } = useRequest(alova.Get(''), { immediate: false });
    expect(data.value).toBeUndefined();
  });

  test('should apply initialData with object and function', async () => {
    const alova = getAlovaInstance(VueHook);
    const mockFn = vi.fn();
    const { data: data1 } = useRequest(alova.Get(''), { initialData: 'test', immediate: false });
    const { data: data2 } = useRequest(alova.Get(''), {
      initialData: () => {
        mockFn();
        return 'test';
      },
      immediate: false
    });

    expect(data1.value).toStrictEqual('test');
    expect(data2.value).toStrictEqual('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('init and send get request', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      params: { a: 'a', b: 'str' },
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      },
      transform(result: Result) {
        expect(result.code).toBe(200);
        expect(result.data.path).toBe('/unit-test');
        expect(result.data.params).toStrictEqual({ a: 'a', b: 'str' });
        return result.data;
      },
      cacheFor: 100 * 1000
    });
    const { loading, data, error, onSuccess } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    const { data: rawData, fromCache } = await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toStrictEqual({ a: 'a', b: 'str' });
    expect(rawData.path).toBe('/unit-test');
    expect(rawData.params).toStrictEqual({ a: 'a', b: 'str' });
    expect(error.value).toBeUndefined();
    expect(fromCache).toBeFalsy();

    // 缓存有值
    const cacheData = await queryCache(Get);
    expect(cacheData?.path).toBe('/unit-test');
    expect(cacheData?.params).toStrictEqual({ a: 'a', b: 'str' });
  });

  test("shouldn't emit onError of useRequest when global error cb don't throw Error at error request", async () => {
    const alova = getAlovaInstance(VueHook, {
      resErrorExpect: error => {
        expect(error.message).toMatch('Failed to fetch');
      }
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-error', {
      cacheFor: {
        expire: 100 * 1000
      }
    });
    const { loading, data, downloading, error, onSuccess } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    // 请求错误无缓存
    const cacheData = await queryCache(Get);
    expect(cacheData).toBeUndefined();
  });

  test('should emit onError of useRequest when global error cb throw Error at error request', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect(response) {
        expect(response.status).toBe(404);
        expect(response.statusText).toBe('api not found');
        const error = new Error(response.statusText);
        error.name = response.status.toString();
        throw error;
      }
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-404', {
      cacheFor: {
        expire: 100 * 1000
      }
    });
    const { loading, data, downloading, error, onError, onComplete } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    onComplete(event => {
      expect(event.status).toBe('error');
      expect(event.error).toBe(error.value);
      expect(event.method).toBe(Get);
      expect(event.args).toStrictEqual([]);
    });
    const errEvent = await untilCbCalled(onError);
    expect(errEvent.method).toBe(Get);
    expect(errEvent.args).toStrictEqual([]);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeInstanceOf(Error);
    expect(error.value).toBe(errEvent.error);
    expect(error.value?.name).toBe('404');
    expect(error.value?.message).toBe('api not found');

    // 请求错误无缓存
    const cacheData = await queryCache(Get);
    expect(cacheData).toBeUndefined();

    const alova2 = getAlovaInstance(VueHook, {
      responseExpect() {
        return Promise.reject(new Error('throwed in error2'));
      }
    });
    const Get2 = alova2.Get<string, Result<string>>('/unit-test-404', {
      cacheFor: {
        expire: 100 * 1000
      }
    });
    const secondState = useRequest(Get2);
    expect(secondState.loading.value).toBeTruthy();
    expect(secondState.data.value).toBeUndefined();
    expect(secondState.downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(secondState.error.value).toBeUndefined();

    const err2 = await untilCbCalled(secondState.onError);
    expect(secondState.loading.value).toBeFalsy();
    expect(secondState.data.value).toBeUndefined();
    expect(secondState.downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(secondState.error.value).toBeInstanceOf(Error);
    expect(secondState.error.value).toBe(err2.error);
    expect(secondState.error.value?.message).toBe('throwed in error2');
  });

  test('send get with responseCallback error', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: () => {
        throw new Error('responseCallback error');
      }
    });
    const Get = alova.Get<string, Result<string>>('/unit-test');
    const { loading, data, error, onError } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    const err = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeInstanceOf(Object);
    expect(error.value).toBe(err.error);
    expect(error.value?.message).toBe('responseCallback error');

    const alova2 = getAlovaInstance(VueHook, {
      responseExpect: () => Promise.reject(new Error('responseCallback error2'))
    });
    const Get2 = alova2.Get<string, Result<string>>('/unit-test');
    const secondState = useRequest(Get2);
    expect(secondState.loading.value).toBeTruthy();
    expect(secondState.data.value).toBeUndefined();
    expect(secondState.downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(secondState.error.value).toBeUndefined();

    const err2 = await untilCbCalled(secondState.onError);
    expect(secondState.loading.value).toBeFalsy();
    expect(secondState.data.value).toBeUndefined();
    expect(secondState.downloading.value).toStrictEqual({ total: 77, loaded: 77 });
    expect(secondState.error.value).toBeInstanceOf(Object);
    expect(secondState.error.value).toBe(err2.error);
    expect(secondState.error.value?.message).toBe('responseCallback error2');
  });

  test('abort request when timeout', async () => {
    const alova = getAlovaInstance(VueHook, {
      resErrorExpect: error => {
        expect(error.message).toMatch(/network timeout/);
        throw error;
      }
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-1s', { timeout: 500 });
    const { loading, data, error, onError } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    const err = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeInstanceOf(Object);
    expect(error.value).toBe(err.error);
  });

  test('abort request manually with abort function returns in useRequest', async () => {
    const alova = getAlovaInstance(VueHook, {
      resErrorExpect: error => {
        expect(error.message).toMatch(/user aborted a request/);
        return Promise.reject(error);
      }
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-1s');
    const { loading, data, error, abort, onError } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
    setTimeout(abort, 100);

    const err = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeInstanceOf(Object);
    expect(error.value).toStrictEqual(err.error);
  });

  test('abort request manually with abort function returns in useRequest(non-immediate)', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get<string, Result<string>>('/will-never-request');
    const { loading, data, error, abort, onError } = useRequest(Get, { immediate: false });
    const errFn = vi.fn();
    onError(errFn);

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    // fix #314
    expect(abort).not.toThrow();
    expect(errFn).not.toHaveBeenCalled();

    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
  });

  test('abort request manually with abort function in method instance', async () => {
    const alova = getAlovaInstance(VueHook, {
      resErrorExpect: error => {
        expect(error.message).toMatch(/user aborted a request/);
        return Promise.reject(error);
      }
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-1s');
    const { loading, data, error, onError } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();
    setTimeout(Get.abort, 100);

    const err = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeInstanceOf(Error);
    expect(error.value).toStrictEqual(err.error);
  });

  test('abort request manually with cloned method instance in beforeRequest', async () => {
    const alova = getAlovaInstance(VueHook, {
      beforeRequestExpect(methodInstance) {
        // 在这边中断请求
        setTimeout(methodInstance.abort, 100);
      },
      resErrorExpect: error => {
        expect(error.message).toMatch(/user aborted a request/);
        return Promise.reject(error);
      }
    });
    const Get = alova.Get<string, Result<string>>('/unit-test-1s');
    const { loading, data, error, onError } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    const err = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeInstanceOf(Object);
    expect(error.value).toStrictEqual(err.error);
  });

  test('it can pass custom params when call `send` function, and the function will return a Promise instance', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetter = (d: { a: string; b: string }) =>
      alova.Get('/unit-test', {
        timeout: 10000,
        transform: ({ data }: Result<true>) => data,
        params: {
          a: d.a,
          b: d.b
        },
        cacheFor: 10 * 1000
      });

    const { data, send, onSuccess, onComplete } = useRequest(params => getGetter(params), {
      immediate: false
    });
    onSuccess(({ data, args }) => {
      expect(args).toHaveLength(1);
      const obj = args[0];
      expect(data.path).toBe('/unit-test');
      expect(obj.a).toMatch(/~|\./);
      expect(obj.b).toMatch(/~|\./);
    });
    onComplete(({ args }) => {
      expect(args).toHaveLength(1);
      const obj = args[0];
      expect(obj.a).toMatch(/~|\./);
      expect(obj.b).toMatch(/~|\./);
    });

    // 延迟一会儿发送请求
    await delay(500);
    const sendObj = { a: '~', b: '~' };
    let rawData = await send(sendObj);
    expect(rawData.path).toBe('/unit-test');
    expect(rawData.params.a).toBe('~');
    expect(data.value.params.b).toBe('~');
    let cacheData = await queryCache(getGetter(sendObj));
    expect(cacheData?.params).toStrictEqual(sendObj);

    const sendObj2 = { a: '.', b: '.' };
    rawData = await send(sendObj2);
    expect(rawData.params.a).toBe('.');
    expect(data.value.params.b).toBe('.');
    cacheData = await queryCache(getGetter(sendObj2));
    expect(cacheData?.params).toStrictEqual(sendObj2);
  });

  test('should throw a request error when request error at calling `send` function', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetter = (index: number) =>
      alova.Get('/unit-test-404', {
        transform: ({ data }: Result<true>) => data,
        params: {
          index
        }
      });

    const { send, onError, onComplete } = useRequest((index: number) => getGetter(index), {
      immediate: false
    });

    const mockFn = vi.fn();
    onError(({ error, args }) => {
      const index = args[0];
      mockFn();
      expect(error.message).toMatch(/404/);
      expect(index.toString()).toMatch(/3|5/);
    });
    onComplete(({ error, args }) => {
      const index = args[0];
      mockFn();
      expect(error.message).toMatch(/404/);
      expect(index.toString()).toMatch(/3|5/);
    });

    // 延迟一会儿发送请求
    await delay(100);
    try {
      const data = await send(3);
      expect(data.path).toBe('/unit-test');
      expect(data.params.index).toStrictEqual('3');
      expect(mockFn).toHaveBeenCalledTimes(2);
    } catch (err: any) {
      expect(err.message).toMatch(/404/);
    }
  });

  test('should force event be a AlovaEvent instance', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const mockFn = vi.fn();
    const getGetterObj = alova.Get('/unit-test');

    const { send } = useRequest(getGetterObj, {
      immediate: false,
      force: event => {
        mockFn();
        expect(event).toBeInstanceOf(AlovaEventBase);
        expect(event.args).toStrictEqual([1, 2, 3]);
        return true;
      }
    });

    await send(1, 2, 3);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test('It would return the useHookConfig object when second param is function in `useRequest`', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const getGetterObj = alova.Get('/unit-test', {
      timeout: 10000,
      transform: ({ data }: Result<true>) => data,
      params: {
        a: '~',
        b: '~~'
      },
      cacheFor: 100 * 1000
    });

    const { data, send } = useRequest(getGetterObj, {
      immediate: false,
      force: ({ args: [force] }) => force
    });

    setCache(getGetterObj, {
      path: '/unit-test',
      method: 'GET',
      params: { a: '0', b: '1' },
      data: {}
    });

    let rawData = await send();
    expect(rawData.path).toBe('/unit-test');
    expect(rawData.params.a).toBe('0');
    expect(data.value.params.b).toBe('1');

    rawData = await send(true);
    expect(rawData.params.a).toBe('~');
    expect(data.value.params.b).toBe('~~');
    const cacheData = await queryCache(getGetterObj);
    expect(cacheData?.params).toStrictEqual({ a: '~', b: '~~' });
  });

  test('should update states when call update returns in useFetcher', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });

    const { loading, data, error, update } = useRequest(alova.Get('/unit-test'));
    update({
      loading: true,
      error: new Error('custom request error'),
      data: 111
    });
    expect(loading.value).toBeTruthy();
    expect(error.value?.message).toBe('custom request error');
    expect(data.value).toBe(111);
  });

  test('should return original return value in on events', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      params: { a: 'abc', b: 'str' },
      transform: ({ data }: Result) => data
    });

    const successFn = vi.fn();
    const errorFn = vi.fn();
    const completeFn = vi.fn();
    const { loading, data, error, onSuccess } = useRequest(Get)
      .onSuccess(successFn)
      .onError(errorFn)
      .onComplete(completeFn);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.path).toBe('/unit-test');
    expect(data.value.params).toStrictEqual({ a: 'abc', b: 'str' });
    expect(error.value).toBeUndefined();

    expect(successFn).toHaveBeenCalled();
    expect(errorFn).not.toHaveBeenCalled();
    expect(completeFn).toHaveBeenCalled();
  });
});
