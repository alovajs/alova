import { setSilentFactoryStatus } from '@/hooks/silent/globalVariables';
import { bootSilentFactory } from '@/hooks/silent/silentFactory';
import { SilentMethod } from '@/hooks/silent/SilentMethod';
import { pushNewSilentMethod2Queue } from '@/hooks/silent/silentQueue';
import createVirtualResponse from '@/hooks/silent/virtualResponse/createVirtualResponse';
import VueHook from '@/statesHook/vue';
import createEventManager from '@alova/shared/createEventManager';
import { usePromise } from '@alova/shared/function';
import { createAlova, Method } from 'alova';
import { delay } from 'root/testUtils';
import { mockRequestAdapter } from '../mockData';

// 每次需重置状态，因为上一个用例可能因为失败而被设置为2，导致下面的用例不运行
beforeEach(() => setSilentFactoryStatus(0));
// vi.setConfig({ testTimeout: 1000_000 });
describe('silent method request in queue with silent behavior', () => {
  test('silentMethods in default queue should delay request when set `requestWait` to a number', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const methodInstance = new Method('POST', alovaInst, '/detail');
    const delayRequestTs = [] as number[];
    const { promise: pms, resolve } = usePromise();
    const virtualResponse = createVirtualResponse({
      id: ''
    });
    let startTs = Date.now();
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      0,
      undefined,
      () => {
        const curTs = Date.now();
        delayRequestTs.push(curTs - startTs);
        startTs = curTs;
      }
    );
    const silentMethodInstance2 = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      0,
      undefined,
      value => {
        delayRequestTs.push(Date.now() - startTs);
        resolve(value);
      }
    );
    silentMethodInstance.virtualResponse = virtualResponse;
    await pushNewSilentMethod2Queue(silentMethodInstance, false);
    await pushNewSilentMethod2Queue(silentMethodInstance2, false);

    // 启动silentFactory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0,
      requestWait: 1000
    });

    await pms;
    // 延迟请求1000毫秒，请求时间50毫秒，因此检测点是1050毫秒
    expect(delayRequestTs[0]).toBeGreaterThanOrEqual(1050);
    expect(delayRequestTs[1]).toBeGreaterThanOrEqual(1050);
  });

  test('silentMethods in custom queue should delay request when set `requestWait` to a detailed structure', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const queueName = 'ttt1';
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const delayRequestTs = [] as number[];
    const { promise: pms, resolve } = usePromise();
    const virtualResponse = createVirtualResponse({
      id: ''
    });
    let startTs = Date.now();
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      0,
      undefined,
      () => {
        const curTs = Date.now();
        delayRequestTs.push(curTs - startTs);
        startTs = curTs;
      }
    );
    const silentMethodInstance2 = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      0,
      undefined,
      value => {
        delayRequestTs.push(Date.now() - startTs);
        resolve(value);
      }
    );
    silentMethodInstance.virtualResponse = virtualResponse;
    await pushNewSilentMethod2Queue(silentMethodInstance, false, queueName);
    await pushNewSilentMethod2Queue(silentMethodInstance2, false, queueName);

    // 启动silentFactory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0,
      requestWait: [
        {
          queue: queueName,
          wait: 1000
        }
      ]
    });

    await pms;
    // 延迟请求1000毫秒，请求时间50毫秒，因此检测点是1050毫秒
    expect(delayRequestTs[0]).toBeGreaterThanOrEqual(1050);
    expect(delayRequestTs[1]).toBeGreaterThanOrEqual(1050);
  });

  test('silentMethods in custom queue should delay request when param `requestWait` match queues', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const delayRequestTs = [] as number[];

    const startTs = Date.now();
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      0,
      undefined,
      () => {
        delayRequestTs.push(Date.now() - startTs);
      }
    );
    const silentMethodInstance2 = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      0,
      undefined,
      () => {
        delayRequestTs.push(Date.now() - startTs);
      }
    );
    const silentMethodInstance3 = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      0,
      undefined,
      () => {
        delayRequestTs.push(Date.now() - startTs);
      }
    );
    await pushNewSilentMethod2Queue(silentMethodInstance, false, 'ttt3');
    await pushNewSilentMethod2Queue(silentMethodInstance2, false, 'ttt4');
    await pushNewSilentMethod2Queue(silentMethodInstance3, false, 'ttt5');

    // 启动silentFactory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0,
      requestWait: [
        {
          queue: /^ttt/,

          // 对url为/detail2的请求等待500毫秒，对其他请求等待1000毫秒
          wait: (silentMethod, queueName) => {
            if (queueName === 'ttt3') {
              expect(silentMethod).toBe(silentMethodInstance);
              return 0;
            }
            if (queueName === 'ttt4') {
              expect(silentMethod).toBe(silentMethodInstance2);
              return 500;
            }
            expect(silentMethod).toBe(silentMethodInstance3);
            return 1000;
          }
        }
      ]
    });

    await delay(1500);
    // 模拟请求需要50毫秒，需要加上
    expect(delayRequestTs[0]).toBeGreaterThanOrEqual(50);
    expect(delayRequestTs[1]).toBeGreaterThanOrEqual(550);
    expect(delayRequestTs[2]).toBeGreaterThanOrEqual(1050);
  });

  test("silentMethods in queue shouldn't delay request when not set specify queue", async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false
    });

    const queueName = 'ttt2';
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const delayRequestTs = [] as number[];
    const { promise: pms, resolve } = usePromise();
    const virtualResponse = createVirtualResponse({
      id: ''
    });
    let startTs = Date.now();
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      0,
      undefined,
      () => {
        const curTs = Date.now();
        delayRequestTs.push(curTs - startTs);
        startTs = curTs;
      }
    );
    const silentMethodInstance2 = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      0,
      undefined,
      value => {
        delayRequestTs.push(Date.now() - startTs);
        resolve(value);
      }
    );
    silentMethodInstance.virtualResponse = virtualResponse;
    await pushNewSilentMethod2Queue(silentMethodInstance, false, queueName);
    await pushNewSilentMethod2Queue(silentMethodInstance2, false, queueName);

    // 启动silentFactory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0,

      // 注意：这边未指定queue名为ttt2的请求延迟，因此会立即请求
      requestWait: 1000
    });

    await pms;
    // 未指定ttt2队列的延迟请求，因此会立即请求,100毫秒为请求延迟
    expect(delayRequestTs[0]).toBeLessThanOrEqual(100);
    expect(delayRequestTs[1]).toBeLessThanOrEqual(100);
  });
});
