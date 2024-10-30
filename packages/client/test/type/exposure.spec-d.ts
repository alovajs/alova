import vueHook from '@/statesHook/vue';
import { createAlova } from 'alova';
import { usePagination, useRequest } from 'alova/client';
import { Ref } from 'vue';

const emptyRequestAdapter = () => ({
  response: () => Promise.resolve({}),
  headers: () => Promise.resolve({}),
  abort: () => {}
});
const baseURL = process.env.NODE_BASE_URL;
const VueAlovaInst = createAlova({
  baseURL,
  statesHook: vueHook,
  cacheFor: null,
  requestAdapter: emptyRequestAdapter
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
      data: () => []
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
