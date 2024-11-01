import { SilentMethod } from '@/hooks/silent/SilentMethod';
import { bootSilentFactory, onSilentSubmitError, onSilentSubmitSuccess } from '@/hooks/silent/silentFactory';
import { pushNewSilentMethod2Queue, silentQueueMap } from '@/hooks/silent/silentQueue';
import VueHook from '@/statesHook/vue';
import { createEventManager, usePromise } from '@alova/shared';
import { Method, createAlova } from 'alova';
import { ScopedSQEvents } from '~/typings/clienthook';
import { mockRequestAdapter } from '../mockData';

describe('silent method request in queue with queue behavior', () => {
  test('it would call resolve when request is success', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const methodInstance = new Method('POST', alovaInst, '/detail');
    const { promise: pms, resolve } = usePromise();
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'queue',
      createEventManager(),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      value => resolve(value)
    );
    await pushNewSilentMethod2Queue(silentMethodInstance, false);

    // Start silent factory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    const successMockFn = vi.fn();
    const offSuccess = onSilentSubmitSuccess(() => {
      successMockFn();
      // Offload global events to avoid polluting other use cases
      offSuccess();
    });

    const ret = await pms;
    expect(ret).toStrictEqual({ id: 1 });
    expect(successMockFn).not.toBeCalled();
  });

  test('retry params are invalid when request is error', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const fallbackMockFn = vi.fn();
    const retryMockFn = vi.fn();
    const queueName = 't10';
    const methodInstance = new Method('POST', alovaInst, '/detail-error', undefined, {
      id: 'aa'
    });
    const { promise: pms, resolve } = usePromise();
    const emitter = createEventManager<ScopedSQEvents<any>>();
    emitter.on('fallback', fallbackMockFn);
    emitter.on('retry', retryMockFn);
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'queue',
      emitter,
      undefined,
      undefined,
      /.*/,
      2,
      {
        delay: 50
      },
      value => resolve(value),
      reason => resolve(reason)
    );
    await pushNewSilentMethod2Queue(silentMethodInstance, false, queueName); // Multiple use cases need to be placed in different queues, otherwise conflicts will occur

    // Start silent factory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    const errorMockFn = vi.fn();
    onSilentSubmitError(event => {
      expect((event as any)[Symbol.toStringTag]).toBe('GlobalSQErrorEvent');
      errorMockFn();
    });

    const reason: any = await pms;
    expect(reason).toBeInstanceOf(Error);
    expect(reason.name).toBe('403');
    expect(reason.message).toBe('no permission');
    expect(silentQueueMap[queueName]).toHaveLength(0); // Under Queue behavior, even if it fails, it will be removed.

    // Under the Queue behavior, on fallback, on retry, and the global silent submit event will not be triggered.
    expect(fallbackMockFn).toHaveBeenCalledTimes(0);
    expect(retryMockFn).toHaveBeenCalledTimes(0);
    expect(errorMockFn).toHaveBeenCalledTimes(0);
  });
});
