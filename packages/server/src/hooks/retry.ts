import HookedMethod from '@/HookedMethod';
import { createServerHook } from '@/helper';
import { BackoffPolicy, delayWithBackoff, isNumber } from '@alova/shared';
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

const retry = createServerHook(<AG extends AlovaGenerics>(method: Method<AG>, options: RetryOptions = {}) => {
  const { retry = 3, backoff = { delay: 1000 } } = options;
  let retryTimes = 0;
  return new HookedMethod(
    method,
    forceRequest =>
      new Promise<Promise<AG['Responded']>>((resolve, reject) => {
        const sendRequest = () => {
          method
            .send(forceRequest)
            .then(resolve)
            .catch(error => {
              // when not reach retry times or return true from retry function, it will retry again.
              if (isNumber(retry) ? retryTimes < retry : retry(error)) {
                retryTimes += 1;
                // calculate retry delay time with pram `backoff` and current retry times.
                const retryDelay = delayWithBackoff(backoff, retryTimes);
                setTimeout(sendRequest, retryDelay);
              } else {
                reject(error);
              }
            });
        };
        sendRequest();
      })
  );
});

export default retry;
