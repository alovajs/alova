import atomize from '@/hooks/atomize';
import { AlovaStorageAdapterLocker, createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import { Result } from 'root/testUtils';

let returnLocker = true;
const locker = {
  lock: vi.fn().mockImplementation(() => Promise.resolve()),
  unlock: vi.fn().mockImplementation(() => Promise.resolve())
} as AlovaStorageAdapterLocker;
// Mock storage adapter
class MockStorageAdapter {
  private storage = new Map<string, any>();

  async get<T = any>(key: string): Promise<T | undefined> {
    return this.storage.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    this.storage.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.storage.delete(key);
  }

  get locker() {
    if (!returnLocker) {
      return undefined;
    }
    return locker;
  }

  clear() {
    this.storage.clear();
  }
}

const baseURL = process.env.NODE_BASE_URL as string;
const alovaInst = createAlova({
  baseURL,
  requestAdapter: adapterFetch(),
  responded: r => r.json(),
  cacheFor: null,
  l2Cache: new MockStorageAdapter() // 使用 mock 的存储适配器
});
const method = alovaInst.Get<Result>('/unit-test');

describe('atomize hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    returnLocker = true;
  });

  test('should throw error if locker is not set', async () => {
    // 临时移除 locker，模拟未设置的情况
    returnLocker = false;
    expect(() => atomize(method)).toThrowError(
      'expect set `@alova/storage-redis` or `@alova/storage-file` as l2Cache of alova instance.'
    );
  });

  test('should acquire lock and send request', async () => {
    const hookedMethod = atomize(method);
    const response = await hookedMethod;

    expect(locker.lock).toHaveBeenCalledWith('default');
    expect(locker.unlock).toHaveBeenCalledWith('default');
    expect(response.code).toBe(200);
  });

  test('should retry lock acquisition until timeout', async () => {
    vi.mocked(locker.lock).mockRejectedValue(new Error('Lock failed'));
    const hookedMethod = atomize(method, { timeout: 1000, interval: 100 });

    await expect(hookedMethod).rejects.toThrowError('Failed to acquire lock within 1000ms');
    expect(locker.lock).toHaveBeenCalledTimes(10); // 1000ms / 100ms = 10 次尝试
  });

  test('should unlock even if request fails', async () => {
    vi.mocked(locker.lock).mockResolvedValue(undefined);

    const hookedMethod = atomize(alovaInst.Get('/unit-test-error'));
    await expect(hookedMethod.send()).rejects.toThrowError('Failed to fetch');
    expect(locker.unlock).toHaveBeenCalledWith('default');
  });

  test('should use custom channel name', async () => {
    const channel = 'custom-channel';
    vi.mocked(locker.lock).mockResolvedValue(undefined);
    const hookedMethod = atomize(method, { channel });
    await hookedMethod.send();

    expect(locker.lock).toHaveBeenCalledWith(channel);
    expect(locker.unlock).toHaveBeenCalledWith(channel);
  });

  test('should handle multiple concurrent requests competing for the same lock', async () => {
    // 重置 mock 以跟踪调用次数
    let locked = false;
    const mockLock = async () => {
      if (locked) {
        throw new Error('Lock busy');
      }
      locked = true;
    };
    const mockUnlock = async () => {
      locked = false;
    };
    vi.mocked(locker.lock).mockImplementation(mockLock);
    vi.mocked(locker.unlock).mockImplementation(mockUnlock);

    const method = alovaInst.Get<Result>('/unit-test-1s');

    const hookedMethod1 = atomize(method, { timeout: 500, interval: 100 });
    const hookedMethod2 = atomize(method, { timeout: 1200, interval: 100 });

    // 并发执行三个请求
    const results = await Promise.allSettled([hookedMethod1, hookedMethod2]);

    // 所有请求都应该成功
    results.forEach(result => {
      expect(result.status).toBe('fulfilled');
      if (result.status === 'fulfilled') {
        expect(result.value.code).toBe(200);
      }
    });

    // 请求1锁定1次，请求2锁定失败10次，最后1次锁定成功
    expect(locker.lock).toHaveBeenCalledTimes(12);
    expect(locker.unlock).toHaveBeenCalledTimes(2);

    vi.mocked(locker.lock).mockReset().mockImplementation(mockLock);
    vi.mocked(locker.unlock).mockReset().mockImplementation(mockUnlock);
    const hookedMethod3 = atomize(method, { timeout: 500, interval: 100 });
    const hookedMethod4 = atomize(method, { timeout: 500, interval: 100 });

    await Promise.allSettled([hookedMethod3, hookedMethod4]);
    // 请求1锁定1次，请求2锁定失败5
    expect(locker.lock).toHaveBeenCalledTimes(6);
    expect(locker.unlock).toHaveBeenCalledTimes(1);
  });

  test('should handle lock competition with different channels', async () => {
    const channel1 = 'channel1';
    const channel2 = 'channel2';

    // 记录锁的获取顺序
    const lockOrder: string[] = [];

    vi.mocked(locker.lock).mockImplementation(async (resource: string | string[]) => {
      lockOrder.push(resource as string);
    });

    const hookedMethod1 = atomize(method, { channel: channel1 });
    const hookedMethod2 = atomize(method, { channel: channel2 });
    const hookedMethod3 = atomize(method, { channel: channel1 });

    // 并发执行三个请求，两个使用 channel1，一个使用 channel2
    const results = await Promise.allSettled([hookedMethod1, hookedMethod2, hookedMethod3]);

    // 所有请求都应该成功
    results.forEach(result => {
      expect(result.status).toBe('fulfilled');
      if (result.status === 'fulfilled') {
        expect(result.value.code).toBe(200);
      }
    });

    // 验证不同通道的锁是独立管理的
    expect(lockOrder).toContain(channel1);
    expect(lockOrder).toContain(channel2);

    // 验证每个通道都被正确解锁
    expect(locker.unlock).toHaveBeenCalledWith(channel1);
    expect(locker.unlock).toHaveBeenCalledWith(channel2);
  });
});
