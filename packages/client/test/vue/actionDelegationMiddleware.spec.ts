import { accessAction, actionDelegationMiddleware } from '@/index';
import { createAlova } from 'alova';
import { FetcherType, useFetcher, useRequest, useWatcher } from 'alova/client';
import VueHook from 'alova/vue';
import { untilCbCalled } from 'root/testUtils';
import { ref } from 'vue';
import { mockRequestAdapter } from '~/test/mockData';

const alovaInst = createAlova({
  baseURL: 'http://localhost:8080',
  statesHook: VueHook,
  requestAdapter: mockRequestAdapter,
  cacheLogger: false
});
describe('vue => subscriber middleware', () => {
  test('should send by notification with keyword string', async () => {
    const methodInstance = (data: any) =>
      alovaInst.Post('/detail2', data, {
        localCache: 0
      });

    const { loading, data, onSuccess, onComplete } = useRequest(methodInstance, {
      middleware: actionDelegationMiddleware('abc')
    });
    const successFn = jest.fn();
    const completeFn = jest.fn();
    await untilCbCalled(setTimeout, 50);
    expect(loading.value).toBeTruthy();
    onSuccess(successFn);
    onComplete(completeFn);

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toStrictEqual({ id: 10 });
    expect(successFn).toHaveBeenCalledTimes(1);
    expect(completeFn).toHaveBeenCalledTimes(1);

    await new Promise<void>(resolve => {
      accessAction('abc', async ({ send, update, abort }) => {
        expect(update).toBeInstanceOf(Function);
        expect(abort).toBeInstanceOf(Function);
        resolve(send({ name: 'aa' }));
      });
    });
    expect(data.value).toStrictEqual({ id: 10, name: 'aa' });
    expect(successFn).toHaveBeenCalledTimes(2);
    expect(completeFn).toHaveBeenCalledTimes(2);
  });

  test('should send by notification with keyword symbol', async () => {
    const methodInstance = (data: any) =>
      alovaInst.Post('/detail2', data, {
        localCache: 0
      });

    const sym = Symbol('test');
    const { loading, data, onSuccess, onComplete } = useRequest(methodInstance, {
      middleware: actionDelegationMiddleware(sym)
    });
    const successFn = jest.fn();
    const completeFn = jest.fn();
    await untilCbCalled(setTimeout, 50);
    expect(loading.value).toBeTruthy();
    onSuccess(successFn);
    onComplete(completeFn);

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toStrictEqual({ id: 10 });
    expect(successFn).toHaveBeenCalledTimes(1);
    expect(completeFn).toHaveBeenCalledTimes(1);

    await new Promise<void>(resolve => {
      accessAction(sym, async ({ send }) => {
        resolve(send({ name: 'aa' }));
      });
    });
    expect(data.value).toStrictEqual({ id: 10, name: 'aa' });
    expect(successFn).toHaveBeenCalledTimes(2);
    expect(completeFn).toHaveBeenCalledTimes(2);
  });

  test('should send by notification with keyword number', async () => {
    const methodInstance = (data: any) =>
      alovaInst.Post('/detail2', data, {
        localCache: 0
      });

    const num = 123;
    const { loading, data, onSuccess, onComplete } = useRequest(methodInstance, {
      middleware: actionDelegationMiddleware(num)
    });
    const successFn = jest.fn();
    const completeFn = jest.fn();
    await untilCbCalled(setTimeout, 50);
    expect(loading.value).toBeTruthy();
    onSuccess(successFn);
    onComplete(completeFn);

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toStrictEqual({ id: 10 });
    expect(successFn).toHaveBeenCalledTimes(1);
    expect(completeFn).toHaveBeenCalledTimes(1);

    await new Promise<void>(resolve => {
      accessAction(num, async ({ send }) => {
        resolve(send({ name: 'aa' }));
      });
    });
    expect(data.value).toStrictEqual({ id: 10, name: 'aa' });
    expect(successFn).toHaveBeenCalledTimes(2);
    expect(completeFn).toHaveBeenCalledTimes(2);
  });

  test('should send multiple request by notification', async () => {
    const methodInstance = (data: any) =>
      alovaInst.Post('/detail2', data, {
        localCache: 0
      });

    const str = 'zzz';
    const state1 = useRequest(methodInstance, {
      middleware: actionDelegationMiddleware(str)
    });
    const state2 = useRequest(methodInstance, {
      middleware: actionDelegationMiddleware(str)
    });
    const data1 = state1.data;
    const data2 = state2.data;
    const successFn = jest.fn();
    const completeFn = jest.fn();
    state1.onSuccess(successFn);
    state1.onComplete(completeFn);
    state2.onSuccess(successFn);
    state2.onComplete(completeFn);

    await Promise.all([untilCbCalled(state1.onSuccess), untilCbCalled(state2.onSuccess)]);
    expect(successFn).toHaveBeenCalledTimes(2);
    expect(completeFn).toHaveBeenCalledTimes(2);

    const senders = [] as Promise<any>[];
    accessAction(str, async ({ send }, index) => {
      senders.push(send({ name: 'aa' + index }));
    });
    await Promise.all(senders);
    expect(data1.value).toStrictEqual({ id: 10, name: 'aa0' });
    expect(data2.value).toStrictEqual({ id: 10, name: 'aa1' });
    expect(successFn).toHaveBeenCalledTimes(4);
    expect(completeFn).toHaveBeenCalledTimes(4);
  });

  test('should send multiple request by notification', async () => {
    const methodInstance = (data: any) =>
      alovaInst.Post('/detail2', data, {
        localCache: 0
      });

    const state1 = useRequest(methodInstance, {
      middleware: actionDelegationMiddleware('aaa-1')
    });
    const state2 = useRequest(methodInstance, {
      middleware: actionDelegationMiddleware('aaa-2')
    });
    const data1 = state1.data;
    const data2 = state2.data;
    const successFn = jest.fn();
    const completeFn = jest.fn();
    state1.onSuccess(successFn);
    state1.onComplete(completeFn);
    state2.onSuccess(successFn);
    state2.onComplete(completeFn);

    await Promise.all([untilCbCalled(state1.onSuccess), untilCbCalled(state2.onSuccess)]);
    expect(successFn).toHaveBeenCalledTimes(2);
    expect(completeFn).toHaveBeenCalledTimes(2);

    const senders = [] as Promise<any>[];
    accessAction(/^aaa/, async ({ send }, index) => {
      senders.push(send({ name: 'aa' + index }));
    });
    await Promise.all(senders);
    expect(data1.value).toStrictEqual({ id: 10, name: 'aa0' });
    expect(data2.value).toStrictEqual({ id: 10, name: 'aa1' });
    expect(successFn).toHaveBeenCalledTimes(4);
    expect(completeFn).toHaveBeenCalledTimes(4);
  });

  test('should throws a error when not match any handler', () => {
    expect(() => {
      accessAction('not_match', () => {});
    }).toThrow('[alova/subscriber]no handler which id is `not_match` is matched');
  });

  test("should throws a error when hasn't send request", () => {
    const methodInstance = (data: any) =>
      alovaInst.Post('/detail2', data, {
        localCache: 0
      });

    useRequest(methodInstance, {
      middleware: actionDelegationMiddleware('not_match2'),
      immediate: false
    });
    expect(() => {
      accessAction('not_match2', () => {});
    }).toThrow('[alova/subscriber]no handler which id is `not_match2` is matched');
  });

  test('should send by notification when use useWatcher', async () => {
    const methodInstance = (data: any) =>
      alovaInst.Post('/detail2', data, {
        localCache: 0
      });

    const num = ref(1);
    const { loading, data, onSuccess, onComplete } = useWatcher(methodInstance, [num], {
      middleware: actionDelegationMiddleware('watcher-aaa'),
      immediate: true
    });
    const successFn = jest.fn();
    const completeFn = jest.fn();
    await untilCbCalled(setTimeout, 50);
    expect(loading.value).toBeTruthy();
    onSuccess(successFn);
    onComplete(completeFn);

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toStrictEqual({ id: 10 });
    expect(successFn).toHaveBeenCalledTimes(1);
    expect(completeFn).toHaveBeenCalledTimes(1);

    await new Promise<void>(resolve => {
      accessAction('watcher-aaa', async ({ send }) => {
        resolve(send({ name: 'watcher-aaa' }));
      });
    });
    expect(data.value).toStrictEqual({ id: 10, name: 'watcher-aaa' });
    expect(successFn).toHaveBeenCalledTimes(2);
    expect(completeFn).toHaveBeenCalledTimes(2);
  });

  test('should fetch data by notification when use useFetcher', async () => {
    const methodInstance = (data: any) =>
      alovaInst.Post('/detail2', data, {
        localCache: 0
      });

    const { fetch, onSuccess, onComplete } = useFetcher<FetcherType<typeof alovaInst>>({
      middleware: actionDelegationMiddleware('fetcher-aaa')
    });

    const successFn = jest.fn();
    const completeFn = jest.fn();
    onSuccess(successFn);
    onComplete(completeFn);
    fetch(methodInstance({ fetch: 1 }));

    await untilCbCalled(onSuccess);
    expect(successFn).toHaveBeenCalledTimes(1);
    expect(completeFn).toHaveBeenCalledTimes(1);

    accessAction('fetcher-aaa', async ({ fetch }) => {
      fetch(methodInstance({ fetch: 'fetcher-aaa' }));
    });

    await untilCbCalled(onSuccess);
    expect(successFn).toHaveBeenCalledTimes(2);
    expect(completeFn).toHaveBeenCalledTimes(2);
  });
});
