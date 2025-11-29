import { createAssert, isArray, isFn } from '@alova/shared';
import type { Settings as RedlockSettings } from '@sesamecare-oss/redlock';
import { Lock, Redlock } from '@sesamecare-oss/redlock';
import { AlovaStorageAdapterLocker } from 'alova';
import { Cluster, Redis } from 'ioredis';

interface RedisLockerConfig {
  options?: RedlockSettings;
  filter?: FilterRedisClient;
  ttl?: number;
}
const redisAssert: ReturnType<typeof createAssert> = createAssert('storage:redis');
export type FilterRedisClient = (client: Redis) => boolean;
export class RedisLocker implements AlovaStorageAdapterLocker {
  private redlock: Redlock;
  private lockMap: Map<string, Lock> = new Map();
  public options?: RedlockSettings;
  private ttl: number;

  constructor(client: Redis | Cluster, { options, filter, ttl = 5000 }: RedisLockerConfig) {
    this.options = options;
    this.ttl = ttl;
    let clients = client instanceof Cluster ? client.nodes() : [client];
    clients = isFn(filter) ? clients.filter(filter) : clients;
    redisAssert(clients.length > 0, 'No redis client available');
    this.redlock = new Redlock(clients, options);
  }

  async lock(resource: string | string[]): Promise<void> {
    const resources = isArray(resource) ? resource : [resource];
    const lock = await this.redlock.acquire(resources, this.ttl);
    // save the lock to map
    resources.forEach(res => {
      this.lockMap.set(res, lock);
    });
  }

  async unlock(resource: string | string[]): Promise<void> {
    const resources = isArray(resource) ? resource : [resource];
    // release the lock
    for (const res of resources) {
      const lock = this.lockMap.get(res);
      if (lock) {
        await lock.release();
        this.lockMap.delete(res);
      }
    }
  }
}
