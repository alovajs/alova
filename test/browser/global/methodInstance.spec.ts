import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { useRequest } from '@/index';
import VueHook from '@/predefine/VueHook';

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

  test('should emit onError event when `method.config.transformData` throws a error', async () => {
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
    await expect(p).rejects.toThrow('[alova]The user aborted a request.');
  });

  test('request should be aborted with `clonedMethod.abort` in beforeRequest', async () => {
    const Get = getAlovaInstance(VueHook, {
      beforeRequestExpect(methodInstance) {
        methodInstance.abort();
      },
      responseExpect: r => r.json()
    }).Get('/unit-test');
    const p = Get.send(true);
    await expect(p).rejects.toThrow('[alova]The user aborted a request.');
  });
});
