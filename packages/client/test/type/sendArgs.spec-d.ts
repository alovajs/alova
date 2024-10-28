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
import adapterFetch from 'alova/fetch';
import vueHook from 'alova/vue';
import { expectAssignableBy } from 'root/testUtils';
import { ref } from 'vue';

const baseURL = process.env.NODE_BASE_URL;
const VueAlovaInst = createAlova({
  baseURL,
  statesHook: vueHook,
  requestAdapter: adapterFetch()
});
const ArgsGetter = <Args extends unknown[], R = any>(...args: Args) =>
  VueAlovaInst.Get<R>('/unit-test', {
    params: {
      args
    }
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
    useRequestState.onError(e => assertType<123>(e.args));
    useRequestState.onError(e => assertType<[...Args, ...any]>(e.args));
    useRequestState.onComplete(e => assertType<[...Args, ...any]>(e.args));
    useRequestState.onSuccess(e => assertType<[...Args, ...any]>(e.args));
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
    useSSEState.onError(e => assertType<123>(e.args));

    useSSEState.onMessage(e => assertType<[...Args, ...any]>(e.args));
    useSSEState.onOpen(e => assertType<[...Args, ...any]>(e.args));
    useSSEState.onError(e => assertType<[...Args, ...any]>(e.args));
  });

  test('useForm', () => {
    interface Info {
      name: string;
      age: number;
    }
    const useFormState = useForm(
      (form, ...args: Args) => {
        assertType<Info>(form);
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
    const useRetriableState = useRetriableRequest(ArgsGetter<Args, any>, {
      immediate: false
    });
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

    usePaginationState.onFetchError(e => assertType<[number, number, name?: string | undefined, ...any]>(e.args));
    usePaginationState.onFetchComplete(e => assertType<[number, number, name?: string | undefined, ...any]>(e.args));
    usePaginationState.onFetchSuccess(e => assertType<[number, number, name?: string | undefined, ...any]>(e.args));
  });

  test('middleware', () => {
    useRequest(ArgsGetter<Args, any>, {
      middleware: (ctx, next) => {
        assertType<[...Args, ...any]>(ctx.args);
        next({
          force: event => assertType<[...Args, ...any]>(event.args) as unknown as boolean
        });
      }
    });
  });
});
