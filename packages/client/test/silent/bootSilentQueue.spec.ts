import { createAlova, Method } from 'alova';
import VueHook from 'alova/vue';
import { DEFAUT_QUEUE_NAME } from '../../src/helper/variables';
import {
  bootSilentFactory,
  onBeforeSilentSubmit,
  onSilentSubmitBoot,
  onSilentSubmitSuccess
} from '../../src/hooks/silent/silentFactory';
import { SilentMethod } from '../../src/hooks/silent/SilentMethod';
import { deepReplaceVData, pushNewSilentMethod2Queue, silentQueueMap } from '../../src/hooks/silent/silentQueue';
import { push2PersistentSilentQueue } from '../../src/hooks/silent/storage/silentMethodStorage';
import createVirtualResponse from '../../src/hooks/silent/virtualResponse/createVirtualResponse';
import stringifyVData from '../../src/hooks/silent/virtualResponse/stringifyVData';
import { mockRequestAdapter } from '../mockData';
import { untilCbCalled } from '../utils';

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
        transformData: (data: any) => data
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

    // 不存在虚拟数据
    const methodInstance2 = new Method(
      'DELETE',
      createAlova({
        baseURL: 'http://xxx',
        statesHook: VueHook,
        requestAdapter: mockRequestAdapter
      }),
      `/detail`,
      {
        transformData: (data: any) => data
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

  test('silentMethods in storage will be appened to the end of queue, when merge by bootSilentFactory', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });
    const targetQueueName = 'tt2';
    // 启动silentFactory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0
    });

    // 模拟数据创建
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent', 'abcdef');
    push2PersistentSilentQueue(silentMethodInstance, targetQueueName);

    const methodInstance2 = new Method('POST', alovaInst, '/detail');
    const silentMethodInstance2 = new SilentMethod(methodInstance2, 'silent', 'zzxxx');
    pushNewSilentMethod2Queue(silentMethodInstance2, false, targetQueueName);

    const bootMockFn = jest.fn();
    await new Promise<void>(resolve => {
      onSilentSubmitBoot(() => {
        bootMockFn();
        resolve();
      });
    });

    const targetQueue = silentQueueMap[targetQueueName];
    // silentMethodInstance2会先进入队列
    // 而持久化的silentMethodInstance将会在bootSilentFactory时异步合并到队列中
    expect(targetQueue[0]).toBe(silentMethodInstance2);
    expect(targetQueue[1].id).toBe(silentMethodInstance.id); // silentMethodInstance因为会持久化再读取，因此只能通过id对比是否一致

    expect(bootMockFn).toBeCalled();

    // 需要延迟一下让本用例的两次请求走完，否则会影响下个用例的数据
    await untilCbCalled(setTimeout, 1000);
  });

  test('execute single queue with 2 method which connected by virtual data', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const methodResolveFn = jest.fn();
    const methodRejectFn = jest.fn();
    const methodFallbackFn = jest.fn();
    const successMockFn = jest.fn();
    const beforeMockFn = jest.fn();
    const pms = new Promise(resolve => {
      const virtualResponse = createVirtualResponse({ id: 'loading...' });
      const vid = virtualResponse.id;

      // 模拟数据创建
      const methodInstance = new Method(
        'POST',
        alovaInst,
        '/detail',
        {
          transformData: (data: any) => data
        },
        { text: 'some content', time: new Date().toLocaleString() }
      );
      const silentMethodInstance = new SilentMethod(
        methodInstance,
        'silent',
        'abcdef',
        undefined,
        undefined,
        2,
        undefined,
        [
          () => {
            methodFallbackFn();
          }
        ],
        value => {
          methodResolveFn();
          expect(value).toStrictEqual({ id: 1 });
        },
        () => {
          methodRejectFn();
        }
      );
      silentMethodInstance.virtualResponse = virtualResponse;

      // 模拟数据删除
      const methodInstance2 = new Method(
        'DELETE',
        alovaInst,
        `/detail/${stringifyVData(vid)}`,
        {
          transformData: (data: any) => data
        },
        { id: vid }
      );
      const silentMethodInstance2 = new SilentMethod(
        methodInstance2,
        'silent',
        'abcdef',
        undefined,
        undefined,
        2,
        undefined,
        [
          () => {
            methodFallbackFn();
          }
        ],
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
        undefined,
        [vid]
      );
      // 构造虚拟数据和实际值的映射集合
      const vDataResponsePayload = {
        [stringifyVData(virtualResponse)]: { id: 1 },
        [stringifyVData(vid)]: 1
      };

      let beforeHookCallIndex = 0;
      onBeforeSilentSubmit(event => {
        beforeMockFn();
        expect((event as any)[Symbol.toStringTag]).toBe('GlobalSQEvent');
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
        beforeHookCallIndex++;
      });

      pushNewSilentMethod2Queue(silentMethodInstance, false);
      pushNewSilentMethod2Queue(silentMethodInstance2, false);

      let successCallIndex = 0;
      onSilentSubmitSuccess(event => {
        successMockFn();
        // 验证event内的数据
        expect(event.queueName).toBe(DEFAUT_QUEUE_NAME);
        expect((event as any)[Symbol.toStringTag]).toBe('GlobalSQSuccessEvent');
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
        successCallIndex++;
      });

      // 启动silentFactory
      bootSilentFactory({
        alova: alovaInst,
        delay: 0
      });
    });

    await pms;
    await untilCbCalled(setTimeout, 200);

    // 局部调用情况
    expect(methodResolveFn).toHaveBeenCalledTimes(2);
    expect(methodRejectFn).toHaveBeenCalledTimes(0);
    expect(methodFallbackFn).toHaveBeenCalledTimes(0);
    expect(beforeMockFn).toHaveBeenCalledTimes(2);

    // 全局回调调用情况
    expect(successMockFn).toHaveBeenCalledTimes(2); // 两个silentMethod分别触发一次
  });

  test('execute queue that the first is undefined response', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });
    const pms = new Promise(resolve => {
      const virtualResponse = createVirtualResponse({ id: undefined, other: undefined });
      const methodInstance = new Method('POST', alovaInst, '/detail', {
        transformData: () => undefined // 响应数据最终为undefined
      });
      const silentMethodInstance = new SilentMethod(methodInstance, 'silent', 'abcdef', undefined, /.*/, 2, {
        delay: 2000,
        multiplier: 1.5
      });
      silentMethodInstance.virtualResponse = virtualResponse;
      const vid = virtualResponse.id;
      const other = virtualResponse.other;

      const methodInstance2 = new Method('DELETE', alovaInst, `/detail/${vid}`, undefined, {
        id: vid,
        other
      });
      const silentMethodInstance2 = new SilentMethod(
        methodInstance2,
        'silent',
        'abcdef',
        undefined,
        /.*/,
        2,
        {
          delay: 2000,
          multiplier: 1.5
        },
        undefined,
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
        undefined,
        undefined,
        [vid, other]
      );
      pushNewSilentMethod2Queue(silentMethodInstance, false);
      pushNewSilentMethod2Queue(silentMethodInstance2, false);

      // 启动silentFactory
      bootSilentFactory({
        alova: alovaInst,
        delay: 0
      });
    });
    await pms;
    await untilCbCalled(setTimeout, 200);
  });

  test('execute queue that the first is primirive response', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });
    const pms = new Promise(resolve => {
      const virtualResponse = createVirtualResponse(undefined);
      const methodInstance = new Method('POST', alovaInst, '/detail', {
        transformData: () => true
      });
      const silentMethodInstance = new SilentMethod(methodInstance, 'silent', 'abcdef', undefined, /.*/, 2, {
        delay: 2000,
        multiplier: 1.5
      });
      silentMethodInstance.virtualResponse = virtualResponse;
      const methodInstance2 = new Method('DELETE', alovaInst, `/detail/${stringifyVData(virtualResponse)}`, undefined, {
        whole: virtualResponse
      });
      const silentMethodInstance2 = new SilentMethod(
        methodInstance2,
        'silent',
        'abcdef',
        undefined,
        /.*/,
        2,
        {
          delay: 2000,
          multiplier: 1.5
        },
        undefined,
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
        undefined,
        [virtualResponse]
      );
      pushNewSilentMethod2Queue(silentMethodInstance, false);
      pushNewSilentMethod2Queue(silentMethodInstance2, false);

      // 启动silentFactory
      bootSilentFactory({
        alova: alovaInst,
        delay: 0
      });
    });
    await pms;
    await untilCbCalled(setTimeout, 200);
  });
});
