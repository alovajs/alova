import FileStorageAdapter from '@/FileStorageAdapter';
import { promises as fs } from 'fs';
import path from 'node:path';

const testDir = path.join(__dirname, 'test-storage');
let adapter: FileStorageAdapter;

beforeEach(async () => {
  // ensure the existence of test directory
  await fs.mkdir(testDir, { recursive: true });
  adapter = new FileStorageAdapter({ directory: testDir });
});
afterEach(async () => {
  // clear all files in test directory
  await adapter.clear();
});
afterAll(async () => {
  // remove test directory
  await fs.rm(testDir, { recursive: true, force: true });
});

describe('FileStorageAdapter', () => {
  test('should set and get value correctly', async () => {
    const key = 'test-key';
    const value = { foo: 'bar' };

    await adapter.set(key, value);
    const result = await adapter.get(key);
    expect(result).toStrictEqual(value);
  });

  test('should return undefined for non-existent key', async () => {
    const result = await adapter.get('non-existent');
    expect(result).toBeUndefined();
  });

  test('should remove key correctly', async () => {
    const key = 'test-key';
    await adapter.set(key, {});
    await adapter.remove(key);
    const result = await adapter.get(key);
    expect(result).toBeUndefined();
  });

  test('should clear all keys', async () => {
    await adapter.set('key1', {});
    await adapter.set('key2', {});
    await adapter.clear();

    expect(await adapter.get('key1')).toBeUndefined();
    expect(await adapter.get('key2')).toBeUndefined();
  });

  test('should use specified directory', async () => {
    const customDir = path.join(testDir, 'custom');
    const customAdapter = new FileStorageAdapter({ directory: customDir });

    await customAdapter.set('test', {});
    const files = await fs.readdir(customDir);
    expect(files).toContain('test.json');
    await customAdapter.clear();
  });

  test('should handle concurrent operations', async () => {
    const key = 'concurrent-mp';
    const writeTimes = 100;
    const promises = Array(writeTimes)
      .fill(0)
      .map((_, i) => adapter.set(key, { count: i }));

    await Promise.all(promises);
    const result = await adapter.get<{ count: number }>(key);
    expect(result?.count).toBe(writeTimes - 1);
  });
});
