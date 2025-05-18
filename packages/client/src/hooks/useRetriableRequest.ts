import { AlovaEventBase, RetriableFailEvent, RetriableRetryEvent } from '@/event';
import useRequest from '@/hooks/core/useRequest';
import { statesHookHelper } from '@/util/helper';
import {
  AlovaError,
  createAssert,
  createEventManager,
  delayWithBackoff,
  falseValue,
  isNumber,
  newInstance,
  noop,
  promiseCatch,
  promiseReject,
  promiseResolve,
  setTimeoutFn,
  trueValue,
  undefinedValue,
  usePromise
} from '@alova/shared';
import { AlovaGenerics, Method, promiseStatesHook } from 'alova';
import { AlovaMethodHandler, RetriableHookConfig } from '~/typings/clienthook';

const RetryEventKey = Symbol('RetriableRetry');
const FailEventKey = Symbol('RetriableFail');

export type RetriableEvents<AG extends AlovaGenerics, Args extends any[]> = {
  [RetryEventKey]: RetriableRetryEvent<AG, Args>;
  [FailEventKey]: RetriableFailEvent<AG, Args>;
};

type RetryHandler<AG extends AlovaGenerics, Args extends any[]> = (event: RetriableRetryEvent<AG, Args>) => void;
type FailHandler<AG extends AlovaGenerics, Args extends any[]> = (event: RetriableFailEvent<AG, Args>) => void;
const hookPrefix = 'useRetriableRequest';
const assert: ReturnType<typeof createAssert> = createAssert(hookPrefix);
export default <AG extends AlovaGenerics, Args extends any[] = any[]>(
  handler: Method<AG> | AlovaMethodHandler<AG, Args>,
  config: RetriableHookConfig<AG, Args> = {}
) => {
  const { retry = 3, backoff = { delay: 1000 }, middleware = noop } = config;

  const { ref: useFlag$, exposeProvider, __referingObj: referingObject } = statesHookHelper(promiseStatesHook());

  const eventManager = createEventManager<RetriableEvents<AG, Args>>();
  const retryTimes = useFlag$(0);
  const stopManuallyError = useFlag$(undefinedValue as Error | undefined); // Stop error object, has value when stop is triggered manually
  const methodInstanceLastest = useFlag$(undefinedValue as Method<AG> | undefined);
  const argsLatest = useFlag$(undefinedValue as any[] | undefined);
  const requesting = useFlag$(falseValue); // Is it being requested?
  const retryTimer = useFlag$(undefinedValue as string | number | NodeJS.Timeout | undefined);
  const stopPromiseObj = useFlag$(usePromise());

  const emitOnFail = (method: Method<AG>, args: [...Args, ...any[]], error: any) => {
    // On fail needs to be triggered asynchronously, and on error and on complete should be triggered first.
    setTimeoutFn(() => {
      eventManager.emit(
        FailEventKey,
        newInstance(RetriableFailEvent<AG, Args>, AlovaEventBase.spawn(method, args), error, retryTimes.current)
      );
      stopManuallyError.current = undefinedValue;
      retryTimes.current = 0; // Reset the number of retries
    });
  };

  const nestedHookProvider = useRequest(handler, {
    ...config,
    __referingObj: referingObject,
    middleware(ctx, next) {
      middleware(
        {
          ...ctx,
          delegatingActions: {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            stop
          }
        },
        () => promiseResolve()
      );
      const { proxyStates, args, send, method, controlLoading } = ctx;
      controlLoading();
      const { loading } = proxyStates;
      const setLoading = (value = falseValue) => {
        loading.v = value;
      };

      const resolveFail = (error: Error) => {
        setLoading();
        proxyStates.error.v = error;
        clearTimeout(retryTimer.current); // Clear retry timer
        emitOnFail(method, args, error);
      };
      if (!loading.v) {
        promiseCatch(stopPromiseObj.current.promise, error => {
          resolveFail(error);
          stopPromiseObj.current = usePromise();
        });
      }
      setLoading(trueValue);
      requesting.current = trueValue;
      methodInstanceLastest.current = method;
      argsLatest.current = args;

      /**
       * Consider this situation: user call stop() and send another request immediately, but now the previous request haven't finished. `next()` will raises the branch on completion.
       *
       * By using Promise.race(), we can cause the returned promise to be rejected immediately when call `stop()`
       */
      return next()
        .then(
          val => {
            // set `loading` to false when request is successful
            setLoading();
            return val;
          },

          // Trigger retry mechanism when request fails
          error => {
            // There is no manual trigger to stop, and a retry is triggered when the number of retries does not reach the maximum.
            if (!stopManuallyError.current && (isNumber(retry) ? retryTimes.current < retry : retry(error, ...args))) {
              retryTimes.current += 1;
              // Calculate retry delay time
              const retryDelay = delayWithBackoff(backoff, retryTimes.current);
              // Delay the corresponding time and try again
              retryTimer.current = setTimeoutFn(() => {
                // trigger retry event
                eventManager.emit(
                  RetryEventKey,
                  newInstance(
                    RetriableRetryEvent<AG, Args>,
                    AlovaEventBase.spawn(method, args),
                    retryTimes.current,
                    retryDelay
                  )
                );
                // If stopped manually, retry will no longer be triggered.
                promiseCatch(send(...args), noop); // Captured errors will no longer be thrown out, otherwise errors will be thrown when retrying.
              }, retryDelay);
            } else {
              error = stopManuallyError.current || error; // If stop manually error has a value, it means that the stop is triggered through the stop function.
              resolveFail(error);
            }

            // Return reject to execute the subsequent error process
            return promiseReject(error);
          }
        )
        .finally(() => {
          requesting.current = falseValue;
        });
    }
  });

  /**
   * Stop retrying, only valid when called during retrying
   * If the request is in progress, trigger an interrupt request and let the request error throw an error. Otherwise, manually modify the status and trigger onFail.
   * The onFail event will be triggered immediately after stopping
   */
  const stop = () => {
    assert(nestedHookProvider.__proxyState('loading').v as boolean, 'there is no requests being retried');
    stopManuallyError.current = newInstance(AlovaError, hookPrefix, 'stop retry manually');
    if (requesting.current) {
      nestedHookProvider.abort();
    } else {
      stopPromiseObj.current.reject(stopManuallyError.current);
    }
  };

  /**
   * Retry event binding
   * They will be triggered after the retry is initiated
   * @param handler Retry event callback
   */
  const onRetry = (handler: RetryHandler<AG, Args>) => {
    eventManager.on(RetryEventKey, event => handler(event));
  };

  /**
   * failed event binding
   * They will be triggered when there are no more retries, such as when the maximum number of retries is reached, when the retry callback returns false, or when stop is manually called to stop retries.
   * The onError event of alova will be triggered every time an error is requested.
   *
   * Note: If there are no retries, onError, onComplete and onFail will be triggered at the same time.
   *
   * @param handler Failure event callback
   */
  const onFail = (handler: FailHandler<AG, Args>) => {
    eventManager.on(FailEventKey, event => handler(event));
  };

  return exposeProvider({
    ...nestedHookProvider,
    stop,
    onRetry,
    onFail
  });
};
