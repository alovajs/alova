import { setSilentFactoryStatus } from '@/hooks/silent/globalVariables';
import { bootSilentFactory } from '@/hooks/silent/silentFactory';
import { SilentMethod } from '@/hooks/silent/SilentMethod';
import { pushNewSilentMethod2Queue } from '@/hooks/silent/silentQueue';
import createVirtualResponse from '@/hooks/silent/virtualResponse/createVirtualResponse';
import VueHook from '@/statesHook/vue';
import { createEventManager, usePromise } from '@alova/shared';
import { createAlova, Method } from 'alova';
import { delay } from 'root/testUtils';
import { mockRequestAdapter } from '../mockData';

// The status needs to be reset each time because the previous test may have been set to 2 due to failure, causing the following tests to not run.
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

    // Start silent factory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0,
      requestWait: 1000
    });

    await pms;
    // The delay request is 1000 milliseconds and the request time is 50 milliseconds, so the detection point is 1050 milliseconds
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

    // Start silent factory
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
    // The delay request is 1000 milliseconds and the request time is 50 milliseconds, so the detection point is 1050 milliseconds
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

    // Start silent factory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0,
      requestWait: [
        {
          queue: /^ttt/,

          // Wait 500 milliseconds for requests with URL /detail2 and 1000 milliseconds for other requests.
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
    // The simulated request takes 50 milliseconds, which needs to be added
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

    // Start silent factory
    bootSilentFactory({
      alova: alovaInst,
      delay: 0,

      // Note: The request delay for the queue named ttt2 is not specified here, so the request will be made immediately.
      requestWait: 1000
    });

    await pms;
    // The delay request of the ttt2 queue is not specified, so the request will be made immediately, with 100 milliseconds as the request delay.
    expect(delayRequestTs[0]).toBeLessThanOrEqual(100);
    expect(delayRequestTs[1]).toBeLessThanOrEqual(100);
  });
});
