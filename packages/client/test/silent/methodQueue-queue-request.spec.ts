import { createAlova, Method } from 'alova';
import VueHook from 'alova/vue';
import { bootSilentFactory, onSilentSubmitError, onSilentSubmitSuccess } from '../../src/hooks/silent/silentFactory';
import { SilentMethod } from '../../src/hooks/silent/SilentMethod';
import { pushNewSilentMethod2Queue, silentQueueMap } from '../../src/hooks/silent/silentQueue';
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
    const pms = new Promise(resolve => {
      const silentMethodInstance = new SilentMethod(
        methodInstance,
        'queue',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        value => resolve(value)
      );
      pushNewSilentMethod2Queue(silentMethodInstance, false);

      // 启动silentFactory
      bootSilentFactory({
        alova: alovaInst,
        delay: 0
      });
    });

    const successMockFn = jest.fn();
    const offSuccess = onSilentSubmitSuccess(() => {
      successMockFn();
      // 卸载全局事件避免污染其他用例
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

    const fallbackMockFn = jest.fn();
    const retryMockFn = jest.fn();
    const queueName = 't10';
    const methodInstance = new Method('POST', alovaInst, '/detail-error', undefined, {
      id: 'aa'
    });
    const pms = new Promise(resolve => {
      const silentMethodInstance = new SilentMethod(
        methodInstance,
        'queue',
        undefined,
        undefined,
        /.*/,
        2,
        {
          delay: 50
        },
        [
          () => {
            fallbackMockFn();
          }
        ],
        value => resolve(value),
        reason => resolve(reason),
        undefined,
        undefined,
        [
          () => {
            retryMockFn();
          }
        ]
      );
      pushNewSilentMethod2Queue(silentMethodInstance, false, queueName); // 多个用例需要分别放到不同队列，否则会造成冲突

      // 启动silentFactory
      bootSilentFactory({
        alova: alovaInst,
        delay: 0
      });
    });

    const errorMockFn = jest.fn();
    onSilentSubmitError(event => {
      expect((event as any)[Symbol.toStringTag]).toBe('GlobalSQErrorEvent');
      errorMockFn();
    });

    const reason: any = await pms;
    expect(reason).toBeInstanceOf(Error);
    expect(reason.name).toBe('403');
    expect(reason.message).toBe('no permission');
    expect(silentQueueMap[queueName]).toHaveLength(0); // queue行为下，即使失败也将被移除

    // queue行为下，onFallback和onRetry，以及全局的silentSubmit事件都不会触发
    expect(fallbackMockFn).toHaveBeenCalledTimes(0);
    expect(retryMockFn).toHaveBeenCalledTimes(0);
    expect(errorMockFn).toHaveBeenCalledTimes(0);
  });
});
