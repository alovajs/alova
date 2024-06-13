import HookedMethod from '@/HookedMethod';
import { delayWithBackoff, isNumber, noop } from '@alova/shared/function';
import { AlovaServerHook, RetryOptions } from '~/typings';

const retry: AlovaServerHook<RetryOptions> = (method, { retry = 3, backoff = { delay: 1000 } }) => {
  let retryTimes = 0;
  return new HookedMethod(method, forceRequest =>
    method.send(forceRequest).then(
      value => value,
      error => {
        // when not reach retry times or return true from retry function, it will retry again.
        if (isNumber(retry) ? retryTimes < retry : retry(error)) {
          retryTimes += 1;

          // calculate retry delay time with pram `backoff` and current retry times.
          const retryDelay = delayWithBackoff(backoff, retryTimes);
          setTimeout(() => {
            method.send(forceRequest).catch(noop);
          }, retryDelay);
        }
      }
    )
  );
};

export default retry;
