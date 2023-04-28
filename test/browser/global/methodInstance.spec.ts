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
    const Get = alova.Get('/unit-test', {
      transformData() {
        throw new Error('error in transformData');
      }
    });

    const { onError } = useRequest(Get);
    const { error } = await untilCbCalled(onError);
    expect(error.message).toBe('error in transformData');
    await expect(Get.send()).rejects.toThrow('error in transformData');
  });

  test('should set method name dynamically when call `method.setName`', async () => {
    const Get = alova.Get('/unit-test');
    expect(Get.config.name).toBeUndefined();
    Get.setName('name-test');
    expect(Get.config.name).toBe('name-test');
  });
});
