import { createAlova, Method } from 'alova';
import vueHook from 'alova/vue';
import { bootSilentFactory } from '../../src/hooks/silent/silentFactory';
import { SilentMethod } from '../../src/hooks/silent/SilentMethod';
import { pushNewSilentMethod2Queue } from '../../src/hooks/silent/silentQueue';
import loadSilentQueueMapFromStorage from '../../src/hooks/silent/storage/loadSilentQueueMapFromStorage';
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
describe('silentMethods instance methods', () => {
  test('should save silentMethod when call function save', async () => {
    // 模拟数据创建
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent');
    pushNewSilentMethod2Queue(silentMethodInstance, true);

    silentMethodInstance.entity.url = '/detail-custom';
    silentMethodInstance.save();
    const storagedSilentQueueMap = loadSilentQueueMapFromStorage();
    expect(storagedSilentQueueMap.default?.[0].entity.url).toBe(silentMethodInstance.entity.url);
  });

  test('should remove silentMethod from belonged queue when call function remove', async () => {
    const queue = 'inst2';
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent');
    pushNewSilentMethod2Queue(silentMethodInstance, true, queue);

    silentMethodInstance.remove();
    const storagedSilentQueueMap = loadSilentQueueMapFromStorage();
    expect(storagedSilentQueueMap[queue]).toBeUndefined();
  });

  test('should replace current silentMethod from belonged queue when call function replace', async () => {
    const queue = 'inst3';
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent');
    pushNewSilentMethod2Queue(silentMethodInstance, true, queue);

    expect(() => {
      // 两个silentMethod实例cache一致才能替换，否则报错
      silentMethodInstance.replace(new SilentMethod(methodInstance, 'silent'));
    }).toThrow();
    const silentMethodInstance2 = new SilentMethod(methodInstance, 'silent');
    silentMethodInstance2.cache = true;
    silentMethodInstance.replace(silentMethodInstance2);

    const storagedSilentQueueMap = loadSilentQueueMapFromStorage();
    expect(storagedSilentQueueMap[queue]).toHaveLength(1);
    expect(storagedSilentQueueMap[queue]?.[0].id).toBe(silentMethodInstance2.id);
  });
});
