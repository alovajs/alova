# Redis Storage Adapter for Alova

<p align="center">
<img width="200px" src="https://alova.js.org/img/logo-text-vertical.svg" />
</p>

<p align="center"><b>Workflow-Streamlined next-generation request tools.<br />Extremely improve your API using efficiency and save brainpower Just one step</b></p>

---

This package provides a Redis storage adapter for Alova.js using ioredis.

## Installation

```bash
npm install @alova/storage-redis ioredis
```

## Usage

```javascript
import RedisStorageAdapter from '@alova/storage-redis';
import Redis from 'ioredis';

// Create Redis client instance
const redisOptions = {
  host: 'localhost',
  port: 6379,
  // other ioredis options...
  keyPrefix: 'alova:' // optional, default is 'alova:'
};

// Create storage adapter
const storageAdapter = new RedisStorageAdapter(redisOptions);

// Use with Alova
const alovaInstance = createAlova({
  // ...other options
  cacheAdapter: storageAdapter
});
```

## Configuration Options

The adapter accepts all [ioredis options](https://github.com/luin/ioredis/blob/master/API.md#new-redisport-host-options) plus:

- `keyPrefix`: String to prefix all keys (default: 'alova:')

## Methods

The adapter implements all required methods of `AlovaGlobalCacheAdapter`:

- `set(key: string, value: any)`
- `get<T>(key: string): Promise<T | undefined>`
- `remove(key: string)`
- `clear()`
