import { createAlova } from 'alova';
import { usePagination, useRequest } from 'alova/client';
import adapterFetch from 'alova/fetch';
import vueHook from 'alova/vue';
import { Ref } from 'vue';

const baseURL = process.env.NODE_BASE_URL;
const VueAlovaInst = createAlova({
  baseURL,
  statesHook: vueHook,
  requestAdapter: adapterFetch()
});

const Getter = <T>() => VueAlovaInst.Get<T>('/unit-test');

describe('hook exposure', () => {
  test('useRequest', () => {
    const useHookExposure = useRequest(Getter<number>, {
      immediate: false
    });
    type UseHookExposure = typeof useHookExposure;

    assertType<Ref<number>>(useHookExposure.data);
    assertType<Ref<number>>(useHookExposure.onSuccess(() => {}).data);
    assertType<UseHookExposure>(useHookExposure.onSuccess(() => {}));
    assertType<UseHookExposure>(
      useHookExposure
        .onSuccess(() => {})
        .onSuccess(() => {})
        .onSuccess(() => {})
    );
  });

  test('usePagination', () => {
    const paginationExposure = usePagination(Getter<{ data: number[] }>, {
      data: r => r.data
    });
    type PaginationExposure = typeof paginationExposure;

    assertType<Ref<number[]>>(paginationExposure.data);
    assertType<Ref<number[]>>(paginationExposure.onSuccess(() => {}).data);
    assertType<PaginationExposure>(paginationExposure.onSuccess(() => {}));
    assertType<PaginationExposure>(
      paginationExposure
        .onSuccess(() => {})
        .onSuccess(() => {})
        .onSuccess(() => {})
    );
  });
});
