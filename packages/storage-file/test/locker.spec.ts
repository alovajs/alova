import FileLocker from '@/FileLocker';
import { spawn } from 'child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

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
    const testScript = path.join(testFileDir, 'test-process.ts');
    const trackingFile = path.join(testFileDir, 'execution-order.txt');

    // Clean up previous tracking file
    try {
      await fs.unlink(trackingFile);
    } catch {
      // File doesn't exist, ignore
    }

    const scriptContent = `
      import FileLocker from '@/FileLocker';
      import fs from 'node:fs/promises';
      import path from 'node:path';
      
      const locker = new FileLocker('${tempDir}');
      const resource = '${resource}';
      const processId = process.argv[2];
      
      async function main() {
        const trackingFile = path.join('${tempDir}', 'execution-order.txt');
        const startTime = Date.now();
        
        try {
          // Try to acquire lock with retry logic
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
                // Write failed attempt to tracking file
                await fs.appendFile(trackingFile, \`Process \${processId} failed to acquire lock after \${attempts} attempts at \${Date.now()}\\n\`);
                process.exit(1);
              }
              // Wait a bit before retrying
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          const timestamp = Date.now();
          await fs.appendFile(trackingFile, \`Process \${processId} acquired lock at \${timestamp} after \${attempts} attempts\\n\`);
          
          // Simulate request processing
          await new Promise(resolve => setTimeout(resolve, 50));
          
          await locker.unlock(resource);
          const releaseTimestamp = Date.now();
          await fs.appendFile(trackingFile, \`Process \${processId} released lock at \${releaseTimestamp}\\n\`);
          
          process.exit(0);
        } catch (error) {
          await fs.appendFile(trackingFile, \`Process \${processId} error: \${error.message} at \${Date.now()}\\n\`);
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
      const childProcess = spawn('pnpm', ['tsx', testScript, String(i)], {
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
