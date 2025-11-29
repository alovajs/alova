import { FilterRedisClient, RedisLocker } from '@/RedisLocker';
import Redis, { Cluster } from 'ioredis';

// Mock @sesamecare-oss/redlock
vi.mock('@sesamecare-oss/redlock', () => {
  const mockLockRelease = vi.fn().mockResolvedValue(undefined);
  const mockLock = {
    release: mockLockRelease
  };

  const mockAcquire = vi.fn().mockResolvedValue(mockLock);

  // Create a proper Redlock mock constructor
  const mockRedlock = vi.fn().mockImplementation((clients, options) => {
    const redlockInstance = {
      acquire: mockAcquire,
      clients,
      options
    };
    // Ensure the returned object is an instance of the constructor
    Object.setPrototypeOf(redlockInstance, mockRedlock.prototype);
    return redlockInstance;
  });

  // Store references globally for test access
  (globalThis as any).__mockAcquire = mockAcquire;
  (globalThis as any).__mockLockRelease = mockLockRelease;
  (globalThis as any).__mockRedlock = mockRedlock;

  return {
    Lock: vi.fn(),
    Redlock: mockRedlock
  };
});

// Mock ioredis
vi.mock('ioredis', () => {
  const mockRedis = vi.fn(() => ({
    status: 'ready',
    options: { host: 'localhost', port: 6379 }
  }));

  const mockCluster = vi.fn(() => {
    const clusterInstance = {
      nodes: vi.fn(() => [
        { status: 'ready', options: { host: 'localhost', port: 6379 } },
        { status: 'ready', options: { host: 'localhost2', port: 6379 } }
      ])
    };
    // Make the instance an instance of mockCluster
    Object.setPrototypeOf(clusterInstance, mockCluster.prototype);
    return clusterInstance;
  });

  return {
    default: mockRedis,
    Cluster: mockCluster
  };
});

describe('RedisLocker', () => {
  let mockRedis: Redis;
  let mockCluster: Cluster;
  let mockRedlock: any;
  let mockAcquire: any;
  let mockLockRelease: any;

  beforeEach(() => {
    // Get the mocked functions from globalThis before restoring all mocks
    mockAcquire = (globalThis as any).__mockAcquire;
    mockLockRelease = (globalThis as any).__mockLockRelease;
    mockRedlock = (globalThis as any).__mockRedlock;

    // Clear mock calls but keep implementations
    vi.clearAllMocks();

    mockRedis = new Redis();
    mockCluster = new Cluster([]);

    // Reset the mock implementations
    mockRedlock.mockImplementation((clients: any[], options: any) => {
      const redlockInstance = {
        acquire: mockAcquire,
        clients,
        options
      };
      Object.setPrototypeOf(redlockInstance, mockRedlock.prototype);
      return redlockInstance;
    });

    // Reset mock implementations for functions that were cleared
    const mockLock = {
      release: mockLockRelease
    };
    mockAcquire.mockResolvedValue(mockLock);

    // Ensure mockLockRelease is properly set up for rejecting in tests
    mockLockRelease.mockResolvedValue(undefined);

    // Ensure instanceof works correctly for mockCluster
    Object.setPrototypeOf(mockCluster, Cluster.prototype);
  });

  describe('Constructor', () => {
    test('should initialize with Redis client and default TTL', () => {
      // eslint-disable-next-line
      new RedisLocker(mockRedis, {});

      expect(mockRedlock).toHaveBeenCalledWith([mockRedis], undefined);
    });

    test('should initialize with Redis client and custom options', () => {
      const options = { retryCount: 3, retryDelay: 100 };
      // eslint-disable-next-line
      new RedisLocker(mockRedis, { options });

      expect(mockRedlock).toHaveBeenCalledWith([mockRedis], options);
    });

    test('should initialize with custom TTL', () => {
      const ttl = 10000;
      const locker = new RedisLocker(mockRedis, { ttl });

      expect((locker as any).ttl).toBe(ttl);
    });

    test('should initialize with Cluster client and filter', () => {
      const filter: FilterRedisClient = client => client.options.host === 'localhost';
      // eslint-disable-next-line
      new RedisLocker(mockCluster, { filter });

      const expectedClients = mockCluster.nodes().filter(filter);
      expect(mockRedlock).toHaveBeenCalledWith(expectedClients, undefined);
    });

    test('should initialize with Cluster client and all options', () => {
      const filter: FilterRedisClient = () => true;
      const options = { retryCount: 2 };
      const ttl = 8000;
      // eslint-disable-next-line
      new RedisLocker(mockCluster, { options, filter, ttl });

      const expectedClients = mockCluster.nodes().filter(filter);
      expect(mockRedlock).toHaveBeenCalledWith(expectedClients, options);
    });

    test('should throw error when no clients available after filtering', () => {
      const filter: FilterRedisClient = () => false;

      expect(() => {
        // eslint-disable-next-line
        new RedisLocker(mockRedis, { filter });
      }).toThrow('No redis client available');
    });

    test('should handle empty filter function', () => {
      // eslint-disable-next-line
      new RedisLocker(mockCluster, { filter: undefined });

      expect(mockRedlock).toHaveBeenCalledWith(mockCluster.nodes(), undefined);
    });
  });

  describe('lock method', () => {
    test('should acquire lock for single resource string', async () => {
      const locker = new RedisLocker(mockRedis, { ttl: 5000 });

      await locker.lock('resource1');

      expect(mockAcquire).toHaveBeenCalledWith(['resource1'], 5000);
    });

    test('should acquire lock for single resource array', async () => {
      const locker = new RedisLocker(mockRedis, { ttl: 3000 });

      await locker.lock(['resource1']);

      expect(mockAcquire).toHaveBeenCalledWith(['resource1'], 3000);
    });

    test('should acquire lock for multiple resources', async () => {
      const locker = new RedisLocker(mockRedis, { ttl: 7000 });

      await locker.lock(['resource1', 'resource2', 'resource3']);

      expect(mockAcquire).toHaveBeenCalledWith(['resource1', 'resource2', 'resource3'], 7000);
    });

    test('should store locks in lockMap after successful acquisition', async () => {
      const locker = new RedisLocker(mockRedis, {});

      await locker.lock('resource1');

      expect((locker as any).lockMap.has('resource1')).toBe(true);
    });

    test('should store multiple locks in lockMap for multiple resources', async () => {
      const locker = new RedisLocker(mockRedis, {});
      const resources = ['resource1', 'resource2'];

      await locker.lock(resources);

      resources.forEach(resource => {
        expect((locker as any).lockMap.has(resource)).toBe(true);
      });
    });

    test('should propagate lock acquisition errors', async () => {
      const locker = new RedisLocker(mockRedis, {});
      const error = new Error('Lock acquisition failed');
      mockAcquire.mockRejectedValue(error);

      await expect(locker.lock('resource1')).rejects.toThrow('Lock acquisition failed');
    });
  });

  describe('unlock method', () => {
    test('should release lock for single resource', async () => {
      const locker = new RedisLocker(mockRedis, {});

      await locker.lock('resource1');
      await locker.unlock('resource1');

      expect(mockLockRelease).toHaveBeenCalled();
      expect((locker as any).lockMap.has('resource1')).toBe(false);
    });

    test('should release locks for multiple resources', async () => {
      const locker = new RedisLocker(mockRedis, {});
      const resources = ['resource1', 'resource2'];

      await locker.lock(resources);
      await locker.unlock(resources);

      expect(mockLockRelease).toHaveBeenCalledTimes(2);
      resources.forEach(resource => {
        expect((locker as any).lockMap.has(resource)).toBe(false);
      });
    });

    test('should handle unlock when no lock is held', async () => {
      const locker = new RedisLocker(mockRedis, {});

      await expect(locker.unlock('nonexistent')).resolves.not.toThrow();
    });

    test('should handle unlock for partially held resources', async () => {
      const locker = new RedisLocker(mockRedis, {});
      const resources = ['resource1', 'resource2'];

      // Only lock one resource
      await locker.lock('resource1');

      // Try to unlock both
      await expect(locker.unlock(resources)).resolves.not.toThrow();

      expect((locker as any).lockMap.has('resource1')).toBe(false);
    });

    test('should propagate lock release errors', async () => {
      const locker = new RedisLocker(mockRedis, {});
      const error = new Error('Lock release failed');
      mockLockRelease.mockRejectedValue(error);

      await locker.lock('resource1');

      await expect(locker.unlock('resource1')).rejects.toThrow('Lock release failed');
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete lock and unlock cycle', async () => {
      const locker = new RedisLocker(mockRedis, { ttl: 1000 });

      // Lock
      await locker.lock('test-resource');
      expect(mockAcquire).toHaveBeenCalledWith(['test-resource'], 1000);
      expect((locker as any).lockMap.has('test-resource')).toBe(true);

      // Unlock
      await locker.unlock('test-resource');
      expect(mockLockRelease).toHaveBeenCalled();
      expect((locker as any).lockMap.has('test-resource')).toBe(false);
    });

    test('should handle multiple sequential lock operations', async () => {
      const locker = new RedisLocker(mockRedis, { ttl: 2000 });

      // First lock cycle
      await locker.lock('resource1');
      await locker.unlock('resource1');

      // Second lock cycle
      await locker.lock('resource2');
      await locker.unlock('resource2');

      expect(mockAcquire).toHaveBeenCalledTimes(2);
      expect(mockLockRelease).toHaveBeenCalledTimes(2);
    });

    test('should work with filtered cluster clients', async () => {
      const filter: FilterRedisClient = client => client.options.host === 'localhost';

      const locker = new RedisLocker(mockCluster, { filter, ttl: 4000 });
      const expectedClients = mockCluster.nodes().filter(filter);

      await locker.lock(['resource1', 'resource2']);

      expect(mockRedlock).toHaveBeenCalledWith(expectedClients, undefined);
      expect(mockAcquire).toHaveBeenCalledWith(['resource1', 'resource2'], 4000);
    });
  });

  describe('Edge cases', () => {
    test('should handle empty resource array', async () => {
      const locker = new RedisLocker(mockRedis, { ttl: 1000 });

      await locker.lock([]);

      expect(mockAcquire).toHaveBeenCalledWith([], 1000);
    });

    test('should handle very long resource names', async () => {
      const locker = new RedisLocker(mockRedis, { ttl: 1000 });
      const longResource = 'a'.repeat(1000);

      await locker.lock(longResource);

      expect(mockAcquire).toHaveBeenCalledWith([longResource], 1000);
    });

    test('should handle zero TTL', async () => {
      const locker = new RedisLocker(mockRedis, { ttl: 0 });

      await locker.lock('resource');

      expect(mockAcquire).toHaveBeenCalledWith(['resource'], 0);
    });

    test('should handle negative TTL', async () => {
      const locker = new RedisLocker(mockRedis, { ttl: -1000 });

      await locker.lock('resource');

      expect(mockAcquire).toHaveBeenCalledWith(['resource'], -1000);
    });
  });
});
