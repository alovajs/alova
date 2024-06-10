import { createDefaultL1CacheAdapter } from '@/defaults/cacheAdapter';
import {
  createDefaultSharedCacheAdapter,
  createSharedCacheSynchronizer,
  createSyncAdapter
} from '@/defaults/sharedCacheAdapter';
import { Result, delay } from 'root/testUtils';

import { queryCache } from '@/index';
import { ElectronSyncAdapter, createElectronSharedCacheSynchronizer } from '@/predefine/electronSyncAdapter';
import { NodeSyncAdapter, createNodeSharedCacheSynchronizer } from '@/predefine/nodeSyncAdapter';
import { forEach } from '@alova/shared/vars';
import { IpcMain, IpcRenderer } from 'electron';
import EventEmitter from 'events';
import { getAlovaInstance } from '~/test/utils';

let eventEmitter: EventEmitter;

// mock IPC behaviour
beforeEach(() => {
  eventEmitter = new EventEmitter();
  createSharedCacheSynchronizer(
    createSyncAdapter({
      send(event) {
        eventEmitter.emit('to-client', event);
      },
      receive(handler) {
        eventEmitter.on('to-main', event => handler(event));
      }
    })
  );
});
afterEach(() => eventEmitter.removeAllListeners());

const createSharedL1CacheAdapter = (scope?: string) => {
  const syncAdapter = createSyncAdapter({
    send(event) {
      eventEmitter.emit('to-main', event);
    },
    receive(handler) {
      eventEmitter.on('to-client', event => handler(event));
    }
  });
  return createDefaultSharedCacheAdapter(syncAdapter, createDefaultL1CacheAdapter(), {
    scope
  });
};

const createSharedCacheAlova = () =>
  getAlovaInstance({
    id: 1,
    l1Cache: createSharedL1CacheAdapter(),
    responseExpect: r => r.json()
  });

const createNonSharedCacheAlova = () =>
  getAlovaInstance({
    id: 1,
    responseExpect: r => r.json()
  });

const createFakeElectronExports = () => {
  const ipcMain = {
    on: jest.fn((name, handler) => eventEmitter.on(name, handler)),
    emit: jest.fn((name, payload) => eventEmitter.emit(name, { sender: ipcMain }, payload))
  } as unknown as IpcMain;
  const ipcRenderer = {
    on: jest.fn((name, handler) => eventEmitter.on(name, handler)),
    emit: jest.fn((name, payload) => eventEmitter.emit(name, { sender: ipcRenderer }, payload))
  } as unknown as IpcRenderer;

  return {
    ipcMain,
    ipcRenderer
  };
};

describe('shared cache', () => {
  test('should share data between same scope', async () => {
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
  });

  test('should share cache between alova instances with shared cache enabled', async () => {
    const alovaA = createSharedCacheAlova();
    const alovaB = createSharedCacheAlova();
    const GetA = alovaA.Get('/unit-test', {
      transformData: ({ data }: Result) => data
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

  test('should share cache between same scope in electron', async () => {
    const { ipcMain, ipcRenderer } = createFakeElectronExports();

    // simulate init operation in the main procress
    createElectronSharedCacheSynchronizer(ipcMain);

    const alovaA = getAlovaInstance({
      id: 1,
      l1Cache: createDefaultSharedCacheAdapter(ElectronSyncAdapter(ipcRenderer)),
      responseExpect: r => r.json()
    });
    const alovaB = getAlovaInstance({
      id: 1,
      l1Cache: createDefaultSharedCacheAdapter(ElectronSyncAdapter(ipcRenderer)),
      responseExpect: r => r.json()
    });
    const alovaC = getAlovaInstance({
      id: 2,
      l1Cache: createDefaultSharedCacheAdapter(ElectronSyncAdapter(ipcRenderer)),
      responseExpect: r => r.json()
    });

    const GetA = alovaA.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    await GetA;

    const cache = await queryCache(GetA);
    expect(cache).not.toBeUndefined();
    expect(await queryCache(alovaB.Get('/unit-test'))).toStrictEqual(cache);

    expect(await queryCache(alovaC.Get('/unit-test'))).toBeUndefined();
  });

  test('should share cache between same scope in node', async () => {
    // simulate init operation in the main procress
    const stopServer = await createNodeSharedCacheSynchronizer();

    const stopHandler: (() => void)[] = [];

    const alovaA = getAlovaInstance({
      id: 1,
      l1Cache: createDefaultSharedCacheAdapter(NodeSyncAdapter(stop => stopHandler.push(stop))),
      responseExpect: r => r.json()
    });
    const alovaB = getAlovaInstance({
      id: 1,
      l1Cache: createDefaultSharedCacheAdapter(NodeSyncAdapter(stop => stopHandler.push(stop))),
      responseExpect: r => r.json()
    });
    const alovaC = getAlovaInstance({
      id: 2,
      l1Cache: createDefaultSharedCacheAdapter(NodeSyncAdapter(stop => stopHandler.push(stop))),
      responseExpect: r => r.json()
    });

    const GetA = alovaA.Get('/unit-test', {
      transformData: ({ data }: Result) => data
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
    const stopServer = await createNodeSharedCacheSynchronizer();

    const stopHandler: (() => void)[] = [];
    const mockSend = jest.fn();
    const mockReceive = jest.fn();

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
      l1Cache: createDefaultSharedCacheAdapter(createMockNodeSyncAdapter()),
      responseExpect: r => r.json()
    });
    const alovaB = getAlovaInstance({
      id: 1,
      l1Cache: createDefaultSharedCacheAdapter(createMockNodeSyncAdapter()),
      responseExpect: r => r.json()
    });
    const alovaC = getAlovaInstance({
      id: 2,
      l1Cache: createDefaultSharedCacheAdapter(createMockNodeSyncAdapter()),
      responseExpect: r => r.json()
    });

    // waiting for cache sync.
    await delay(50);

    // 3 init events
    expect(mockSend).toHaveBeenCalledTimes(3);
    expect(mockReceive).toHaveBeenCalledTimes(3);
    expect(mockReceive).toHaveBeenLastCalledWith({ senderID: '', type: 'init', key: '', value: '{}' });

    const GetA = alovaA.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    await GetA;

    const GetB = alovaC.Get('/unit-test', {
      transformData: ({ data }: Result) => data,
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
