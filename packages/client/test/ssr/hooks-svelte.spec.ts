import { getAlovaInstance } from '#/utils';
import { useRequest } from '@/index';
import SvelteHook from '@/statesHook/svelte';
import { delay, Result } from 'root/testUtils';

// use hook no longer sends requests on the server side
describe('[svelte]use hooks in SSR', () => {
  test("shouldn't request but loading is true", async () => {
    const alova = getAlovaInstance(SvelteHook, {
      responseExpect: r => r.json()
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

    // It will still be in the pre-request state after 200ms.
    await delay(200);
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
