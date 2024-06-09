import { createDefaultL1CacheAdapter } from '@/defaults/cacheAdapter';
import {
  createSharedCacheSynchronizer,
  createDefaultSharedCacheAdapter,
  createSyncAdapter
} from '@/defaults/sharedCacheAdapter';
import { Result, delay } from 'root/testUtils';

import EventEmitter from 'events';
import { queryCache } from '@/index';
import { getAlovaInstance } from '~/test/utils';
import { IpcMain, IpcRenderer } from 'electron';
import { ElectronSyncAdapter, createElectronSharedCacheSynchronizer } from '@/predefine/electronSyncAdapter';

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

  test('should default has 300000ms for GET request', async () => {
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

  test('should share data between same scope in electron', async () => {
    const { ipcMain, ipcRenderer } = createFakeElectronExports();

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

    // simulate init operation in the main procress
    createElectronSharedCacheSynchronizer(ipcMain);

    const GetA = alovaA.Get('/unit-test', {
      transformData: ({ data }: Result) => data
    });
    await GetA;

    const cache = await queryCache(GetA);
    expect(cache).not.toBeUndefined();
    expect(await queryCache(alovaB.Get('/unit-test'))).toStrictEqual(cache);

    expect(await queryCache(alovaC.Get('/unit-test'))).toBeUndefined();
  });
});
