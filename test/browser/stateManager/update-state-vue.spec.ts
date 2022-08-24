import {
  useRequest,
  updateState,
} from '../../../src';
import VueHook from '../../../src/predefine/VueHook';
import { Result } from '../result.type';
import { mockServer, getAlovaInstance, untilCbCalled } from '../../utils';
import '@testing-library/jest-dom';


beforeAll(() => mockServer.listen());
afterEach(() => mockServer.resetHandlers());
afterAll(() => mockServer.close());

describe('update cached response data by user in vue', function() {
  test('test update function with vue', async () => {
    const alova = getAlovaInstance(VueHook);
    const Get = alova.Get('/unit-test', {
      localCache: 100000,
      transformData: ({ data }: Result) => data,
    });
    const { data, onSuccess } = useRequest(Get);
    await untilCbCalled(onSuccess);
    updateState(Get, data => {
      data.path = '/unit-test-updated';
      return data;
    });
    expect(data.value.path).toBe('/unit-test-updated');
  });


  test('shouldn\'t be call when not get any states', () => {
    const alova = getAlovaInstance(VueHook);
    const Get = alova.Get('/unit-test', {
      params: { a: 1 },
      localCache: 100000,
      transformData: ({ data }: Result) => data,
    });

    const mockfn = jest.fn();
    updateState(Get, data => {
      mockfn();
      return data;
    });
    expect(mockfn.mock.calls.length).toBe(0);
  });


  test('should update the first matched one when find sereval Method instance', async () => {
    const alova = getAlovaInstance(VueHook);
    const Get1 = alova.Get('/unit-test', {
      name: 'get1',
      params: { a: 1 },
      localCache: 100000,
      transformData: ({ data }: Result) => data,
    });
    const Get2 = alova.Get('/unit-test', {
      name: 'get2',
      params: { b: 2 },
      localCache: 100000,
      transformData: ({ data }: Result) => data,
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    await Promise.all([
      untilCbCalled(firstState.onSuccess),
      untilCbCalled(secondState.onSuccess),
    ]);
    updateState(/^get/, (data: any) => {
      data.path = '/unit-test-updated';
      return data;
    });

    // 匹配到多个method实例，只会更新第一个
    expect(firstState.data.value.path).toBe('/unit-test-updated');
    expect(secondState.data.value.path).toBe('/unit-test');
  });

  test('shouldn\'t throw error when not match any one', async () => {
    const alova = getAlovaInstance(VueHook);
    const Get1 = alova.Get('/unit-test', {
      name: 'get1',
      params: { a: 1 },
      localCache: 100000,
      transformData: ({ data }: Result) => data,
    });
    const Get2 = alova.Get('/unit-test', {
      name: 'get2',
      params: { b: 2 },
      localCache: 100000,
      transformData: ({ data }: Result) => data,
    });

    const firstState = useRequest(Get1);
    const secondState = useRequest(Get2);
    await Promise.all([
      untilCbCalled(firstState.onSuccess),
      untilCbCalled(secondState.onSuccess),
    ]);

    // 不会匹配任何一个method实例
    updateState('get', (data: any) => {
      data.path = '/unit-test-updated';
      return data;
    });

    // 匹配到多个method实例，只会更新第一个
    expect(firstState.data.value.path).toBe('/unit-test');
    expect(secondState.data.value.path).toBe('/unit-test');
  });


  test('delayed update data in silent request', async () => {
    const alova = getAlovaInstance(VueHook);
    const Get1 = alova.Get('/unit-test', {
      params: { a: 1 },
      transformData: ({ data }: Result) => data,
    });
    const Get2 = alova.Get('/unit-test', {
      name: 'get2',
      params: { b: 2 },
      localCache: 100000,
      transformData: ({ data }: Result) => data,
      silent: true,
    });
    const firstState = useRequest(Get1);
    await untilCbCalled(firstState.onSuccess);
    
    const secondState = useRequest(Get2);
    await new Promise(res => {
      secondState.onSuccess(() => {
        updateState(Get1, rawData => {
          return {
            '+params': [(res: any) => res.params, {}],
            method: rawData.method + '2',
          }
        });
        // 一开始是默认值
        expect(firstState.data.value).toEqual({ method: 'GET2', params: {} });
        res(null);
      });
    });

    // 请求完成后是实际值
    await untilCbCalled(setTimeout, 200);
    expect(firstState.data.value).toEqual({ method: 'GET2', params: { b: '2' } });
  });
});