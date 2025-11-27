import { AlovaError, isArray } from '@alova/shared';
import { AlovaStorageAdapterLocker } from 'alova';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import lockfile, { LockOptions } from 'proper-lockfile';

const preprocessPath = (resource: string | string[], directory: string) => {
  const normalizedResource = isArray(resource) ? resource.join('-') : resource;
  const lockPath = path.join(directory, normalizedResource, normalizedResource);
  return {
    normalizedResource,
    lockPath
  };
};

const errorPrefix = 'storage:file';
class FileLocker implements AlovaStorageAdapterLocker {
  private directory: string;
  private currentResource: string | null = null;
  public options?: LockOptions;

  constructor(directory: string, options?: LockOptions) {
    this.directory = directory;
    this.options = options;
  }

  async lock(resource: string | string[]): Promise<void> {
    const { normalizedResource, lockPath } = preprocessPath(resource, this.directory);
    // ensure directory exists before attempting to lock
    await fs.mkdir(this.options?.realpath === false ? this.directory : lockPath, { recursive: true });

    await lockfile.lock(lockPath, this.options);
    this.currentResource = normalizedResource;
  }

  async unlock(resource: string | string[]): Promise<void> {
    const { normalizedResource, lockPath } = preprocessPath(resource, this.directory);
    try {
      // Check if the lock exists and unlock it
      await lockfile.unlock(lockPath, this.options);
    } catch (error: any) {
      // If lock doesn't exist, it's already unlocked
      if (error.code !== 'ENOENT') {
        throw new AlovaError(errorPrefix, `Failed to release lock for resource "${normalizedResource}": ${error}`);
      }
    }

    // Clear current tracking if it matches the unlocked resource
    if (this.currentResource === normalizedResource) {
      this.currentResource = null;
    }
  }
}

export default FileLocker;
