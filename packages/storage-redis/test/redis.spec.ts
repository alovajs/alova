import RedisStorageAdapter from '@/RedisStorageAdapter';
import { createAlova, queryCache } from 'alova';
import adapterFetch from 'alova/fetch';
import Redis from 'ioredis';
import { Mock } from 'vitest';

vi.mock('ioredis', () => {
  const data: Record<string, string> = {};

  const RedisMock = vi.fn(() => ({
    set: vi.fn((key: string, value: string) => {
      data[key] = value;
      return Promise.resolve('OK');
    }),
    get: vi.fn((key: string) => Promise.resolve(data[key] || null)),
    del: vi.fn((key: string) => {
      const count = key in data ? 1 : 0;
      delete data[key];
      return Promise.resolve(count);
    }),
    // 可选：添加一个清空所有数据的方法用于测试
    flushAll: vi.fn(() => {
      Object.keys(data).forEach(key => delete data[key]);
      return Promise.resolve('OK');
    }),
    // 可选：添加一个获取所有数据的方法用于测试验证
    getAll: vi.fn(() => Promise.resolve({ ...data }))
  }));

  return { default: RedisMock };
});

describe('RedisStorageAdapter', () => {
  let adapter: RedisStorageAdapter;
  const mockOptions = { host: 'localhost', port: 6379 };

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new RedisStorageAdapter(mockOptions);
  });

  test('constructor should initialize with default keyPrefix when not provided', () => {
    const defaultAdapter = new RedisStorageAdapter(mockOptions);
    expect(defaultAdapter).toBeInstanceOf(RedisStorageAdapter);
    expect(Redis).toHaveBeenCalledWith(mockOptions);
  });

  test('constructor should use custom keyPrefix when provided', async () => {
    const customPrefixAdapter = new RedisStorageAdapter({ ...mockOptions, keyPrefix: 'custom:' });
    await customPrefixAdapter.set('test', [{ data: 'value' }, Date.now() + 1000]);
    expect(customPrefixAdapter.client.set).toHaveBeenCalledWith(
      'custom:test',
      expect.any(String),
      'PX',
      expect.any(Number)
    );
  });

  test('set should store data with TTL when expireTs is in future', async () => {
    const mockDate = vi.spyOn(Date, 'now').mockReturnValue(1000);
    const data = { key: 'value' };
    const expireTs = 3000;

    await adapter.set('test', [data, expireTs]);

    expect(adapter.client.set).toHaveBeenCalledWith('alova:test', JSON.stringify([data, expireTs]), 'PX', 2000);
    mockDate.mockRestore();
  });

  test('set should not store data when expireTs is in past', async () => {
    const mockDate = vi.spyOn(Date, 'now').mockReturnValue(3000);
    const data = { key: 'value' };
    const expireTs = 2000;

    await adapter.set('test', [data, expireTs]);

    expect(adapter.client.set).not.toHaveBeenCalled();
    mockDate.mockRestore();
  });

  test('get should return parsed data when key exists', async () => {
    const testData = { key: 'value' };
    (adapter.client.get as Mock).mockResolvedValueOnce(JSON.stringify(testData));

    const result = await adapter.get<{ key: string }>('test');
    expect(result).toEqual(testData);
    expect(adapter.client.get).toHaveBeenCalledWith('alova:test');
  });

  test('get should return undefined when key does not exist', async () => {
    const result = await adapter.get('test_not_exist__');
    expect(result).toBeUndefined();
  });

  test('remove should delete the specified key', async () => {
    await adapter.remove('test');
    expect(adapter.client.del).toHaveBeenCalledWith('alova:test');
  });

  test('clear should log error message and not perform any operation', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await adapter.clear();

    expect(consoleError).toHaveBeenCalledWith('[adapter:redis]redis cache clear is not allowed');
    expect(adapter.client.del).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  test('name should return the adapter name', async () => {
    const alova = createAlova({
      baseURL: process.env.NODE_BASE_URL,
      requestAdapter: adapterFetch(),
      responded: response => response.json(),
      l1Cache: new RedisStorageAdapter(mockOptions)
    });

    const method = alova.Get('/unit-test');
    const res = await method;
    await expect(queryCache(method)).resolves.toEqual(res);
  });
});
