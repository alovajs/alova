import HookedMethod from '@/HookedMethod';
import { createServerHook } from '@/helper';
import { createAssert } from '@alova/shared';
import { AlovaGenerics, AlovaStorageAdapterLocker, Method } from 'alova';

export interface AtomizeOptions {
  /**
   * The channel name to lock
   */
  channel?: string | string[];
  /**
   * Timeout for attempting to acquire the lock, ms
   * @default 5000
   */
  timeout?: number;
  /**
   * Interval for attempting to acquire the lock, ms
   * @default 100
   */
  interval?: number;
}

const assert: ReturnType<typeof createAssert> = createAssert('atomize');
const atomize = createServerHook(<AG extends AlovaGenerics>(method: Method<AG>, options: AtomizeOptions = {}) => {
  const { channel = 'default', timeout = 5000, interval = 100 } = options;
  const locker = method.context.l2Cache?.locker as AlovaStorageAdapterLocker;

  assert(locker, 'expect set `@alova/storage-redis` or `@alova/storage-file` as l2Cache of alova instance.');
  return new HookedMethod(method, async forceRequest => {
    const startTime = Date.now();
    let locked = false;

    while (Date.now() - startTime < timeout) {
      try {
        await locker.lock(channel);
        locked = true;
        if (locked) break;
      } catch {
        // Ignore lock errors during retry
      }
      await new Promise<void>(resolve => {
        setTimeout(resolve, interval);
      });
    }

    assert(locked, `Failed to acquire lock within ${timeout}ms`);

    try {
      const response = await method.send(forceRequest);
      return response;
    } finally {
      await locker.unlock(channel);
    }
  });
});

export default atomize;
