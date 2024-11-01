import { SilentMethod } from '@/hooks/silent/SilentMethod';
import { bootSilentFactory, onSilentSubmitBoot } from '@/hooks/silent/silentFactory';
import { pushNewSilentMethod2Queue } from '@/hooks/silent/silentQueue';
import { push2PersistentSilentQueue } from '@/hooks/silent/storage/silentMethodStorage';
import { filterSilentMethods, getSilentMethod } from '@/hooks/silent/virtualResponse/filterSilentMethods';
import vueHook from '@/statesHook/vue';
import { createEventManager } from '@alova/shared';
import { Method, createAlova } from 'alova';
import { untilCbCalled } from 'root/testUtils';
import { mockRequestAdapter } from '../mockData';

const alovaInst = createAlova({
  baseURL: 'http://xxx',
  statesHook: vueHook,
  requestAdapter: mockRequestAdapter,
  cacheLogger: false
});
beforeAll(() => {
  // Start silent factory
  bootSilentFactory({
    alova: alovaInst,
    delay: 0
  });
});
const createMethod = (name: string) =>
  new Method('POST', alovaInst, '/detail', {
    name
  });
describe('silentMethods filter', () => {
  test('It can match silentMethods in the storage before boot silentFactory', async () => {
    const targetQueueName = 'ttr2';

    // Simulation data creation
    const silentMethodInstance = new SilentMethod(createMethod('aa'), 'silent', createEventManager());
    await push2PersistentSilentQueue(silentMethodInstance, targetQueueName);

    // When not started, the value in the persistent storage can also be matched.
    let smAry = await filterSilentMethods('aa', targetQueueName);
    expect(smAry).toHaveLength(1);

    await untilCbCalled(onSilentSubmitBoot as any);
    const silentMethodInstance2 = new SilentMethod(createMethod('aa'), 'silent', createEventManager());
    await push2PersistentSilentQueue(silentMethodInstance2, targetQueueName);

    // After startup, the value in the persistent storage is no longer matched.
    // Because the persistent storage is read at startup, the first one can still be matched.
    smAry = await filterSilentMethods('aa', targetQueueName);
    expect(smAry).toHaveLength(1);
  });

  test('filterSilentMethods', async () => {
    const silentMethodInstance = new SilentMethod(createMethod('aa'), 'silent', createEventManager());
    const silentMethodInstance2 = new SilentMethod(createMethod('bb'), 'silent', createEventManager());
    const silentMethodInstance3 = new SilentMethod(createMethod('cb'), 'silent', createEventManager());
    await pushNewSilentMethod2Queue(silentMethodInstance, false);
    await pushNewSilentMethod2Queue(silentMethodInstance2, false);
    await pushNewSilentMethod2Queue(silentMethodInstance3, false);

    // match all
    let smAry = await filterSilentMethods();
    expect(smAry).toHaveLength(3);

    // match second
    smAry = await filterSilentMethods('bb');
    expect(smAry).toHaveLength(1);
    expect(smAry[0]).toBe(silentMethodInstance2);

    // no match
    smAry = await filterSilentMethods('dd');
    expect(smAry).toHaveLength(0);

    // Match the second and third
    smAry = await filterSilentMethods(/b$/);
    expect(smAry).toHaveLength(2);
    expect(smAry[0]).toBe(silentMethodInstance2);
    expect(smAry[1]).toBe(silentMethodInstance3);

    // no match
    smAry = await filterSilentMethods(/ab$/);
    expect(smAry).toHaveLength(0);

    // Not in the same queue, no match
    smAry = await filterSilentMethods(/b$/, 'emptyQueue');
    expect(smAry).toHaveLength(0);
  });

  test('getSilentMethod', async () => {
    const silentMethodInstance = new SilentMethod(createMethod('aa'), 'silent', createEventManager());
    const silentMethodInstance2 = new SilentMethod(createMethod('bb'), 'silent', createEventManager());
    const silentMethodInstance3 = new SilentMethod(createMethod('cb'), 'silent', createEventManager());
    const silentMethodInstance4 = new SilentMethod(createMethod(''), 'silent', createEventManager());
    await pushNewSilentMethod2Queue(silentMethodInstance, false, 'queue2');
    await pushNewSilentMethod2Queue(silentMethodInstance2, false, 'queue2');
    await pushNewSilentMethod2Queue(silentMethodInstance3, false, 'queue2');
    await pushNewSilentMethod2Queue(silentMethodInstance4, false, 'queue2');

    // match second
    let matchedSM = await getSilentMethod('bb', 'queue2');
    expect(matchedSM).toBe(silentMethodInstance2);

    // no match
    matchedSM = await getSilentMethod('dd', 'queue2');
    expect(matchedSM).toBeUndefined();

    // Matches the second and third, but only returns the previous one
    matchedSM = await getSilentMethod(/b$/, 'queue2');
    expect(matchedSM).toBe(silentMethodInstance2);

    // no match
    matchedSM = await getSilentMethod(/ab$/, 'queue2');
    expect(matchedSM).toBeUndefined();

    // Not in the same queue, no match
    matchedSM = await getSilentMethod(/b$/, 'emptyQueue');
    expect(matchedSM).toBeUndefined();
  });
});
