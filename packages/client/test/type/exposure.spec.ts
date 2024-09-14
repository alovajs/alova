/* eslint-disable @typescript-eslint/no-unused-vars */
import { createAlova } from 'alova';
import {
  SendHandler,
  useCaptcha,
  useForm,
  usePagination,
  useRequest,
  useRetriableRequest,
  useSSE,
  useWatcher
} from 'alova/client';
import GlobalFetch from 'alova/fetch';
import vueHook from 'alova/vue';
import { expectAssignableBy, expectType } from 'root/testUtils';
import { ref, Ref } from 'vue';

const VueAlovaInst = createAlova({
  statesHook: vueHook,
  requestAdapter: GlobalFetch()
});

const Getter = <T>() => VueAlovaInst.Get<T>('');
const ArgsGetter = <Args extends unknown[], R = any>(...args: Args) =>
  VueAlovaInst.Get<R>('', {
    params: {
      args
    }
  });

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

describe('send args', () => {
  type Args = [number, string, boolean];
  type ExtendedArgs = [...Args, number, string];
  type NotMatchArgs = [1, 2, 3];

  test('useRequest', () => {
    const useRequestState = useRequest(ArgsGetter<Args, any>);
    expectAssignableBy<SendHandler<Args, any>>(useRequestState.send);
    expectAssignableBy<SendHandler<ExtendedArgs, any>>(useRequestState.send);
    // @ts-expect-error
    expectAssignableBy<SendHandler<NotMatchArgs, any>>(useRequestState.send);
  });

  test('useWatcher', () => {
    const useWatcherState = useWatcher(ArgsGetter<Args, any>, [ref(123)]);
    expectAssignableBy<SendHandler<Args, any>>(useWatcherState.send);
    expectAssignableBy<SendHandler<ExtendedArgs, any>>(useWatcherState.send);
    // @ts-expect-error
    expectAssignableBy<SendHandler<NotMatchArgs, any>>(useWatcherState.send);
  });

  test('useSSE', () => {
    const useWatcherState = useSSE(ArgsGetter<Args, any>);
    expectAssignableBy<SendHandler<Args, any>>(useWatcherState.send);
    expectAssignableBy<SendHandler<ExtendedArgs, any>>(useWatcherState.send);
    // @ts-expect-error
    expectAssignableBy<SendHandler<NotMatchArgs, any>>(useWatcherState.send);
  });

  test('useForm', () => {
    const useWatcherState = useForm((form: {}, ...args: Args) => VueAlovaInst.Get(''));
    expectAssignableBy<SendHandler<Args, any>>(useWatcherState.send);
    expectAssignableBy<SendHandler<ExtendedArgs, any>>(useWatcherState.send);
    // @ts-expect-error
    expectAssignableBy<SendHandler<NotMatchArgs, any>>(useWatcherState.send);
  });

  test('useCaptcha', () => {
    const useWatcherState = useCaptcha(ArgsGetter<Args, any>);
    expectAssignableBy<SendHandler<Args, any>>(useWatcherState.send);
    expectAssignableBy<SendHandler<ExtendedArgs, any>>(useWatcherState.send);
    // @ts-expect-error
    expectAssignableBy<SendHandler<NotMatchArgs, any>>(useWatcherState.send);
  });

  test('useRetriable', () => {
    const useWatcherState = useRetriableRequest(ArgsGetter<Args, any>);
    expectAssignableBy<SendHandler<Args, any>>(useWatcherState.send);
    expectAssignableBy<SendHandler<ExtendedArgs, any>>(useWatcherState.send);
    // @ts-expect-error
    expectAssignableBy<SendHandler<NotMatchArgs, any>>(useWatcherState.send);
  });

  test('usePagination', () => {
    const usePaginationState = usePagination((page, pageSize) => VueAlovaInst.Get(`${page} ${pageSize}`));

    expectAssignableBy<SendHandler<[number, number], any>>(usePaginationState.send);
    // @ts-expect-error
    expectAssignableBy<SendHandler<[string, number], any>>(usePaginationState.send);
  });
});
