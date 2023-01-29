import '@testing-library/jest-dom';
import { Ref, ref } from 'vue';
import { updateState, useRequest } from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { removeStateCache } from '../../../src/storage/stateCache';
import { key } from '../../../src/utils/helper';
import { getAlovaInstance, mockServer, untilCbCalled } from '../../utils';
import { Result } from '../result.type';

beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('update cached response data by user in vue', function () {
  test('test update function', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      localCache: 100000,
      transformData: ({ data }: Result) => data
    });
    const { data, onSuccess } = useRequest(Get);
    await untilCbCalled(onSuccess);
    const updated = updateState(Get, data => {
      data.path = '/unit-test-updated';
      return data;
    });
    expect(data.value.path).toBe('/unit-test-updated');
    expect(updated).toBeTruthy();
  });

  test("shouldn't be called when not get any states", () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      params: { a: 1 },
      localCache: 100000,
      transformData: ({ data }: Result) => data
    });

    const mockfn = jest.fn();
    const updated = updateState(Get, data => {
      mockfn();
      return data;
    });
    expect(mockfn.mock.calls.length).toBe(0);
    expect(updated).toBeFalsy();
  });

  test('should update the first matched one when find sereval Method instance', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      name: 'get1',
      params: { a: 1 },
      localCache: 100000,
      transformData: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test', {
      name: 'get2',
      params: { b: 2 },
      localCache: 100000,
      transformData: ({ data }: Result) => data
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    await Promise.all([untilCbCalled(firstState.onSuccess), untilCbCalled(secondState.onSuccess)]);
    updateState(
      /^get/,
      (data: any) => {
        data.path = '/unit-test-updated';
        return data;
      },
      {
        onMatch: methodInstance => {
          expect(methodInstance).toBe(Get1);
        }
      }
    );

    // 匹配到多个method实例，只会更新第一个
    expect(firstState.data.value.path).toBe('/unit-test-updated');
    expect(secondState.data.value.path).toBe('/unit-test');
  });

  test("shouldn't throw error when not match any one", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      name: 'get1',
      params: { a: 1 },
      localCache: 100000,
      transformData: ({ data }: Result) => data
    });
    const Get2 = alova.Get('/unit-test', {
      name: 'get2',
      params: { b: 2 },
      localCache: 100000,
      transformData: ({ data }: Result) => data
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    await Promise.all([untilCbCalled(firstState.onSuccess), untilCbCalled(secondState.onSuccess)]);

    // 不会匹配任何一个method实例
    updateState('get', (data: any) => {
      data.path = '/unit-test-updated';
      return data;
    });

    // 匹配到多个method实例，只会更新第一个
    expect(firstState.data.value.path).toBe('/unit-test');
    expect(secondState.data.value.path).toBe('/unit-test');
  });

  test('update extra managed states', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get = alova.Get('/unit-test', {
      localCache: 100000,
      transformData: ({ data }: Result) => data
    });

    const extraData = ref(0);
    const extraData2 = 1;
    const { onSuccess } = useRequest(Get, {
      managedStates: {
        extraData,
        extraData2: extraData2 as unknown as Ref<number>
      }
    });
    await untilCbCalled(onSuccess);

    // 预设状态不能更新
    expect(() => {
      updateState(Get, {
        loading: () => true
      });
    }).toThrow();

    // 非状态数据不能更新
    expect(() => {
      updateState(Get, {
        extraData2: () => 1
      });
    }).toThrow();

    // 未找到状态抛出错误
    expect(() => {
      updateState(Get, {
        extraData3: () => 1
      });
    }).toThrow();

    // 更新成功
    updateState(Get, {
      extraData: () => 1
    });
    expect(extraData.value).toBe(1);
  });

  test('shouldn return false when matched method instance but has no cached states', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const Get1 = alova.Get('/unit-test', {
      name: 'get10',
      params: { a: 1 },
      localCache: 100000,
      transformData: ({ data }: Result) => data
    });

    const { onSuccess } = useRequest(Get1);
    await untilCbCalled(onSuccess);
    removeStateCache(alova.id, key(Get1));

    // onMatch将会被调用，但不会更新
    const mockMatchFn = jest.fn();
    const mockUpdateFn = jest.fn();
    const updated = updateState(
      'get10',
      (data: any) => {
        mockUpdateFn();
        return data;
      },
      {
        onMatch(method) {
          expect(method).toBe(Get1);
          mockMatchFn();
        }
      }
    );

    expect(mockMatchFn).toBeCalled();
    expect(mockUpdateFn).not.toBeCalled();
    expect(updated).toBeFalsy();
  });
});
