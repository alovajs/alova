import FileLocker from '@/FileLocker';
import { spawn } from 'child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

describe('FileLocker', () => {
  const tempDir = path.join(__dirname, 'temp');
  let locker: FileLocker;

  beforeEach(async () => {
    locker = new FileLocker(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('should lock and unlock a resource', async () => {
    const resource = 'test-resource';
    await locker.lock(resource);

    // Verify lock file exists
    const lockPath = path.join(tempDir, resource, `${resource}.lock`);
    const lockExists = await fs
      .access(lockPath)
      .then(() => true)
      .catch(() => false);
    expect(lockExists).toBe(true);

    await locker.unlock(resource);

    // Verify lock file is removed
    const lockExistsAfterUnlock = await fs
      .access(lockPath)
      .then(() => true)
      .catch(() => false);
    expect(lockExistsAfterUnlock).toBe(false);
  });

  test('should throw error when locking an already locked resource', async () => {
    const resource = 'test-resource2';
    await locker.lock(resource);
    const expectPromises = [];
    for (let i = 0; i < 20; i += 1) {
      const p = expect(locker.lock(resource)).rejects.toThrow();
      expectPromises.push(p);
    }
    await Promise.all(expectPromises);

    // lock another resource and it will be successful
    const resource2 = 'test-resource3';
    await locker.lock(resource2);
    await expect(locker.lock(resource2)).rejects.toThrow();

    await Promise.all([locker.unlock(resource), locker.unlock(resource2)]);

    // lock same resource again
    await locker.lock(resource);
    await locker.lock(resource2);
    await expect(locker.lock(resource)).rejects.toThrow();
    await expect(locker.lock(resource2)).rejects.toThrow();
    await Promise.all([locker.unlock(resource), locker.unlock(resource2)]);
  });

  test('should handle concurrent locks with multiple processes', async () => {
    const resource = 'concurrent-resource';
    const testFileDir = path.join(__dirname, 'temp');
    // 用预编译的 ESM 产物启动子进程，避免 Windows 下 `pnpm tsx` 冷启 TS 解释器导致的偶发启动失败
    const distEntry = path.join(__dirname, '..', 'dist', 'index.esm.js');
    const testScript = path.join(testFileDir, 'test-process.mjs');
    const trackingFile = path.join(testFileDir, 'execution-order.txt');

    // Clean up previous tracking file
    try {
      await fs.unlink(trackingFile);
    } catch {
      // File doesn't exist, ignore
    }

    // 子进程直接复用已导出的 FileStorageAdapter 的 locker（内部即 FileLocker），
    // 通过 node 运行 .mjs，省去 tsx 冷启开销，跨进程文件锁语义不变。
    // Windows 下 ESM import 必须使用 file:// URL，故对路径做 pathToFileURL 转换。
    const scriptContent = `
      import { pathToFileURL } from 'node:url';
      import FileStorageAdapter from ${JSON.stringify(pathToFileURL(distEntry).href)};
      import fs from 'node:fs/promises';

      const adapter = new FileStorageAdapter({ directory: ${JSON.stringify(tempDir)} });
      const locker = adapter.locker;
      const resource = '${resource}';
      const processId = process.argv[2];

      async function main() {
        const trackingFile = ${JSON.stringify(trackingFile)};

        try {
          let lockAcquired = false;
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max wait

          while (!lockAcquired && attempts < maxAttempts) {
            try {
              await locker.lock(resource);
              lockAcquired = true;
            } catch (lockError) {
              attempts++;
              if (attempts >= maxAttempts) {
                await fs.appendFile(trackingFile, \`Process \${processId} failed to acquire lock after \${attempts} attempts at \${Date.now()}\\n\`);
                process.exit(1);
              }
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }

          const timestamp = Date.now();
          await fs.appendFile(trackingFile, \`Process \${processId} acquired lock at \${timestamp} after \${attempts} attempts\\n\`);

          await new Promise(resolve => setTimeout(resolve, 50));

          await locker.unlock(resource);
          const releaseTimestamp = Date.now();
          await fs.appendFile(trackingFile, \`Process \${processId} released lock at \${releaseTimestamp}\\n\`);

          process.exit(0);
        } catch (error) {
          await fs.appendFile(trackingFile, \`Process \${processId} error: \${error && error.message} at \${Date.now()}\\n\`);
          process.exit(1);
        }
      }
      main();
    `;

    await fs.mkdir(testFileDir, { recursive: true });
    await fs.writeFile(testScript, scriptContent);

    // Spawn multiple child processes simultaneously
    const childProcesses = [];
    const promises = [];

    for (let i = 0; i < 5; i += 1) {
      const childProcess = spawn('node', [testScript, String(i)], {
        stdio: 'pipe',
        shell: true,
        cwd: path.join(__dirname, '..')
      });

      childProcesses.push(childProcess);

      const promise = new Promise<void>((resolve, reject) => {
        childProcess.on('close', code => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Process ${i} exited with code ${code}`));
          }
        });

        childProcess.on('error', error => {
          reject(error);
        });
      });

      promises.push(promise);
    }

    // Wait for all processes to complete
    await Promise.all(promises);

    // Verify the tracking file exists and contains execution logs
    const trackingContent = await fs.readFile(trackingFile, 'utf-8');
    const lines = trackingContent.trim().split('\n');

    // Should have at least 10 lines (5 acquire + 5 release), may have more due to retries
    expect(lines.length).toBeGreaterThanOrEqual(10);

    // Verify that locks are acquired and released in proper sequence
    // No two processes should hold the lock simultaneously
    const acquireEvents = lines.filter(line => line.includes('acquired lock'));
    const releaseEvents = lines.filter(line => line.includes('released lock'));
    const errorEvents = lines.filter(line => line.includes('error') || line.includes('failed to acquire lock'));

    expect(errorEvents).toHaveLength(0); // No errors should occur
    expect(acquireEvents).toHaveLength(5);
    expect(releaseEvents).toHaveLength(5);

    // Extract timestamps and verify no overlapping lock periods
    const lockPeriods: Array<{ process: string; start: number; end: number }> = [];

    for (let i = 0; i < 5; i += 1) {
      const acquireLine = acquireEvents.find(line => line.includes(`Process ${i}`));
      const releaseLine = releaseEvents.find(line => line.includes(`Process ${i}`));

      expect(acquireLine).toBeDefined();
      expect(releaseLine).toBeDefined();

      const startTime = parseInt(acquireLine!.match(/at (\d+)/)![1], 10);
      const endTime = parseInt(releaseLine!.match(/at (\d+)/)![1], 10);

      lockPeriods.push({
        process: String(i),
        start: startTime,
        end: endTime
      });
    }

    // Sort by start time
    lockPeriods.sort((a, b) => a.start - b.start);

    // Verify no overlapping lock periods
    for (let i = 0; i < lockPeriods.length - 1; i += 1) {
      const current = lockPeriods[i];
      const next = lockPeriods[i + 1];

      // Current lock should end before next lock starts
      expect(current.end).toBeLessThanOrEqual(next.start);
    }

    // Clean up test files
    // await fs.unlink(testScript);
    // await fs.unlink(trackingFile);
  });
});
