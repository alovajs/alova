import { ElectronSyncAdapter, NodeSyncAdapter, createNodePSCSynchronizer } from '@/index';
import { ExplicitCacheAdapter, createPSCAdapter, createPSCSynchronizer, createSyncAdapter } from '@/sharedCacheAdapter';
import { key } from '@alova/shared/function';
import { forEach } from '@alova/shared/vars';
import { AlovaGlobalCacheAdapter, createAlova, queryCache } from 'alova';
import GlobalFetch from 'alova/fetch';
import { IpcMain, IpcRenderer } from 'electron';
import EventEmitter from 'events';
import { Result, delay } from 'root/testUtils';

beforeEach(() => {
  vi.resetModules();
});

const getAlovaInstance = ({ id, l1Cache }: { id?: number; l1Cache?: AlovaGlobalCacheAdapter }) =>
  createAlova({
    baseURL: process.env.NODE_BASE_URL,
    id,
    l1Cache,
    requestAdapter: GlobalFetch(),
    responded: r => r.json()
  });

const prepareEnv = async () => {
  // mock IPC behavior
  const eventEmitter = new EventEmitter();
  createPSCSynchronizer(
    createSyncAdapter({
      send(event) {
        eventEmitter.emit('to-client', event);
      },
      receive(handler) {
        eventEmitter.on('to-main', event => handler(event));
      }
    })
  );

  const createSharedL1CacheAdapter = (scope?: string, cacheAdapter?: AlovaGlobalCacheAdapter) => {
    const syncAdapter = createSyncAdapter({
      send(event) {
        eventEmitter.emit('to-main', event);
      },
      receive(handler) {
        eventEmitter.on('to-client', event => handler(event));
      }
    });
    return createPSCAdapter(syncAdapter, cacheAdapter ?? new ExplicitCacheAdapter(), {
      scope
    });
  };

  const createSharedCacheAlova = () =>
    getAlovaInstance({
      id: 1,
      l1Cache: createSharedL1CacheAdapter()
    });

  const createNonSharedCacheAlova = () =>
    getAlovaInstance({
      id: 1
    });

  const { createElectronPSCSynchronizer } = await import('@/defaults/electronSyncAdapter');

  return {
    eventEmitter,
    createSharedL1CacheAdapter,
    createSharedCacheAlova,
    createNonSharedCacheAlova,
    createElectronPSCSynchronizer
  };
};

const createFakeElectronExports = (eventEmitter: EventEmitter) => {
  const mainMockOn = vi.fn();
  const clientMockOn = vi.fn();
  const ipcMain = {
    on: (name: string, handler: any) =>
      eventEmitter.on(name, (...args) => {
        handler(...args);
        mainMockOn();
      }),
    emit: vi.fn((name, payload) => eventEmitter.emit(name, { sender: ipcMain }, payload))
  } as unknown as IpcMain;
  const ipcRenderer = {
    on: (name: string, handler: any) =>
      eventEmitter.on(name, (...args) => {
        handler(...args);
        clientMockOn();
      }),
    emit: vi.fn((name, payload) => eventEmitter.emit(name, { sender: ipcRenderer }, payload)),
    invoke: vi.fn(async (name, payload) => eventEmitter.emit(name, { sender: ipcMain }, payload))
  } as unknown as IpcRenderer;

  return {
    ipcMain,
    ipcRenderer,
    mainMockOn,
    clientMockOn
  };
};

describe('shared cache', () => {
  test('should clear the cache when init', async () => {
    const { createSharedL1CacheAdapter } = await prepareEnv();

    const cache1 = createSharedL1CacheAdapter('scoped');
    const cacheInst = new ExplicitCacheAdapter();
    cacheInst.set('name', 'Tom');
    cacheInst.set('id', 9527);

    // waiting for cache sync.
    await delay(1);
    expect(cache1.get('name')).toBeUndefined();
    expect(cache1.get('id')).toBeUndefined();
    expect(cacheInst.get('name')).toStrictEqual('Tom');
    expect(cacheInst.get('id')).toStrictEqual(9527);

    // will be overridden with empty cache after init.
    const cache2 = createSharedL1CacheAdapter('scoped', cacheInst);

    // waiting for cache sync.
    await delay(1);
    expect(cacheInst.get('name')).toBeUndefined();
    expect(cacheInst.get('id')).toBeUndefined();
    expect(cache2.get('name')).toBeUndefined();
    expect(cache2.get('id')).toBeUndefined();
  });
  test('should share data between same scope', async () => {
    const { createSharedL1CacheAdapter } = await prepareEnv();

    const cache1 = createSharedL1CacheAdapter();
    const cache2 = createSharedL1CacheAdapter();
    const otherScopeCache = createSharedL1CacheAdapter('other');

    cache1.set('name', 'Tom');
    cache1.set('id', 9527);
    cache1.set('info', { sex: 'male' });

    // waiting for cache sync.
    await delay(1);

    expect(cache1.get('name')).toStrictEqual('Tom');
    expect(cache1.get('id')).toStrictEqual(9527);
    expect(cache1.get('info')).toStrictEqual({ sex: 'male' });
    expect(cache2.get('name')).toStrictEqual('Tom');
    expect(cache2.get('id')).toStrictEqual(9527);
    expect(cache2.get('info')).toStrictEqual({ sex: 'male' });
    expect(otherScopeCache.get('name')).toBeUndefined();

    cache2.remove('name');
    // waiting for cache sync.
    await delay(1);
    expect(cache1.get('name')).toBeUndefined();
    expect(cache2.get('name')).toBeUndefined();

    cache1.clear();
    // waiting for cache sync.
    await delay(1);
    expect(cache1.get('id')).toBeUndefined();
    expect(cache1.get('info')).toBeUndefined();
    expect(cache2.get('id')).toBeUndefined();
    expect(cache2.get('info')).toBeUndefined();
  });

  test('should share cache between alova instances with shared cache enabled', async () => {
    const { createSharedCacheAlova, createNonSharedCacheAlova } = await prepareEnv();

    const alovaA = createSharedCacheAlova();
    const alovaB = createSharedCacheAlova();
    const GetA = alovaA.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await GetA;

    const cache = await queryCache(GetA);
    expect(cache).not.toBeUndefined();
    expect(await queryCache(alovaB.Get('/unit-test'))).toStrictEqual(cache);

    const alovaC = createSharedCacheAlova();
    expect(await queryCache(alovaC.Get('/unit-test'))).toStrictEqual(cache);

    const alovaD = createNonSharedCacheAlova();
    expect(await queryCache(alovaD.Get('/unit-test'))).toBeUndefined();
  });

  test('should share cache between same scope in Electron', async () => {
    const { eventEmitter, createElectronPSCSynchronizer } = await prepareEnv();
    const { ipcMain, ipcRenderer } = createFakeElectronExports(eventEmitter);

    // simulate init operation in the main procress
    createElectronPSCSynchronizer(ipcMain);

    const alovaA = getAlovaInstance({
      id: 1,
      l1Cache: createPSCAdapter(ElectronSyncAdapter(ipcRenderer))
    });
    const alovaB = getAlovaInstance({
      id: 1,
      l1Cache: createPSCAdapter(ElectronSyncAdapter(ipcRenderer))
    });
    const alovaC = getAlovaInstance({
      id: 2,
      l1Cache: createPSCAdapter(ElectronSyncAdapter(ipcRenderer))
    });

    const GetA = alovaA.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await GetA;

    const cache = await queryCache(GetA);
    expect(cache).not.toBeUndefined();

    expect(await queryCache(alovaB.Get('/unit-test'))).toStrictEqual(cache);

    expect(await queryCache(alovaC.Get('/unit-test'))).toBeUndefined();

    // should be only one synchronizer in electron
    // so it takes no effect
    createElectronPSCSynchronizer(ipcMain);
    await delay(10);

    expect(cache).not.toBeUndefined();
    expect(await queryCache(alovaB.Get('/unit-test'))).toStrictEqual(cache);
    expect(await queryCache(alovaC.Get('/unit-test'))).toBeUndefined();
  });

  test('should set operation be a async function in electron', async () => {
    const { eventEmitter, createElectronPSCSynchronizer } = await prepareEnv();
    const { ipcMain, ipcRenderer, mainMockOn } = createFakeElectronExports(eventEmitter);

    // simulate init operation in the main procress
    createElectronPSCSynchronizer(ipcMain);

    const l1Cache = createPSCAdapter(ElectronSyncAdapter(ipcRenderer));

    const alovaA = getAlovaInstance({
      id: 1,
      l1Cache
    });

    const GetA = alovaA.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });

    // expect(mainMockOn).toHaveBeenCalledTimes(1);

    const setReturn = l1Cache.set(key(GetA), 123);
    expect(setReturn).toBeInstanceOf(Promise);
    await setReturn;

    expect(mainMockOn).toHaveBeenCalledTimes(2);
  });

  test('should share cache between same scope in node', async () => {
    // simulate init operation in the main procress
    const stopServer = await createNodePSCSynchronizer();

    const stopHandler: (() => void)[] = [];

    const alovaA = getAlovaInstance({
      id: 1,
      l1Cache: createPSCAdapter(NodeSyncAdapter(stop => stopHandler.push(stop)))
    });
    const alovaB = getAlovaInstance({
      id: 1,
      l1Cache: createPSCAdapter(NodeSyncAdapter(stop => stopHandler.push(stop)))
    });
    const alovaC = getAlovaInstance({
      id: 2,
      l1Cache: createPSCAdapter(NodeSyncAdapter(stop => stopHandler.push(stop)))
    });

    const GetA = alovaA.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await GetA;

    // waiting for cache sync.
    await delay(50);
    const cache = await queryCache(GetA);
    expect(cache).not.toBeUndefined();
    expect(await queryCache(alovaB.Get('/unit-test'))).toStrictEqual(cache);
    expect(await queryCache(alovaC.Get('/unit-test'))).toBeUndefined();

    forEach(stopHandler, fn => fn());
    stopServer();
  });

  test('should trigger event handler with expect times in node', async () => {
    // simulate init operation in the main procress
    const stopServer = await createNodePSCSynchronizer();

    const stopHandler: (() => void)[] = [];
    const mockSend = vi.fn();
    const mockReceive = vi.fn();

    const createMockNodeSyncAdapter = () => {
      const rawAdapter = NodeSyncAdapter(stop => stopHandler.push(stop));

      return createSyncAdapter({
        send(event) {
          mockSend(event);
          rawAdapter.send(event);
        },
        receive(handler) {
          rawAdapter.receive(event => {
            handler(event);
            mockReceive(event);
          });
        }
      });
    };

    const alovaA = getAlovaInstance({
      id: 1,
      l1Cache: createPSCAdapter(createMockNodeSyncAdapter())
    });
    const alovaB = getAlovaInstance({
      id: 1,
      l1Cache: createPSCAdapter(createMockNodeSyncAdapter())
    });
    const alovaC = getAlovaInstance({
      id: 2,
      l1Cache: createPSCAdapter(createMockNodeSyncAdapter())
    });

    // waiting for cache sync.
    await delay(50);

    // 3 init events
    expect(mockSend).toHaveBeenCalledTimes(3);
    expect(mockReceive).toHaveBeenCalledTimes(3);
    expect(mockReceive).toHaveBeenLastCalledWith({ senderID: '', type: 'init', key: '', value: '{}' });

    const GetA = alovaA.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await GetA;

    const GetB = alovaC.Get('/unit-test', {
      transform: ({ data }: Result) => data,
      params: { name: 'test' }
    });
    await GetB;

    // waiting for cache sync.
    await delay(50);

    // 3 init events + 2 set event
    expect(mockSend).toHaveBeenCalledTimes(5);
    // 3 init events + 6 set events
    expect(mockReceive).toHaveBeenCalledTimes(9);
    expect(mockReceive.mock.lastCall[0].key).toStrictEqual('$a.2["GET","/unit-test",{"name":"test"},null,{}]');
    expect(mockReceive.mock.lastCall[0].value[0]).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: { name: 'test' }
    });

    const cache = await queryCache(GetA);
    expect(cache).not.toBeUndefined();
    expect(await queryCache(alovaB.Get('/unit-test'))).toStrictEqual(cache);
    expect(await queryCache(alovaC.Get('/unit-test'))).toBeUndefined();

    forEach(stopHandler, fn => fn());
    stopServer();
  });
});
