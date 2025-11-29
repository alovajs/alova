import { isArray, isNumber } from '@alova/shared';
import { Settings as RedlockSettings } from '@sesamecare-oss/redlock';
import { AlovaGlobalCacheAdapter } from 'alova';
import Redis, { Cluster, ClusterNode, ClusterOptions, RedisOptions } from 'ioredis';
import { RedisLocker, FilterRedisClient } from './RedisLocker';

export interface RedisStorageCommonOptions {
  /**
   * Redis connection key prefix
   * @default 'alova:'
   */
  keyPrefix?: string;
  /**
   * redlock settings
   * @implements @sesamecare-oss/redlock
   */
  redlockOptions?: RedlockSettings;
  /**
   * filter redis instances from this adapter's redlock
   */
  redlockFilter?: FilterRedisClient;
  /**
   * Time to live for the lock in milliseconds
   * @default 5000
   */
  redlockTTL?: number;
}

export interface RedisStorageAdapterOptions extends RedisStorageCommonOptions, RedisOptions {}

export interface RedisClusterStorageAdapterOptions extends RedisStorageCommonOptions {
  nodes: ClusterNode[];
  options?: ClusterOptions;
}

export interface RedisStorageInstance<T extends Redis | Cluster> extends RedisStorageCommonOptions {
  client: T;
}

type InferClientType<T> =
  T extends RedisStorageInstance<infer U>
    ? U
    : T extends RedisClusterStorageAdapterOptions
      ? Cluster
      : T extends RedisStorageAdapterOptions
        ? Redis
        : never;

class RedisStorageAdapter<
  T extends
    | RedisStorageAdapterOptions
    | RedisClusterStorageAdapterOptions
    | RedisStorageInstance<Redis | Cluster> = RedisStorageAdapterOptions
> implements AlovaGlobalCacheAdapter
{
  public name = 'adapterRedis';
  public client: InferClientType<T>;
  private keyPrefix: string;
  private config: T;
  private _locker?: RedisLocker;

  constructor(config: T) {
    this.config = config;
    const configAsInstance = config as RedisStorageInstance<Redis | Cluster>;
    if ('client' in configAsInstance && configAsInstance.client) {
      this.client = configAsInstance.client as InferClientType<T>;
    } else {
      const configAsOptions = config as RedisStorageAdapterOptions | RedisClusterStorageAdapterOptions;
      if ('nodes' in configAsOptions) {
        // RedisClusterStorageAdapterOptions
        this.client = new Cluster(configAsOptions.nodes, configAsOptions.options) as InferClientType<T>;
      } else {
        // RedisStorageAdapterOptions
        const { keyPrefix: prefixUnused, ...redisOptions } = configAsOptions;
        this.client = new Redis(redisOptions) as InferClientType<T>;
      }
    }

    this.keyPrefix = config.keyPrefix || 'alova:';
  }

  private _getKey(key: string) {
    return `${this.keyPrefix}${key}`;
  }

  get locker() {
    if (!this._locker) {
      const { redlockOptions, redlockFilter, redlockTTL } = this.config;
      this._locker = new RedisLocker(this.client, {
        options: redlockOptions,
        filter: redlockFilter,
        ttl: redlockTTL
      });
    }
    return this._locker;
  }

  async set(key: string, value: any) {
    const now = Date.now();
    const redisKey = this._getKey(key);
    let ttlArg: any[] | undefined;
    if (isArray(value) && isNumber(value[1])) {
      // if value is an array like [data, expireTimestamp], set the expire time according to the expireTimestamp
      const expireTs = value[1];
      ttlArg = ['PX', expireTs - now];
    }

    if (!isArray(ttlArg) || ttlArg[1] > 0) {
      await this.client.set(redisKey, JSON.stringify(value), ...(ttlArg || []));
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
