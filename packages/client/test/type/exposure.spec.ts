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

const baseURL = process.env.NODE_BASE_URL;
const VueAlovaInst = createAlova({
  baseURL,
  statesHook: vueHook,
  requestAdapter: GlobalFetch()
});

const Getter = <T>() => VueAlovaInst.Get<T>('/unit-test');
const ArgsGetter = <Args extends unknown[], R = any>(...args: Args) =>
  VueAlovaInst.Get<R>('/unit-test', {
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

    // @ts-expect-error
    useRequestState.onError(e => expectType<123>(e.args));
    useRequestState.onError(e => expectType<[...Args, ...any]>(e.args));
    useRequestState.onComplete(e => expectType<[...Args, ...any]>(e.args));
    useRequestState.onSuccess(e => expectType<[...Args, ...any]>(e.args));
  });

  test('useWatcher', () => {
    const useWatcherState = useWatcher(ArgsGetter<Args, any>, [ref(123)]);
    expectAssignableBy<SendHandler<Args, any>>(useWatcherState.send);
    expectAssignableBy<SendHandler<ExtendedArgs, any>>(useWatcherState.send);
    // @ts-expect-error
    expectAssignableBy<SendHandler<NotMatchArgs, any>>(useWatcherState.send);
  });

  test('useSSE', () => {
    const useSSEState = useSSE(ArgsGetter<Args, any>);

    expectAssignableBy<SendHandler<Args, any>>(useSSEState.send);
    expectAssignableBy<SendHandler<ExtendedArgs, any>>(useSSEState.send);
    // @ts-expect-error
    expectAssignableBy<SendHandler<NotMatchArgs, any>>(useSSEState.send);

    // @ts-expect-error
    useSSEState.onError(e => expectType<123>(e.args));

    useSSEState.onMessage(e => expectType<[...Args, ...any]>(e.args));
    useSSEState.onOpen(e => expectType<[...Args, ...any]>(e.args));
    useSSEState.onError(e => expectType<[...Args, ...any]>(e.args));
  });

  test('useForm', () => {
    interface Info {
      name: string;
      age: number;
    }
    const useFormState = useForm(
      (form, ...args: Args) => {
        expectType<Info>(form);
        return VueAlovaInst.Get('/unit-test');
      },
      {
        initialForm: {} as Info
      }
    );
    expectAssignableBy<SendHandler<Args, any>>(useFormState.send);
    expectAssignableBy<SendHandler<ExtendedArgs, any>>(useFormState.send);
    // @ts-expect-error
    expectAssignableBy<SendHandler<NotMatchArgs, any>>(useFormState.send);
  });

  test('useCaptcha', () => {
    const useCaptchaState = useCaptcha(ArgsGetter<Args, any>);
    expectAssignableBy<SendHandler<Args, any>>(useCaptchaState.send);
    expectAssignableBy<SendHandler<ExtendedArgs, any>>(useCaptchaState.send);
    // @ts-expect-error
    expectAssignableBy<SendHandler<NotMatchArgs, any>>(useCaptchaState.send);
  });

  test('useRetriable', () => {
    const useRetriableState = useRetriableRequest(ArgsGetter<Args, any>);
    expectAssignableBy<SendHandler<Args, any>>(useRetriableState.send);
    expectAssignableBy<SendHandler<ExtendedArgs, any>>(useRetriableState.send);
    // @ts-expect-error
    expectAssignableBy<SendHandler<NotMatchArgs, any>>(useRetriableState.send);
  });

  test('usePagination', () => {
    const usePaginationState = usePagination((page, pageSize, name?: string) =>
      VueAlovaInst.Get(`/unit-test?${page} ${pageSize}`)
    );

    expectAssignableBy<SendHandler<[number, number], any>>(usePaginationState.send);
    expectAssignableBy<SendHandler<[number, number, string], any>>(usePaginationState.send);
    expectAssignableBy<SendHandler<[number, number, string, 123, 345], any>>(usePaginationState.send);
    // @ts-expect-error
    expectAssignableBy<SendHandler<[string, number], any>>(usePaginationState.send);

    usePaginationState.onFetchError(e => expectType<[number, number, name?: string | undefined, ...any]>(e.args));
    usePaginationState.onFetchComplete(e => expectType<[number, number, name?: string | undefined, ...any]>(e.args));
    usePaginationState.onFetchSuccess(e => expectType<[number, number, name?: string | undefined, ...any]>(e.args));
  });

  test('middleware', () => {
    useRequest(ArgsGetter<Args, any>, {
      middleware: (ctx, next) => {
        expectType<[...Args, ...any]>(ctx.args);
        next({
          force: event => expectType<[...Args, ...any]>(event.args) as unknown as boolean
        });
      }
    });
  });
});
