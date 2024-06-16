import { QueueCallback } from '@alova/shared/queueCallback';

export default function useQueuedPromise() {
  const queue = new QueueCallback(null, true);

  const withPromise =
    <A extends any[], T>(fn: (...k: A) => T) =>
    (...args: A) =>
      new Promise<Awaited<T>>((resolve, reject) => {
        queue.queueCallback(async () => {
          try {
            const ret = await fn(...args);
            resolve(ret);
          } catch (err) {
            reject(err);
          }
        });
      });

  return {
    withPromise,
    queue
  };
}

export { useQueuedPromise };
