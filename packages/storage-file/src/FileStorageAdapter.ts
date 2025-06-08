import { QueueCallback, usePromise } from '@alova/shared';
import { AlovaGlobalCacheAdapter } from 'alova';
import { promises as fs } from 'node:fs';
import path from 'node:path';

interface FileStorageAdapterOptions {
  /**
   * The directory where the cache files will be stored.
   * @required true
   */
  directory: string;
}

class FileStorageAdapter implements AlovaGlobalCacheAdapter {
  private directory: string;
  private queue = new QueueCallback();

  constructor({ directory }: FileStorageAdapterOptions) {
    this.directory = directory;
    fs.mkdir(this.directory, { recursive: true });
  }

  private _getFilePath(key: string) {
    return path.join(this.directory, `${key}.json`);
  }

  async set(key: string, value: any) {
    const { promise, resolve, reject } = usePromise<void>();

    // ensure the execute timing with queue in the same process
    this.queue.queueCallback(async () => {
      const filePath = this._getFilePath(key);
      const tempPath = `${filePath}_${process.pid}.tmp`;
      const data = JSON.stringify(value);

      try {
        // write temp file first
        await fs.writeFile(tempPath, data, 'utf8');
        // then, move temp file to target path
        await fs.rename(tempPath, filePath);
        resolve();
      } catch (error) {
        // unlink file in case of error
        await fs.unlink(tempPath).catch(() => {});
        reject(error);
      }
    });
    return promise;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const filePath = this._getFilePath(key);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data) as T;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return undefined;
      }
      throw error;
    }
  }

  async remove(key: string) {
    const filePath = this._getFilePath(key);
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async clear() {
    const files = await fs.readdir(this.directory);
    const unlinkPromises = files
      .filter(file => !file.startsWith('.')) // ignore hidden files
      .map(async file => {
        const filePath = path.join(this.directory, file);
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          return fs.unlink(filePath);
        }
      });
    await Promise.all(unlinkPromises);
  }
}

export default FileStorageAdapter;
