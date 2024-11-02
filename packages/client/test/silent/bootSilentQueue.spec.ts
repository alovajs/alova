import { mockRequestAdapter } from '#/mockData';
import { GlobalSQEvent, GlobalSQSuccessEvent } from '@/event';
import { DEFAULT_QUEUE_NAME } from '@/hooks/silent/globalVariables';
import {
  bootSilentFactory,
  onBeforeSilentSubmit,
  onSilentSubmitBoot,
  onSilentSubmitSuccess
} from '@/hooks/silent/silentFactory';
import { SilentMethod } from '@/hooks/silent/SilentMethod';
import { deepReplaceVData, pushNewSilentMethod2Queue, silentQueueMap } from '@/hooks/silent/silentQueue';
import { push2PersistentSilentQueue } from '@/hooks/silent/storage/silentMethodStorage';
import createVirtualResponse from '@/hooks/silent/virtualResponse/createVirtualResponse';
import stringifyVData from '@/hooks/silent/virtualResponse/stringifyVData';
import VueHook from '@/statesHook/vue';
import { createEventManager, usePromise } from '@alova/shared';
import { createAlova, Method } from 'alova';
import { delay } from 'root/testUtils';
import { ScopedSQEvents } from '~/typings/clienthook';

describe('boot silent queue', () => {
  test('replace virtual data to real data', () => {
    const virtualResponse = createVirtualResponse({ id: 'loading...' });
    const vid = virtualResponse.id;

    const methodInstance = new Method(
      'DELETE',
      createAlova({
        baseURL: 'http://xxx',
        statesHook: VueHook,
        requestAdapter: mockRequestAdapter
      }),
      `/detail/${stringifyVData(vid)}`,
      {
        transform: (data: any) => data
      },
      { whole: virtualResponse }
    );
    const vDataReplacedResponseMap = {
      [stringifyVData(virtualResponse)]: { id: 1 },
      [stringifyVData(vid)]: 1
    };

    deepReplaceVData(methodInstance, vDataReplacedResponseMap);
    expect(methodInstance.url).toBe('/detail/1');
    expect(methodInstance.data).toEqual({
      whole: { id: 1 }
    });

    // No dummy data exists
    const methodInstance2 = new Method(
      'DELETE',
      createAlova({
        baseURL: 'http://xxx',
        statesHook: VueHook,
        requestAdapter: mockRequestAdapter
      }),
      `/detail`,
      {
        transform: (data: any) => data
      },
      { whole: { id: 123 }, text: '' }
    );
    deepReplaceVData(methodInstance2, vDataReplacedResponseMap);
    expect(methodInstance2.url).toBe('/detail');
    expect(methodInstance2.data).toEqual({
      whole: { id: 123 },
      text: ''
    });
  });

  // test('should throw error when not call bootSilentFactory sync', async () => {

  // });

  test('silentMethods in storage will be appended to the end of queue, when merge by bootSilentFactory', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });
    const targetQueueName = 'tt2';
    // Start silent factory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    // Simulation data creation
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const emitter = createEventManager();
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent', emitter, 'abcdef');
    await push2PersistentSilentQueue(silentMethodInstance, targetQueueName);

    const methodInstance2 = new Method('POST', alovaInst, '/detail');
    const silentMethodInstance2 = new SilentMethod(methodInstance2, 'silent', emitter, 'zzxxx');
    await pushNewSilentMethod2Queue(silentMethodInstance2, false, targetQueueName);

    const bootMockFn = vi.fn();
    await new Promise<void>(resolve => {
      onSilentSubmitBoot(() => {
        bootMockFn();
        resolve();
      });
    });

    const targetQueue = silentQueueMap[targetQueueName];
    // silentMethodInstance2 will enter the queue first
    // The persistent silentMethodInstance will be asynchronously merged into the queue when bootSilentFactory
    expect(targetQueue[0]).toBe(silentMethodInstance2);
    expect(targetQueue[1].id).toBe(silentMethodInstance.id); // Silent method instance will be persisted and then read, so it can only be compared by ID to see if it is consistent.

    expect(bootMockFn).toHaveBeenCalled();

    // It is necessary to delay the two requests of this use case to complete, otherwise it will affect the data of the next use case.
    await delay(1000);
  });

  test('execute single queue with 2 method which connected by virtual data', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const methodResolveFn = vi.fn();
    const methodRejectFn = vi.fn();
    const methodFallbackFn = vi.fn();
    const successMockFn = vi.fn();
    const beforeMockFn = vi.fn();

    const { promise: pms, resolve } = usePromise();
    const virtualResponse = createVirtualResponse({ id: 'loading...' });
    const vid = virtualResponse.id;

    // Simulation data creation
    const methodInstance = new Method(
      'POST',
      alovaInst,
      '/detail',
      {
        transform: (data: any) => data
      },
      { text: 'some content', time: new Date().toLocaleString() }
    );
    const emitter = createEventManager<ScopedSQEvents<any>>();
    emitter.on('fallback', () => {
      methodFallbackFn();
    });
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      emitter,
      'abcdef',
      undefined,
      undefined,
      2,
      undefined,
      value => {
        methodResolveFn();
        expect(value).toStrictEqual({ id: 1 });
      },
      () => {
        methodRejectFn();
      }
    );
    silentMethodInstance.virtualResponse = virtualResponse;

    // Simulate data deletion
    const methodInstance2 = new Method(
      'DELETE',
      alovaInst,
      `/detail/${stringifyVData(vid)}`,
      {
        transform: (data: any) => data
      },
      { id: vid }
    );
    const emitter2 = createEventManager<ScopedSQEvents<any>>();
    emitter2.on('fallback', () => {
      methodFallbackFn();
    });
    const silentMethodInstance2 = new SilentMethod(
      methodInstance2,
      'silent',
      emitter2,
      'abcdef',
      undefined,
      undefined,
      2,
      undefined,
      value => {
        methodResolveFn();
        expect(value).toStrictEqual({
          params: {
            id: '1'
          },
          data: { id: 1 }
        });
        resolve(0);
      },
      () => {
        methodRejectFn();
      },
      undefined,
      [vid]
    );
    // Construct a mapping collection of virtual data and actual values
    const vDataResponsePayload = {
      [stringifyVData(virtualResponse)]: { id: 1 },
      [stringifyVData(vid)]: 1
    };

    let beforeHookCallIndex = 0;
    onBeforeSilentSubmit(event => {
      beforeMockFn();
      expect(event).toBeInstanceOf(GlobalSQEvent);
      expect(event.behavior).toBe('silent');
      if (beforeHookCallIndex === 0) {
        expect(event.retryTimes).toBe(0);
        expect(event.method).toBe(methodInstance);
        expect(event.silentMethod).toBe(silentMethodInstance);
      } else if (beforeHookCallIndex === 1) {
        expect(event.retryTimes).toBe(0);
        expect(event.method).toBe(methodInstance2);
        expect(event.silentMethod).toBe(silentMethodInstance2);
      }
      beforeHookCallIndex += 1;
    });

    await pushNewSilentMethod2Queue(silentMethodInstance, false);
    await pushNewSilentMethod2Queue(silentMethodInstance2, false);

    let successCallIndex = 0;
    onSilentSubmitSuccess(event => {
      successMockFn();
      // Verify data in event
      expect(event.queueName).toBe(DEFAULT_QUEUE_NAME);
      expect(event).toBeInstanceOf(GlobalSQSuccessEvent);
      expect(event.behavior).toBe('silent');
      if (successCallIndex === 0) {
        expect(event.data).toStrictEqual({ id: 1 });
        expect(event.method).toBe(methodInstance);
        expect(event.silentMethod).toBe(silentMethodInstance);
        expect(event.vDataResponse).toStrictEqual(vDataResponsePayload);
      } else if (successCallIndex === 1) {
        expect(event.data).toStrictEqual({
          params: {
            id: '1'
          },
          data: { id: 1 }
        });
        expect(event.method).toBe(methodInstance2);
        expect(event.silentMethod).toBe(silentMethodInstance2);
        expect(event.vDataResponse).toStrictEqual({});
      }
      successCallIndex += 1;
    });

    // Start silent factory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    await pms;
    await delay(200);

    // Local call situation
    expect(methodResolveFn).toHaveBeenCalledTimes(2);
    expect(methodRejectFn).toHaveBeenCalledTimes(0);
    expect(methodFallbackFn).toHaveBeenCalledTimes(0);
    expect(beforeMockFn).toHaveBeenCalledTimes(2);

    // Global callback call status
    expect(successMockFn).toHaveBeenCalledTimes(2); // The two silent methods are triggered once each
  });

  test('execute queue that the first is undefined response', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });
    const { promise: pms, resolve } = usePromise();
    const virtualResponse = createVirtualResponse({ id: undefined, other: undefined });
    const methodInstance = new Method('POST', alovaInst, '/detail', {
      transform: () => undefined // The response data ends up being undefined
    });
    const emitter = createEventManager<ScopedSQEvents<any>>();
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent', emitter, 'abcdef', undefined, /.*/, 2, {
      delay: 2000,
      multiplier: 1.5
    });
    silentMethodInstance.virtualResponse = virtualResponse;
    const vid = virtualResponse.id;
    const { other } = virtualResponse;

    const methodInstance2 = new Method('DELETE', alovaInst, `/detail/${vid}`, undefined, {
      id: vid,
      other
    });
    const emitter2 = createEventManager<ScopedSQEvents<any>>();
    const silentMethodInstance2 = new SilentMethod(
      methodInstance2,
      'silent',
      emitter2,
      'abcdef',
      undefined,
      /.*/,
      2,
      {
        delay: 2000,
        multiplier: 1.5
      },
      value => {
        expect(value).toStrictEqual({
          params: {
            id: 'undefined'
          },
          data: {
            id: undefined,
            other: undefined
          }
        });
        resolve(0);
      },
      undefined,
      [vid, other]
    );
    await pushNewSilentMethod2Queue(silentMethodInstance, false);
    await pushNewSilentMethod2Queue(silentMethodInstance2, false);

    // Start silent factory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });
    await pms;
    await delay(200);
  });

  test('execute queue that the first is primitive response', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const { promise: pms, resolve } = usePromise();
    const virtualResponse = createVirtualResponse(undefined);
    const methodInstance = new Method('POST', alovaInst, '/detail', {
      transform: () => true
    });
    const emitter = createEventManager<ScopedSQEvents<any>>();
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent', emitter, 'abcdef', undefined, /.*/, 2, {
      delay: 2000,
      multiplier: 1.5
    });
    silentMethodInstance.virtualResponse = virtualResponse;
    const methodInstance2 = new Method('DELETE', alovaInst, `/detail/${stringifyVData(virtualResponse)}`, undefined, {
      whole: virtualResponse
    });
    const emitter2 = createEventManager<ScopedSQEvents<any>>();
    const silentMethodInstance2 = new SilentMethod(
      methodInstance2,
      'silent',
      emitter2,
      'abcdef',
      undefined,
      /.*/,
      2,
      {
        delay: 2000,
        multiplier: 1.5
      },
      value => {
        resolve(0);
        expect(value).toStrictEqual({
          params: {
            id: 'true'
          },
          data: {
            whole: true
          }
        });
      },
      undefined,
      undefined,
      [virtualResponse]
    );
    await pushNewSilentMethod2Queue(silentMethodInstance, false);
    await pushNewSilentMethod2Queue(silentMethodInstance2, false);

    // Start silent factory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });
    await pms;
    await delay(200);
  });
});
