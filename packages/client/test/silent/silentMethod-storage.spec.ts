import { createAlova, Method } from 'alova';
import VueHook from 'alova/vue';
import { DEFAUT_QUEUE_NAME } from '../../src/helper/variables';
import { setDependentAlova } from '../../src/hooks/silent/globalVariables';
import { SilentMethod } from '../../src/hooks/silent/SilentMethod';
import { clearSilentQueueMap, pushNewSilentMethod2Queue, silentQueueMap } from '../../src/hooks/silent/silentQueue';
import loadSilentQueueMapFromStorage from '../../src/hooks/silent/storage/loadSilentQueueMapFromStorage';
import {
  silentMethodIdQueueMapStorageKey,
  silentMethodStorageKeyPrefix
} from '../../src/hooks/silent/storage/performers';
import { spliceStorageSilentMethod } from '../../src/hooks/silent/storage/silentMethodStorage';
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
      storageAdapter: {
        set(key, value) {
          storageMock[key] = value;
        },
        get(key) {
          return storageMock[key];
        },
        remove(key) {
          delete storageMock[key];
        }
      }
    });
    // 设置依赖的alova实例
    setDependentAlova(alovaInst);
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent', undefined, undefined, /.*/, 2, {
      delay: 50,
      startQuiver: 0.4
    });
    pushNewSilentMethod2Queue(silentMethodInstance, true);
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
      storageAdapter: {
        set(key, value) {
          storageMock[key] = value;
        },
        get(key) {
          return storageMock[key];
        },
        remove(key) {
          delete storageMock[key];
        }
      }
    });
    // 设置依赖的alova实例
    setDependentAlova(alovaInst);
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent', undefined, undefined, /.*/, 2, {
      delay: 50,
      startQuiver: 0.4
    });
    const methodInstance2 = new Method('DELETE', alovaInst, '/detail/1');
    const silentMethodInstance2 = new SilentMethod(methodInstance2, 'silent', undefined, undefined, /.*/, 2);
    pushNewSilentMethod2Queue(silentMethodInstance, true); // cache为true，会持久化
    pushNewSilentMethod2Queue(silentMethodInstance2, false); // cache为false，不会持久化

    // 从存储中加载
    const loadedSilentQueueMap = loadSilentQueueMapFromStorage();
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
      storageAdapter: {
        set(key, value) {
          storageMock[key] = value;
        },
        get(key) {
          return storageMock[key];
        },
        remove(key) {
          delete storageMock[key];
        }
      }
    });
    // 设置依赖的alova实例
    setDependentAlova(alovaInst);
    const methodInstance = new Method('POST', alovaInst, '/detail');
    const silentMethodInstance = new SilentMethod(methodInstance, 'silent', undefined, undefined, /.*/, 2, {
      delay: 50,
      startQuiver: 0.4
    });
    const methodInstance2 = new Method('DELETE', alovaInst, '/detail/1');
    const silentMethodInstance2 = new SilentMethod(methodInstance2, 'silent', undefined, undefined, /.*/, 2);
    pushNewSilentMethod2Queue(silentMethodInstance, true);
    pushNewSilentMethod2Queue(silentMethodInstance2, true);

    expect(Object.keys(silentQueueMap)).toHaveLength(1);
    expect(silentQueueMap.default).toHaveLength(2);
    let loadedSilentQueueMap = loadSilentQueueMapFromStorage();
    expect(Object.keys(loadedSilentQueueMap)).toHaveLength(1);
    expect(loadedSilentQueueMap.default).toHaveLength(2);

    spliceStorageSilentMethod(DEFAUT_QUEUE_NAME, silentMethodInstance.id);
    loadedSilentQueueMap = loadSilentQueueMapFromStorage();
    expect(Object.keys(loadedSilentQueueMap)).toHaveLength(1);
    expect(loadedSilentQueueMap.default).toHaveLength(1);
    expect(storageMock[silentMethodStorageKeyPrefix + silentMethodInstance.id]).toBeUndefined(); // 检查存储中的silentMethod

    spliceStorageSilentMethod(DEFAUT_QUEUE_NAME, silentMethodInstance2.id);
    loadedSilentQueueMap = loadSilentQueueMapFromStorage();
    expect(Object.keys(loadedSilentQueueMap)).toHaveLength(0);
    expect(storageMock[silentMethodStorageKeyPrefix + silentMethodInstance2.id]).toBeUndefined();
  });
});
