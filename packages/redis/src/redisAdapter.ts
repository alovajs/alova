import { AlovaGlobalCacheAdapter } from 'alova';
import { RedisClientOptions, RedisFlushModes, createClient } from 'redis';
import { useQueuedPromise } from './queuedPromise';

export type RedisAdapterConfig = RedisClientOptions;

export function createRedisAdapter(config: RedisAdapterConfig) {
  const { queue, withPromise } = useQueuedPromise();
  const redis = createClient(config);

  redis.connect();
  redis.on('connect', () => queue.tryRunQueueCallback());

  return {
    get: withPromise((key: string) => redis.get(key)),
    set: withPromise((key: string, value: any) => redis.set(key, value).then(() => {})),
    remove: withPromise((key: string) => redis.del(key).then(() => {})),
    clear: withPromise(() => redis.flushDb(RedisFlushModes.ASYNC).then(() => {}))
  } as AlovaGlobalCacheAdapter;
}
