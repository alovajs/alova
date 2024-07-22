import { mockRequestAdapter } from '#/mockData';
import { GlobalSQFailEvent, ScopedSQRetryEvent } from '@/event';
import { SilentMethod } from '@/hooks/silent/SilentMethod';
import { setSilentFactoryStatus } from '@/hooks/silent/globalVariables';
import {
  bootSilentFactory,
  onSilentSubmitError,
  onSilentSubmitFail,
  onSilentSubmitSuccess
} from '@/hooks/silent/silentFactory';
import { pushNewSilentMethod2Queue } from '@/hooks/silent/silentQueue';
import createVirtualResponse from '@/hooks/silent/virtualResponse/createVirtualResponse';
import createEventManager from '@alova/shared/createEventManager';
import { usePromise } from '@alova/shared/function';
import { Method, createAlova } from 'alova';
import VueHook from 'alova/vue';
import { delay } from 'root/testUtils';
import { ScopedSQEvents } from '~/typings/clienthook';

// 每次需重置状态，因为上一个用例可能因为失败而被设置为2，导致下面的用例不运行
beforeEach(() => setSilentFactoryStatus(0));
describe('silent method request in queue with silent behavior', () => {
  test("it wouldn't retry when request is success", async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const fallbackMockFn = jest.fn();
    const retryMockFn = jest.fn();
    const methodInstance = new Method('POST', alovaInst, '/detail');

    const { promise: pms, resolve } = usePromise<void>();
    const virtualResponse = createVirtualResponse({
      id: ''
    });
    const emitter = createEventManager<ScopedSQEvents<any>>();
    emitter.on('fallback', fallbackMockFn);
    emitter.on('retry', retryMockFn);
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      emitter,
      undefined,
      undefined,
      /.*/,
      2,
      {
        delay: 50
      },
      value => resolve(value)
    );
    silentMethodInstance.virtualResponse = virtualResponse;
    await pushNewSilentMethod2Queue(silentMethodInstance, false);

    // 启动silentFactory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    const successMockFn = jest.fn();
    const offSuccess = onSilentSubmitSuccess(event => {
      successMockFn(event);
      // 卸载全局事件避免污染其他用例
      offSuccess();
    });

    await pms;
    await delay(); // 由于silentMethod成功事件比全局的silentSubmitSuccess事件先触发，所以需要延迟一下

    // 成功了，onFallback和onRetry都不会触发
    expect(fallbackMockFn).not.toHaveBeenCalled();
    expect(retryMockFn).not.toHaveBeenCalled();

    expect(successMockFn).toHaveBeenCalledTimes(1);
    const globalSuccessEvent = successMockFn.mock.calls[0][0];
    expect(globalSuccessEvent.behavior).toBe('silent');
    expect(globalSuccessEvent.data).toStrictEqual({ id: 1 });
    expect(globalSuccessEvent.method).toBe(methodInstance);
    expect(globalSuccessEvent.silentMethod).toBeInstanceOf(SilentMethod);
    expect(globalSuccessEvent.retryTimes).toBe(0);
  });

  test('should emit success and not emit fallback after retry one times and success', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const fallbackMockFn = jest.fn();
    const retryMockFn = jest.fn();
    const methodInstance = new Method('POST', alovaInst, '/detail-error', undefined, {
      id: 'a',
      failTimes: 1
    });

    const { promise: pms, resolve } = usePromise<void>();
    const virtualResponse = createVirtualResponse({
      id: ''
    });
    const emitter = createEventManager<ScopedSQEvents<any>>();
    emitter.on('fallback', fallbackMockFn);
    emitter.on('retry', retryMockFn);
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      emitter,
      undefined,
      undefined,
      /^no permission$/,
      2,
      {
        delay: 50
      },
      value => resolve(value)
    );
    silentMethodInstance.virtualResponse = virtualResponse;
    await pushNewSilentMethod2Queue(silentMethodInstance, false, 't1'); // 多个用例需要分别放到不同队列，否则会造成冲突

    // 启动silentFactory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    const successMockFn = jest.fn();
    onSilentSubmitSuccess(() => {
      successMockFn();
    });

    await pms;
    await delay(); // 由于silentMethod成功事件比全局的silentSubmitSuccess事件先触发，所以需要延迟一下

    // 成功了，onFallback和onRetry都不会触发
    expect(fallbackMockFn).toHaveBeenCalledTimes(0);
    expect(retryMockFn).toHaveBeenCalledTimes(1);
    expect(successMockFn).toHaveBeenCalledTimes(1);
  });

  test('should emit fallback event when retry times are reached', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const fallbackMockFn = jest.fn();
    const retryMockFn = jest.fn();
    const executeOrder = [] as string[]; // 用于记录执行顺序，后续验证
    const methodInstance = new Method('POST', alovaInst, '/detail-error', {}, { id: 'b' });
    const { promise: pms, resolve } = usePromise<void>();
    const virtualResponse = createVirtualResponse({
      id: ''
    });
    const emitter = createEventManager<ScopedSQEvents<any>>();
    emitter.on('fallback', () => {
      fallbackMockFn();
      executeOrder.push('fallback');
      resolve();
    });
    emitter.on('retry', event => {
      executeOrder.push(`retried_${event.retryTimes}`);
      retryMockFn();

      expect(event).toBeInstanceOf(ScopedSQRetryEvent);
      expect(event.behavior).toBe('silent');
      expect(event.method).toBe(methodInstance);
      // eslint-disable-next-line
      expect(event.silentMethod).toBe(silentMethodInstance);
      expect(event.retryTimes).toBeLessThanOrEqual(2);
      expect(event.retryDelay).toBe(50);
    });
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      emitter,
      undefined,
      undefined,
      {
        name: /^403$/
      },
      2,
      {
        delay: 50
      }
    );
    silentMethodInstance.virtualResponse = virtualResponse;
    await pushNewSilentMethod2Queue(silentMethodInstance, false, 't2');

    // 启动silentFactory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    const errorMockFn = jest.fn();
    const offError = onSilentSubmitError(event => {
      errorMockFn();
      expect(event.queueName).toBe('t2');
      expect(event.behavior).toBe('silent');
      expect(event.error.message).toBe('no permission');
      expect(event.method).toBe(methodInstance);
      expect(event.silentMethod).toBeInstanceOf(SilentMethod);
      expect(event.retryTimes).toBeLessThanOrEqual(2);
    });
    const failMockFn = jest.fn();
    const offFail = onSilentSubmitFail(event => {
      failMockFn();
      expect(event.queueName).toBe('t2');
      expect(event).toBeInstanceOf(GlobalSQFailEvent);
      expect(event.behavior).toBe('silent');
      expect(event.error.message).toBe('no permission');
      expect(event.method).toBe(methodInstance);
      expect(event.silentMethod).toBeInstanceOf(SilentMethod);
      expect(event.retryTimes).toBe(2);
    });

    await pms;
    // 有fallback回调时，不会触发nextRound
    expect(fallbackMockFn).toHaveBeenCalledTimes(1);
    expect(retryMockFn).toHaveBeenCalledTimes(2);
    expect(errorMockFn).toHaveBeenCalledTimes(3); // 每次请求错误都会调用
    expect(failMockFn).toHaveBeenCalledTimes(1);
    expect(executeOrder).toEqual(['retried_1', 'retried_2', 'fallback']);
    // 卸载全局事件避免污染其他用例
    offError();
    offFail();
  });

  test('should emit global error event and never retry when retryError not match error message', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const fallbackMockFn = jest.fn();
    const retryMockFn = jest.fn();
    const methodInstance = new Method('POST', alovaInst, '/detail-error', {}, { id: 'c' });
    const { promise: pms, resolve } = usePromise<void>();
    const virtualResponse = createVirtualResponse({
      id: ''
    });
    const emitter = createEventManager<ScopedSQEvents<any>>();
    emitter.on('fallback', () => {
      fallbackMockFn();
      resolve();
    });
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      emitter,
      undefined,
      undefined,
      /api not found/,
      4,
      { delay: 50 }
    );
    silentMethodInstance.virtualResponse = virtualResponse;
    await pushNewSilentMethod2Queue(silentMethodInstance, false, 't3');

    // 启动silentFactory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    await pms;
    expect(fallbackMockFn).toHaveBeenCalledTimes(1);
    // 失败错误未匹配retryError，因此不会重试，直接调用fallback
    expect(retryMockFn).toHaveBeenCalledTimes(0);
  });

  test('should catch the error that throws in responded interception', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      responded: () => {
        throw new Error('custom error');
      },
      cacheLogger: false
    });

    const fallbackMockFn = jest.fn();
    const retryMockFn = jest.fn();
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const { promise: pms, resolve } = usePromise<void>();
    const virtualResponse = createVirtualResponse({
      id: ''
    });
    const emitter = createEventManager<ScopedSQEvents<any>>();
    emitter.on('fallback', () => {
      fallbackMockFn();
      resolve();
    });
    emitter.on('retry', retryMockFn);
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      emitter,
      undefined,
      undefined,
      /^custom error$/,
      2,
      {
        delay: 50
      }
    );
    silentMethodInstance.virtualResponse = virtualResponse;
    await pushNewSilentMethod2Queue(silentMethodInstance, false, 't4'); // 多个用例需要分别放到不同队列，否则会造成冲突

    // 启动silentFactory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    await pms;
    expect(fallbackMockFn).toHaveBeenCalledTimes(1);
    expect(retryMockFn).toHaveBeenCalledTimes(2);
  });

  test('should multiple times delay request with multiplier set', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const fallbackMockFn = jest.fn();
    const retryMockFn = jest.fn();
    const methodInstance = new Method('POST', alovaInst, '/detail-error');
    const { promise: pms, resolve } = usePromise<void>();
    const virtualResponse = createVirtualResponse({
      id: ''
    });
    const emitter = createEventManager<ScopedSQEvents<any>>();
    emitter.on('fallback', () => {
      fallbackMockFn();
      resolve();
    });
    emitter.on('retry', event => {
      retryMockFn();
      expect(event.retryDelay).toBe(50 * 2 ** (event.retryTimes - 1));
    });
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent', emitter, undefined, undefined, /.*/, 2, {
      delay: 50,
      multiplier: 2
    });
    silentMethodInstance.virtualResponse = virtualResponse;
    await pushNewSilentMethod2Queue(silentMethodInstance, false, 't5');
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    await pms;
    expect(fallbackMockFn).toHaveBeenCalledTimes(1);
    expect(retryMockFn).toHaveBeenCalledTimes(2);
  });

  test('should add 0 to endQuiver random delay when only set endQuiver', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const fallbackMockFn = jest.fn();
    const retryMockFn = jest.fn();
    const methodInstance = new Method(
      'POST',
      alovaInst,
      '/detail-error',
      {},
      {
        id: 'f'
      }
    );
    const { promise: pms, resolve } = usePromise<void>();
    const emitter = createEventManager<ScopedSQEvents<any>>();
    emitter.on('fallback', () => {
      fallbackMockFn();
      resolve();
    });
    emitter.on('retry', event => {
      retryMockFn();
      expect(event.retryDelay).toBeGreaterThanOrEqual(50);
      // eslint-disable-next-line
      expect(event.retryDelay).toBeLessThanOrEqual(50 + 50 * (silentMethodInstance.backoff?.endQuiver || 0));
    });
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent', emitter, undefined, undefined, /.*/, 2, {
      delay: 50,
      endQuiver: 0.6
    });
    await pushNewSilentMethod2Queue(silentMethodInstance, false, 't6');
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    await pms;
  });

  test('should add startQuiver to 1 random delay when only set startQuiver', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const fallbackMockFn = jest.fn();
    const retryMockFn = jest.fn();
    const methodInstance = new Method('POST', alovaInst, '/detail-error', {}, { id: 'g' });
    const { promise: pms, resolve } = usePromise<void>();
    const emitter = createEventManager<ScopedSQEvents<any>>();
    emitter.on('fallback', () => {
      fallbackMockFn();
      resolve();
    });
    emitter.on('retry', event => {
      retryMockFn();
      // eslint-disable-next-line
      expect(event.retryDelay).toBeGreaterThanOrEqual(50 + (silentMethodInstance.backoff?.startQuiver || 0));
      expect(event.retryDelay).toBeLessThanOrEqual(50 + 50 * 1);
    });
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent', emitter, undefined, undefined, /.*/, 2, {
      delay: 50,
      startQuiver: 0.4
    });
    await pushNewSilentMethod2Queue(silentMethodInstance, false, 't7');
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });
    await pms;
  });

  test('should add startQuiver to endQuiver random delay when set startQuiver and endQuiver at the same time', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const methodInstance = new Method('POST', alovaInst, '/detail-error', {}, { id: 'hh' });
    const { promise: pms, resolve } = usePromise<void>();
    const emitter = createEventManager<ScopedSQEvents<any>>();
    emitter.on('fallback', () => {
      resolve();
    });
    emitter.on('retry', event => {
      /* eslint-disable */
      expect(event.retryDelay).toBeGreaterThanOrEqual(50 + (silentMethodInstance.backoff?.startQuiver || 0));
      expect(event.retryDelay).toBeLessThanOrEqual(50 + 50 * (silentMethodInstance.backoff?.endQuiver || 0));
      /* eslint-enable */
    });
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent', emitter, undefined, undefined, /.*/, 2, {
      delay: 50,
      startQuiver: 0.4,
      endQuiver: 0.6
    });
    await pushNewSilentMethod2Queue(silentMethodInstance, false, 't8');
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });
    await pms;
  });
});
