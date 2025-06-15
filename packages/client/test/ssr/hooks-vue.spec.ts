import { getAlovaInstance } from '#/utils';
import { usePagination, useRequest, useWatcher } from '@/index';
import VueHook from '@/statesHook/vue';
import { Result, delay } from 'root/testUtils';
import { ref } from 'vue';

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

  test('should `useRequest` receive all exposures in promise after request', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const { loading, data, error, uploading, downloading, update, abort, send } = await useRequest(
      alova.Get<Result>('/unit-test', {
        params: { a: 'a', b: 'str' }
      })
    );
    expect(loading.value).toBeFalsy();
    expect(data.value.code).toBe(200);
    expect(data.value.data.method).toBe('GET');
    expect(data.value.data.params).toStrictEqual({
      a: 'a',
      b: 'str'
    });
    expect(data.value.data.path).toBe('/unit-test');
    expect(error.value).toBeUndefined();
    expect(uploading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(downloading.value).toStrictEqual({ total: 0, loaded: 0 });
    expect(update).toBeInstanceOf(Function);
    expect(abort).toBeInstanceOf(Function);
    expect(send).toBeInstanceOf(Function);

    await expect(useRequest(alova.Get<Result>('/unit-test-error'))).rejects.toThrowError('Failed to fetch');
  });

  test('should `useWatcher` receive all exposures in promise after request', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const { loading, data, error } = await useWatcher(
      alova.Get<Result>('/unit-test', {
        params: { a: '123', b: 'str' }
      }),
      [ref(1)],
      {
        immediate: true
      }
    );
    expect(loading.value).toBeFalsy();
    expect(data.value.code).toBe(200);
    expect(data.value.data.method).toBe('GET');
    expect(data.value.data.params).toStrictEqual({
      a: '123',
      b: 'str'
    });
    expect(data.value.data.path).toBe('/unit-test');
    expect(error.value).toBeUndefined();

    await expect(
      useWatcher(alova.Get<Result>('/unit-test-error'), [ref(1)], {
        immediate: true
      })
    ).rejects.toThrowError('Failed to fetch');
  });

  test("shouldn't request when `immediate` set to false", async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const { loading, data, error } = await useRequest(alova.Get<Result>('/unit-test'), {
      immediate: false
    });
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    const {
      loading: loading2,
      data: data2,
      error: error2
    } = await useWatcher(alova.Get<Result>('/unit-test'), [ref(1)], {
      immediate: false
    });
    expect(loading2.value).toBeFalsy();
    expect(data2.value).toBeUndefined();
    expect(error2.value).toBeUndefined();
  });

  test('should `usePagination` request with `await`', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const { loading, data, error, pageCount, total } = await usePagination(
      (page, pageSize) =>
        alova.Get<Result>('/unit-test', {
          params: { page, pageSize }
        }),
      {
        data: () => [1, 2, 3] as number[],
        total: () => 92
      }
    );
    expect(loading.value).toBeFalsy();
    expect(data.value).toStrictEqual([1, 2, 3]);
    expect(error.value).toBeUndefined();
    expect(pageCount.value).toBe(Math.ceil(92 / 10));
    expect(total.value).toBe(92);
  });

  test('should `useAutoRequest` request with `await`', async () => {
    const alova = getAlovaInstance(VueHook, {
      responseExpect: r => r.json()
    });
    const { loading, data, error, pageCount, total } = await usePagination(
      (page, pageSize) =>
        alova.Get<Result>('/unit-test', {
          params: { page, pageSize }
        }),
      {
        data: () => [1, 2, 3] as number[],
        total: () => 92
      }
    );
    expect(loading.value).toBeFalsy();
    expect(data.value).toStrictEqual([1, 2, 3]);
    expect(error.value).toBeUndefined();
    expect(pageCount.value).toBe(Math.ceil(92 / 10));
    expect(total.value).toBe(92);
  });
});
