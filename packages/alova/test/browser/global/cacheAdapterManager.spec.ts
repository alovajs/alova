import { createAlova, invalidateCache, queryCache, setCache } from '@/index';
import adapterFetch from '@/predefine/adapterFetch';
import { cacheManager } from '@/storage/CacheAdapterManager';
import { AlovaGlobalCacheAdapter } from '~/typings';

const createMockAdapter = (): AlovaGlobalCacheAdapter => {
  let store: Record<string, any> = {};
  return {
    set(key, value) {
      store[key] = value;
    },
    get: key => store[key],
    remove(key) {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
};

describe('CacheAdapterManager', () => {
  describe('register / unregister / l1 / l2', () => {
    test('register adds and unregister removes adapters from l1 and l2', () => {
      const target = {};
      const l1 = createMockAdapter();
      const l2 = createMockAdapter();

      cacheManager.register(target, l1, l2);
      expect(cacheManager.l1).toContain(l1);
      expect(cacheManager.l2).toContain(l2);

      cacheManager.unregister(target);
      expect(cacheManager.l1).not.toContain(l1);
      expect(cacheManager.l2).not.toContain(l2);
    });

    test('registering the same target twice is a no-op', () => {
      const target = {};
      const l1 = createMockAdapter();
      const l2 = createMockAdapter();

      cacheManager.register(target, l1, l2);
      cacheManager.register(target, l1, l2);

      const l1Hits = cacheManager.l1.filter(a => a === l1);
      const l2Hits = cacheManager.l2.filter(a => a === l2);
      expect(l1Hits).toHaveLength(1);
      expect(l2Hits).toHaveLength(1);

      cacheManager.unregister(target);
    });
  });

  describe('swap-and-pop correctness', () => {
    test('removing entries keeps remaining entries correct (l1 + l2)', () => {
      const t1 = {};
      const t2 = {};
      const t3 = {};
      const l1a = createMockAdapter();
      const l1b = createMockAdapter();
      const l1c = createMockAdapter();
      const l2a = createMockAdapter();
      const l2b = createMockAdapter();
      const l2c = createMockAdapter();

      cacheManager.register(t1, l1a, l2a);
      cacheManager.register(t2, l1b, l2b);
      cacheManager.register(t3, l1c, l2c);

      // Remove middle → t1 and t3 remain
      cacheManager.unregister(t2);
      expect(cacheManager.l1).toContain(l1a);
      expect(cacheManager.l1).toContain(l1c);
      expect(cacheManager.l1).not.toContain(l1b);
      expect(cacheManager.l1).toHaveLength(2);
      expect(cacheManager.l2).toContain(l2a);
      expect(cacheManager.l2).toContain(l2c);
      expect(cacheManager.l2).not.toContain(l2b);
      expect(cacheManager.l2).toHaveLength(2);

      // Remove first (t1) → only t3 remains
      cacheManager.unregister(t1);
      expect(cacheManager.l1).toHaveLength(1);
      expect(cacheManager.l1[0]).toBe(l1c);
      expect(cacheManager.l2).toHaveLength(1);
      expect(cacheManager.l2[0]).toBe(l2c);

      // Remove last (t3) → empty
      cacheManager.unregister(t3);
      expect(cacheManager.l1).toHaveLength(0);
      expect(cacheManager.l2).toHaveLength(0);
    });

    test('unregister is idempotent', () => {
      const target = {};
      cacheManager.register(target, createMockAdapter(), createMockAdapter());
      cacheManager.unregister(target);
      expect(() => cacheManager.unregister(target)).not.toThrow();
    });

    test('can re-register after unregister', () => {
      const target = {};
      const l1 = createMockAdapter();
      const l2 = createMockAdapter();

      cacheManager.register(target, l1, l2);
      cacheManager.unregister(target);
      expect(cacheManager.l1).toHaveLength(0);

      cacheManager.register(target, l1, l2);
      expect(cacheManager.l1).toContain(l1);
      expect(cacheManager.l1).toHaveLength(1);

      cacheManager.unregister(target);
    });

    test('sequential unregister-all keeps arrays consistent', () => {
      const N = 5;
      const targets = Array.from({ length: N }, () => ({}));
      const l1s = targets.map(() => createMockAdapter());
      const l2s = targets.map(() => createMockAdapter());

      targets.forEach((t, i) => cacheManager.register(t, l1s[i], l2s[i]));
      expect(cacheManager.l1).toHaveLength(N);
      expect(cacheManager.l2).toHaveLength(N);

      // Remove in reverse order to exercise different index positions
      for (let i = N - 1; i >= 0; i -= 1) {
        cacheManager.unregister(targets[i]);
      }

      expect(cacheManager.l1).toHaveLength(0);
      expect(cacheManager.l2).toHaveLength(0);
    });
  });

  describe('dedup in l1 / l2 getters', () => {
    test('getters deduplicate independently when adapters are shared across targets', () => {
      const t1 = {};
      const t2 = {};
      const t3 = {};
      const sharedL1 = createMockAdapter();
      const sharedL2 = createMockAdapter();
      const uniqueL1b = createMockAdapter();
      const uniqueL2b = createMockAdapter();

      // t1 + t2 share both l1 and l2, t3 shares only l1
      cacheManager.register(t1, sharedL1, sharedL2);
      cacheManager.register(t2, sharedL1, sharedL2);
      cacheManager.register(t3, sharedL1, uniqueL2b);

      // l1: 3 entries → 1 distinct
      expect(cacheManager.l1).toHaveLength(1);
      expect(cacheManager.l1[0]).toBe(sharedL1);
      // l2: 2 shared + 1 unique → 2 distinct
      expect(cacheManager.l2).toHaveLength(2);
      expect(cacheManager.l2).toContain(sharedL2);
      expect(cacheManager.l2).toContain(uniqueL2b);

      // Unregister t1 — shared adapters still visible via remaining targets
      cacheManager.unregister(t1);
      expect(cacheManager.l1).toHaveLength(1);
      expect(cacheManager.l2).toHaveLength(2);

      // Unregister t2
      cacheManager.unregister(t2);
      // t3 still holds sharedL1
      expect(cacheManager.l1).toHaveLength(1);

      // Now add a target with unique l1 to test the other asymmetry
      cacheManager.register(t1, uniqueL1b, createMockAdapter());
      expect(cacheManager.l1).toHaveLength(2);
      expect(cacheManager.l1).toContain(uniqueL1b);

      cacheManager.unregister(t1);
      cacheManager.unregister(t3);
    });
  });

  describe('alova.destroy()', () => {
    test('destroy removes adapters from the global registry', () => {
      const l1 = createMockAdapter();
      const l2 = createMockAdapter();
      const alova = createAlova({
        baseURL: 'http://localhost:3000',
        requestAdapter: adapterFetch(),
        responded: r => r.json(),
        l1Cache: l1,
        l2Cache: l2
      });

      expect(cacheManager.l1).toContain(l1);
      expect(cacheManager.l2).toContain(l2);

      alova.destroy();

      expect(cacheManager.l1).not.toContain(l1);
      expect(cacheManager.l2).not.toContain(l2);
    });

    test('destroy clears the L1 cache', async () => {
      const l1 = createMockAdapter();
      const alova = createAlova({
        baseURL: 'http://localhost:3000',
        requestAdapter: adapterFetch(),
        responded: r => r.json(),
        l1Cache: l1,
        cacheLogger: false
      });
      const Get = alova.Get('/unit-test', {
        cacheFor: 100 * 1000,
        transform: (r: any) => r.data
      });
      await Get;
      expect(await queryCache(Get)).not.toBeUndefined();

      alova.destroy();
      expect(await queryCache(Get)).toBeUndefined();
    });

    test('invalidateCache() without matcher does not affect destroyed instance cache of other instances', async () => {
      const alova1 = createAlova({
        baseURL: 'http://localhost:3000',
        requestAdapter: adapterFetch(),
        responded: r => r.json(),
        cacheLogger: false
      });
      const Get1 = alova1.Get('/unit-test', {
        cacheFor: 100 * 1000,
        transform: (r: any) => r.data
      });
      await Get1;
      expect(await queryCache(Get1)).not.toBeUndefined();

      // Create and destroy a second instance
      const alova2 = createAlova({
        baseURL: 'http://localhost:3000',
        requestAdapter: adapterFetch(),
        responded: r => r.json(),
        cacheLogger: false
      });
      alova2.destroy();

      // invalidateCache() without matcher should still clear alova1's cache
      await invalidateCache();
      expect(await queryCache(Get1)).toBeUndefined();
    });

    test('after destroy, hitCacheBySource in global mode does not affect the destroyed instance', async () => {
      const baseURL = process.env.NODE_BASE_URL as string;
      const l1Alova1 = createMockAdapter();
      const alova1 = createAlova({
        baseURL,
        requestAdapter: adapterFetch(),
        responded: r => r.json(),
        l1Cache: l1Alova1,
        cacheLogger: false
      });

      const l1Alova2 = createMockAdapter();
      const alova2 = createAlova({
        baseURL,
        requestAdapter: adapterFetch(),
        responded: r => r.json(),
        l1Cache: l1Alova2,
        cacheLogger: false
      });

      // Set cache in alova2's l1 adapter manually
      await setCache(alova2.Get('/unit-test', { cacheFor: 100 * 1000 }), { test: 'data' } as any);

      // Destroy alova2
      alova2.destroy();
      expect(cacheManager.l1).not.toContain(l1Alova2);

      // Now if alova1 sends a request, hitCacheBySource with global mode
      // should NOT iterate over alova2's adapter (it's been unregistered)
      const targetGet = alova1.Get('/unit-test', {
        cacheFor: 100 * 1000,
        hitSource: 'source-post',
        transform: (r: any) => r.data
      });
      await targetGet;
      expect(await queryCache(targetGet)).not.toBeUndefined();

      // Send a source post from alova1 that should hit targetGet
      const sourcePost = alova1.Post('/unit-test', { a: 1 }, { name: 'source-post' });
      await sourcePost;

      // targetGet's cache should be invalidated (alova1 is still registered)
      expect(await queryCache(targetGet)).toBeUndefined();
    });
  });

  describe('memory leak prevention', () => {
    test('creating and destroying many instances keeps adapter list bounded', () => {
      const initialL1 = cacheManager.l1.length;
      const initialL2 = cacheManager.l2.length;
      const N = 10;

      const instances = Array.from({ length: N }, () =>
        createAlova({
          baseURL: 'http://localhost:3000',
          requestAdapter: adapterFetch(),
          responded: r => r.json(),
          cacheLogger: false
        })
      );

      expect(cacheManager.l1.length).toBe(initialL1 + N);
      expect(cacheManager.l2.length).toBe(initialL2 + N);

      instances.forEach(inst => inst.destroy());

      expect(cacheManager.l1.length).toBe(initialL1);
      expect(cacheManager.l2.length).toBe(initialL2);
    });
  });
});
