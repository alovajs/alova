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
import VueHook from '@/statesHook/vue';
import { createEventManager, usePromise } from '@alova/shared';
import { Method, createAlova } from 'alova';
import { delay } from 'root/testUtils';
import { ScopedSQEvents } from '~/typings/clienthook';

// The status needs to be reset each time because the previous use case may have been set to 2 due to failure, causing the following use cases to not run.
beforeEach(() => setSilentFactoryStatus(0));
describe('silent method request in queue with silent behavior', () => {
  test("it wouldn't retry when request is success", async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const fallbackMockFn = vi.fn();
    const retryMockFn = vi.fn();
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

    // Start silent factory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    const successMockFn = vi.fn();
    const offSuccess = onSilentSubmitSuccess(event => {
      successMockFn(event);
      // Offload global events to avoid polluting other use cases
      offSuccess();
    });

    await pms;
    await delay(); // Since the silent method success event is triggered before the global silent submit success event, it needs to be delayed.

    // Successfully, neither on fallback nor on retry will be triggered.
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

    const fallbackMockFn = vi.fn();
    const retryMockFn = vi.fn();
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
    await pushNewSilentMethod2Queue(silentMethodInstance, false, 't1'); // Multiple use cases need to be placed in different queues, otherwise conflicts will occur

    // Start silent factory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    const successMockFn = vi.fn();
    onSilentSubmitSuccess(() => {
      successMockFn();
    });

    await pms;
    await delay(); // Since the silent method success event is triggered before the global silent submit success event, it needs to be delayed.

    // Successfully, neither on fallback nor on retry will be triggered.
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

    const fallbackMockFn = vi.fn();
    const retryMockFn = vi.fn();
    const executeOrder = [] as string[]; // Used to record the execution sequence and subsequent verification
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

    // Start silent factory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    const errorMockFn = vi.fn();
    const offError = onSilentSubmitError(event => {
      errorMockFn();
      expect(event.queueName).toBe('t2');
      expect(event.behavior).toBe('silent');
      expect(event.error.message).toBe('no permission');
      expect(event.method).toBe(methodInstance);
      expect(event.silentMethod).toBeInstanceOf(SilentMethod);
      expect(event.retryTimes).toBeLessThanOrEqual(2);
    });
    const failMockFn = vi.fn();
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
    // When there is a fallback callback, next round will not be triggered.
    expect(fallbackMockFn).toHaveBeenCalledTimes(1);
    expect(retryMockFn).toHaveBeenCalledTimes(2);
    expect(errorMockFn).toHaveBeenCalledTimes(3); // Called every time there is a request error
    expect(failMockFn).toHaveBeenCalledTimes(1);
    expect(executeOrder).toEqual(['retried_1', 'retried_2', 'fallback']);
    // Offload global events to avoid polluting other use cases
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

    const fallbackMockFn = vi.fn();
    const retryMockFn = vi.fn();
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

    // Start silent factory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    await pms;
    expect(fallbackMockFn).toHaveBeenCalledTimes(1);
    // The failure error does not match the retry error, so it will not be retried and fallback will be called directly.
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

    const fallbackMockFn = vi.fn();
    const retryMockFn = vi.fn();
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
    await pushNewSilentMethod2Queue(silentMethodInstance, false, 't4'); // Multiple use cases need to be placed in different queues, otherwise conflicts will occur

    // Start silent factory
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

    const fallbackMockFn = vi.fn();
    const retryMockFn = vi.fn();
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

    const fallbackMockFn = vi.fn();
    const retryMockFn = vi.fn();
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

    const fallbackMockFn = vi.fn();
    const retryMockFn = vi.fn();
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
