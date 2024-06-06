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
  return createDefaultSharedCacheAdapter(createDefaultL1CacheAdapter(), syncAdapter, {
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
});
