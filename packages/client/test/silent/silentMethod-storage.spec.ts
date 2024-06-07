import { SilentMethod } from '@/hooks/silent/SilentMethod';
import { DEFAUT_QUEUE_NAME, setDependentAlova } from '@/hooks/silent/globalVariables';
import { clearSilentQueueMap, pushNewSilentMethod2Queue, silentQueueMap } from '@/hooks/silent/silentQueue';
import loadSilentQueueMapFromStorage from '@/hooks/silent/storage/loadSilentQueueMapFromStorage';
import { silentMethodIdQueueMapStorageKey, silentMethodStorageKeyPrefix } from '@/hooks/silent/storage/performers';
import { spliceStorageSilentMethod } from '@/hooks/silent/storage/silentMethodStorage';
import createEventManager from '@alova/shared/createEventManager';
import { AlovaGlobalCacheAdapter, Method, createAlova } from 'alova';
import VueHook from 'alova/vue';
import { mockRequestAdapter } from '../mockData';

beforeEach(clearSilentQueueMap); // 每次清除队列，保证测试数据正确
describe('manipulate silent method storage', () => {
  test('should persist when cache is true', async () => {
    const storageMock = {} as Record<string, any>;
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false,
      l2Cache: {
        set(key, value) {
          storageMock[key] = value;
        },
        get(key) {
          return storageMock[key];
        },
        remove(key) {
          delete storageMock[key];
        }
      } as AlovaGlobalCacheAdapter
    });
    // 设置依赖的alova实例
    setDependentAlova(alovaInst);
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      2,
      {
        delay: 50,
        startQuiver: 0.4
      }
    );
    await pushNewSilentMethod2Queue(silentMethodInstance, true);
    expect(storageMock[silentMethodIdQueueMapStorageKey].default).toHaveLength(1);
    const firstDefaultQueueId = storageMock[silentMethodIdQueueMapStorageKey].default[0];
    expect(storageMock[silentMethodStorageKeyPrefix + firstDefaultQueueId]?.id).toBe(firstDefaultQueueId);
  });

  test('should restore all persistent silentMethod instances', async () => {
    const storageMock = {} as Record<string, any>;
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false,
      l2Cache: {
        set(key, value) {
          storageMock[key] = value;
        },
        get(key) {
          return storageMock[key];
        },
        remove(key) {
          delete storageMock[key];
        }
      } as AlovaGlobalCacheAdapter
    });
    // 设置依赖的alova实例
    setDependentAlova(alovaInst);
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      2,
      {
        delay: 50,
        startQuiver: 0.4
      }
    );
    const methodInstance2 = new Method('DELETE', alovaInst, '/detail/1');
    const silentMethodInstance2 = new SilentMethod(
      methodInstance2,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      2
    );
    await pushNewSilentMethod2Queue(silentMethodInstance, true); // cache为true，会持久化
    await pushNewSilentMethod2Queue(silentMethodInstance2, false); // cache为false，不会持久化

    // 从存储中加载
    const loadedSilentQueueMap = await loadSilentQueueMapFromStorage();
    // 只有一个default队列，且default队列中只有一个项
    expect(Object.keys(loadedSilentQueueMap)).toHaveLength(1);
    expect(loadedSilentQueueMap.default).toHaveLength(1);
  });

  test('should remove silentMethod item in storage', async () => {
    const storageMock = {} as Record<string, any>;
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      statesHook: VueHook,
      requestAdapter: mockRequestAdapter,
      cacheLogger: false,
      l2Cache: {
        set(key, value) {
          storageMock[key] = value;
        },
        get(key) {
          return storageMock[key];
        },
        remove(key) {
          delete storageMock[key];
        }
      } as AlovaGlobalCacheAdapter
    });
    // 设置依赖的alova实例
    setDependentAlova(alovaInst);
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const silentMethodInstance = new SilentMethod(
      methodInstance,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      2,
      {
        delay: 50,
        startQuiver: 0.4
      }
    );
    const methodInstance2 = new Method('DELETE', alovaInst, '/detail/1');
    const silentMethodInstance2 = new SilentMethod(
      methodInstance2,
      'silent',
      createEventManager(),
      undefined,
      undefined,
      /.*/,
      2
    );
    await pushNewSilentMethod2Queue(silentMethodInstance, true);
    await pushNewSilentMethod2Queue(silentMethodInstance2, true);

    expect(Object.keys(silentQueueMap)).toHaveLength(1);
    expect(silentQueueMap.default).toHaveLength(2);
    let loadedSilentQueueMap = await loadSilentQueueMapFromStorage();
    expect(Object.keys(loadedSilentQueueMap)).toHaveLength(1);
    expect(loadedSilentQueueMap.default).toHaveLength(2);

    await spliceStorageSilentMethod(DEFAUT_QUEUE_NAME, silentMethodInstance.id);
    loadedSilentQueueMap = await loadSilentQueueMapFromStorage();
    expect(Object.keys(loadedSilentQueueMap)).toHaveLength(1);
    expect(loadedSilentQueueMap.default).toHaveLength(1);
    expect(storageMock[silentMethodStorageKeyPrefix + silentMethodInstance.id]).toBeUndefined(); // 检查存储中的silentMethod

    await spliceStorageSilentMethod(DEFAUT_QUEUE_NAME, silentMethodInstance2.id);
    loadedSilentQueueMap = await loadSilentQueueMapFromStorage();
    expect(Object.keys(loadedSilentQueueMap)).toHaveLength(0);
    expect(storageMock[silentMethodStorageKeyPrefix + silentMethodInstance2.id]).toBeUndefined();
  });
});
