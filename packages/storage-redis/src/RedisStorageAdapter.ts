import { isArray, isNumber } from '@alova/shared';
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
    const now = Date.now();
    const redisKey = this._getKey(key);
    let ttlArg: any[] | undefined;

    if (isArray(value) && isNumber(value[1]) && value[1] > now) {
      // if value is an array like [data, expireTimestamp], set the expire time according to the expireTimestamp
      const expireTs = value[1];
      const ttl = expireTs - now;
      if (ttl > 0) {
        ttlArg = ['PX', ttl];
      }
    }
    await this.client.set(redisKey, JSON.stringify(value), ...(ttlArg || []));
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
