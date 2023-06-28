import { getAlovaInstance, Result, untilCbCalled } from '#/utils';
import { useRequest } from '@/index';
import SvelteHook from '@/predefine/SvelteHook';

// use hook在服务端不再发送请求
describe('[svelte]use hooks in SSR', function () {
  test("shouldn't request but loading is true", async () => {
    const alova = getAlovaInstance(SvelteHook, {
      responseExpect: r => r.json(),
      endWithSlash: true
    });
    const Get = alova.Get<Result>('/unit-test', {
      params: { a: 'a', b: 'str' }
    });
    const { loading, data, downloading, error } = useRequest(Get, {
      initialData: {}
    });

    loading.subscribe(val => {
      expect(val).toBeTruthy();
    });
    data.subscribe(val => {
      expect(val).toStrictEqual({});
    });
    downloading.subscribe(val => {
      expect(val).toEqual({ total: 0, loaded: 0 });
    });
    error.subscribe(val => {
      expect(val).toBeUndefined();
    });

    // 200ms后依然为请求前状态
    await untilCbCalled(setTimeout, 200);
    loading.subscribe(val => {
      expect(val).toBeTruthy();
    });
    data.subscribe(val => {
      expect(val).toStrictEqual({});
    });
    downloading.subscribe(val => {
      expect(val).toEqual({ total: 0, loaded: 0 });
    });
    error.subscribe(val => {
      expect(val).toBeUndefined();
    });
  });
});
