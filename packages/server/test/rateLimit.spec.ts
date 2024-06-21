import createRateLimiter from '@/hooks/rateLimit';
import { createAlova } from 'alova';
import GlobalFetch from 'alova/fetch';

jest.useFakeTimers();

const getAlovaInstance = () => {
  const alova = createAlova({
    baseURL: process.env.NODE_BASE_URL,
    requestAdapter: GlobalFetch(),
    responded: r => r.json()
  });

  // l2Cache is null in node by default
  alova.options.l2Cache = alova.l1Cache;
  return alova;
};

const createDefaultRateLimiter = () =>
  createRateLimiter({
    points: 4,
    duration: 60 * 1000, // 60 s
    blockDuration: 100 * 1000 // 100 s
  });

describe('rateLimit', () => {
  const alova = getAlovaInstance();
  const limiter = createDefaultRateLimiter();

  test('should have null initial value', async () => {
    const limitedGetter = limiter(alova.Get('/unit-test'));
    await expect(limitedGetter.get()).resolves.toBeNull();
  });

  test('should consume 1 point', async () => {
    const limitedGetter = limiter(alova.Get('/unit-test'));

    await limitedGetter.consume().then(res =>
      expect(res.toJSON()).toEqual({
        remainingPoints: 3,
        msBeforeNext: 60 * 1000,
        consumedPoints: 1,
        isFirstInDuration: true
      })
    );

    const res = await limitedGetter.get();
    expect(res?.consumedPoints).toBe(1);
    expect(res?.isFirstInDuration).toBe(false);
    expect(res?.remainingPoints).toBe(3);
  });

  test('should be rejected and blocked when consumed more than points', async () => {
    const limitedGetter = limiter(alova.Get('/unit-test'));

    await expect(() => limitedGetter.consume()).not.toThrow();

    const consumeRes = await limitedGetter.consume(4).catch(e => e.toJSON());
    expect(consumeRes).toEqual({
      remainingPoints: 0,
      msBeforeNext: 100 * 1000, // be blocked for consuming too many points
      consumedPoints: 5,
      isFirstInDuration: false
    });

    // Fast forward to after the block duration
    await jest.setSystemTime(Date.now() + 100 * 1000);

    // unblock now
    await expect(limitedGetter.get()).resolves.toBeNull();
  });

  test('use key function', async () => {
    let isJerry = false;

    const limitedGetter = limiter(alova.Get('/unit-test'), {
      key: () => (isJerry ? 'Jerry' : 'Tom')
    });

    let consumeRes = await limitedGetter.consume(5).catch(e => e.toJSON());
    expect(consumeRes).toMatchObject({
      remainingPoints: 0,
      msBeforeNext: 100 * 1000, // be blocked for consuming too many points
      consumedPoints: 5
    });

    isJerry = true;

    // Jerry should not be blocked.
    await limitedGetter.consume().then(res =>
      expect(res.toJSON()).toEqual({
        remainingPoints: 3,
        msBeforeNext: 60 * 1000,
        consumedPoints: 1,
        isFirstInDuration: true
      })
    );

    isJerry = false;

    // Poor Tom is still blocked.
    consumeRes = await limitedGetter.consume().catch(e => e.toJSON());
    expect(consumeRes).toMatchObject({
      remainingPoints: 0,
      msBeforeNext: 100 * 1000,
      consumedPoints: 6
    });
  });
});
