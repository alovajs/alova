import { getAlovaInstance } from '#/utils';
import { invalidateCache } from '@/index';
import { Result } from 'root/testUtils';

beforeEach(() => {
  invalidateCache();
});
describe('cache data on server', () => {
  test("shouldn't check l2 cache in memory mode", async () => {
    const removeFn = vi.fn();
    const alova = getAlovaInstance({
      responseExpect: r => r.json(),
      l2Cache: {
        set: () => {},
        get: () => undefined,
        remove: removeFn,
        clear: () => {}
      }
    });

    const Get = alova.Get('/unit-test', {
      transform: ({ data }: Result) => data
    });
    await Get;
    invalidateCache(Get);
    expect(removeFn).not.toHaveBeenCalled();

    const GetRestore = alova.Get('/unit-test', {
      cacheFor: {
        expire: 10000,
        mode: 'restore'
      },
      transform: ({ data }: Result) => data
    });
    await GetRestore;
    invalidateCache(GetRestore);
    expect(removeFn).toHaveBeenCalledTimes(1);
  });

  test("shouldn't check l2 cache in memory mode when invalidate all cache", async () => {
    const alova = getAlovaInstance({
      responseExpect: r => r.json()
    });

    expect(alova).not.toBeUndefined();
    invalidateCache();
  });
});
