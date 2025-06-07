import { AlovaGlobalCacheAdapter } from 'alova';
import Redis, { RedisOptions } from 'ioredis';

interface RedisStorageCommonOptions {
  /**
   * Redis connection key prefix
   * @default 'alova:'
   */
  keyPrefix?: string;
}

interface RedisStorageAdapterOptions extends RedisStorageCommonOptions, RedisOptions {}

interface RedisStorageInstance extends RedisStorageCommonOptions {
  client: Redis;
}

class RedisStorageAdapter implements AlovaGlobalCacheAdapter {
  public name = 'adapterRedis';
  public client: Redis;
  private keyPrefix: string;

  constructor(config: RedisStorageAdapterOptions | RedisStorageInstance) {
    const { client, keyPrefix } = config as RedisStorageInstance;
    if (client instanceof Redis) {
      this.client = client;
    } else {
      const { keyPrefix: prefixUnused, ...redisOptions } = config as RedisStorageAdapterOptions;
      this.client = new Redis(redisOptions);
    }
    this.keyPrefix = keyPrefix || 'alova:';
  }

  private _getKey(key: string) {
    return `${this.keyPrefix}${key}`;
  }

  async set(key: string, value: any) {
    const [data, expireTs] = value;
    const now = Date.now();
    const dataToStore = JSON.stringify(data);

    // Calculate the TTL in milliseconds
    const ttl = expireTs - now;
    if (ttl > 0) {
      await this.client.set(this._getKey(key), dataToStore, 'PX', ttl);
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    const data = await this.client.get(this._getKey(key));
    return data ? (JSON.parse(data) as T) : undefined;
  }

  async remove(key: string) {
    await this.client.del(this._getKey(key));
  }

  async clear() {
    // eslint-disable-next-line
    console.error('[adapter:redis]redis cache clear is not allowed');
  }
}

export default RedisStorageAdapter;
