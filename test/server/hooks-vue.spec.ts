import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { useRequest } from '@/index';
import VueHook from '@/predefine/VueHook';

// use hook在服务端不再发送请求
describe('[vue]use hooks in SSR', function () {
  test("shouldn't request but loading is true", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json(),
      endWithSlash: true
    });
    const Get = alova.Get<Result>('/unit-test', {
      params: { a: 'a', b: 'str' }
    });
    const { loading, data, downloading, error } = useRequest(Get, {
      initialData: {}
    });
    expect(loading.value).toBeTruthy();
    expect(data.value).toStrictEqual({});
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    // 200ms后依然为请求前状态
    await untilCbCalled(setTimeout, 200);
    expect(loading.value).toBeTruthy();
    expect(data.value).toStrictEqual({});
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
  });
});
