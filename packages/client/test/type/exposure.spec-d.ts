import { createAlova } from 'alova';
import { usePagination, useRequest, useSSE } from 'alova/client';
import vueHook from 'alova/vue';
import { Ref } from 'vue';
import { AlovaSSEErrorEvent, AlovaSSEEvent, AlovaSSEMessageEvent } from '../../typings/clienthook/hooks/useSSE';

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

  test('useSSE', () => {
    const sseExposure = useSSE(Getter<number>, {
      immediate: false
    });
    type SSEExposure = typeof sseExposure;

    assertType<Ref<number>>(sseExposure.data);
    assertType<Ref<EventSource | undefined>>(sseExposure.eventSource);
    assertType<Ref<0 | 1 | 2>>(sseExposure.readyState);

    // 测试事件处理函数
    assertType<SSEExposure>(sseExposure.onOpen((_event: AlovaSSEEvent<any>) => {}));
    assertType<SSEExposure>(sseExposure.onMessage((_event: AlovaSSEMessageEvent<number, any>) => {}));
    assertType<SSEExposure>(sseExposure.onError((_event: AlovaSSEErrorEvent<any>) => {}));

    // 测试链式调用
    assertType<SSEExposure>(
      sseExposure
        .onOpen(() => {})
        .onMessage(() => {})
        .onError(() => {})
        .on('customEvent', () => {})
    );
  });
});
