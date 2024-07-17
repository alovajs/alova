import HookedMethod from '@/HookedMethod';
import { createServerHook } from '@/helper';
import { delayWithBackoff, isNumber, usePromise } from '@alova/shared/function';
import { BackoffPolicy } from '@alova/shared/types';
import { AlovaGenerics, Method } from 'alova';

export interface RetryOptions {
  /**
   * The maximum number of retries. it can also be set as a function that returns a boolean to dynamically determine whether to continue retry.
   * @default 3
   */
  retry?: number | ((error: Error) => boolean);

  /**
   * backoff policy
   */
  backoff?: BackoffPolicy;
}

const retry = createServerHook(<AG extends AlovaGenerics>(method: Method<AG>, options?: RetryOptions) => {
  const { retry = 3, backoff = { delay: 1000 } } = options ?? {};
  let retryTimes = 0;
  return new HookedMethod(method, forceRequest => {
    const errorHandler = (error: any) => {
      // when not reach retry times or return true from retry function, it will retry again.
      if (isNumber(retry) ? retryTimes < retry : retry(error)) {
        const { promise, reject, resolve } = usePromise();
        retryTimes += 1;

        // calculate retry delay time with pram `backoff` and current retry times.
        const retryDelay = delayWithBackoff(backoff, retryTimes);
        setTimeout(() => {
          /**
           * 1. send request
           * 2. resolve the promise if the request is done
           * 3. try retry request
           * 4. if the retry fails, reject the promise
           */
          method.send(forceRequest).then(resolve).catch(errorHandler).catch(reject);
        }, retryDelay);
        return promise;
      }

      return Promise.reject(error);
    };

    return method.send(forceRequest).catch(errorHandler);
  });
});

export default retry;
