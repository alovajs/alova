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
  // 启动silentFactory
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

    // 模拟数据创建
    const silentMethodInstance = new SilentMethod(createMethod('aa'), 'silent', createEventManager());
    await push2PersistentSilentQueue(silentMethodInstance, targetQueueName);

    // 未启动时，也可以匹配到持久化存储中的值
    let smAry = await filterSilentMethods('aa', targetQueueName);
    expect(smAry).toHaveLength(1);

    await untilCbCalled(onSilentSubmitBoot as any);
    const silentMethodInstance2 = new SilentMethod(createMethod('aa'), 'silent', createEventManager());
    await push2PersistentSilentQueue(silentMethodInstance2, targetQueueName);

    // 启动后，则不再匹配到持久化存储中的值
    // 因为在启动时会读取持久化存储，因此还是可以匹配到第一个
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

    // 匹配全部
    let smAry = await filterSilentMethods();
    expect(smAry).toHaveLength(3);

    // 匹配第二个
    smAry = await filterSilentMethods('bb');
    expect(smAry).toHaveLength(1);
    expect(smAry[0]).toBe(silentMethodInstance2);

    // 不匹配
    smAry = await filterSilentMethods('dd');
    expect(smAry).toHaveLength(0);

    // 匹配第二和第三个
    smAry = await filterSilentMethods(/b$/);
    expect(smAry).toHaveLength(2);
    expect(smAry[0]).toBe(silentMethodInstance2);
    expect(smAry[1]).toBe(silentMethodInstance3);

    // 不匹配
    smAry = await filterSilentMethods(/ab$/);
    expect(smAry).toHaveLength(0);

    // 不在同一个队列，不匹配
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

    // 匹配第二个
    let matchedSM = await getSilentMethod('bb', 'queue2');
    expect(matchedSM).toBe(silentMethodInstance2);

    // 不匹配
    matchedSM = await getSilentMethod('dd', 'queue2');
    expect(matchedSM).toBeUndefined();

    // 匹配第二和第三个，但只返回前一个
    matchedSM = await getSilentMethod(/b$/, 'queue2');
    expect(matchedSM).toBe(silentMethodInstance2);

    // 不匹配
    matchedSM = await getSilentMethod(/ab$/, 'queue2');
    expect(matchedSM).toBeUndefined();

    // 不在同一个队列，不匹配
    matchedSM = await getSilentMethod(/b$/, 'emptyQueue');
    expect(matchedSM).toBeUndefined();
  });
});
