import { createAlova } from 'alova';
import { usePagination, useRequest } from 'alova/client';
import GlobalFetch from 'alova/fetch';
import vueHook from 'alova/vue';
import { expectType } from 'root/testUtils';
import { Ref } from 'vue';

const VueAlovaInst = createAlova({
  statesHook: vueHook,
  requestAdapter: GlobalFetch()
});

const Getter = <T>() => VueAlovaInst.Get<T>('');

describe('hook exposure', () => {
  test('useRequest', () => {
    const useHookExposure = useRequest(Getter<number>, {
      immediate: false
    });
    type UseHookExposure = typeof useHookExposure;

    expectType<Ref<number>>(useHookExposure.data);
    expectType<Ref<number>>(useHookExposure.onSuccess(() => {}).data);
    expectType<UseHookExposure>(useHookExposure.onSuccess(() => {}));
    expectType<UseHookExposure>(
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

    expectType<Ref<number[]>>(paginationExposure.data);
    expectType<Ref<number[]>>(paginationExposure.onSuccess(() => {}).data);
    expectType<PaginationExposure>(paginationExposure.onSuccess(() => {}));
    expectType<PaginationExposure>(
      paginationExposure
        .onSuccess(() => {})
        .onSuccess(() => {})
        .onSuccess(() => {})
    );
  });
});
