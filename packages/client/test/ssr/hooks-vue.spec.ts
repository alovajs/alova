import { getAlovaInstance } from '#/utils';
import { useRequest } from '@/index';
import VueHook from '@/statesHook/vue';
import { delay, Result } from 'root/testUtils';

// use hook no longer sends requests on the server side
describe('[vue]use hooks in SSR', () => {
  test("shouldn't request but loading is true", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
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

    // It will still be in the pre-request state after 200ms.
    await delay(200);
    expect(loading.value).toBeTruthy();
    expect(data.value).toStrictEqual({});
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
  });
});
