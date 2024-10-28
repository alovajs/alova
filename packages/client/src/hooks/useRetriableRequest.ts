import { RetriableFailEvent, RetriableRetryEvent } from '@/event';
import useRequest from '@/hooks/core/useRequest';
import { AlovaError, createAssert } from '@alova/shared/assert';
import createEventManager from '@alova/shared/createEventManager';
import { AlovaEventBase } from '@alova/shared/event';
import { delayWithBackoff, isNumber, newInstance, noop, statesHookHelper, usePromise } from '@alova/shared/function';
import {
  falseValue,
  promiseCatch,
  promiseReject,
  promiseResolve,
  setTimeoutFn,
  trueValue,
  undefinedValue
} from '@alova/shared/vars';
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
const assert = createAssert(hookPrefix);
export default <AG extends AlovaGenerics, Args extends any[] = any[]>(
  handler: Method<AG> | AlovaMethodHandler<AG, Args>,
  config: RetriableHookConfig<AG, Args> = {}
) => {
  const { retry = 3, backoff = { delay: 1000 }, middleware = noop } = config;

  const { ref: useFlag$, exposeProvider, __referingObj: referingObject } = statesHookHelper(promiseStatesHook());

  const eventManager = createEventManager<RetriableEvents<AG, Args>>();
  const retryTimes = useFlag$(0);
  const stopManuallyError = useFlag$(undefinedValue as Error | undefined); // 停止错误对象，在手动触发停止时有值
  const methodInstanceLastest = useFlag$(undefinedValue as Method<AG> | undefined);
  const argsLatest = useFlag$(undefinedValue as any[] | undefined);
  const requesting = useFlag$(falseValue); // 是否正在请求中
  const retryTimer = useFlag$(undefinedValue as string | number | NodeJS.Timeout | undefined);
  const stopPromiseObj = useFlag$(usePromise());

  const emitOnFail = (method: Method<AG>, args: [...Args, ...any[]], error: any) => {
    // 需要异步触发onFail，让onError和onComplete先触发
    setTimeoutFn(() => {
      eventManager.emit(
        FailEventKey,
        newInstance(RetriableFailEvent<AG, Args>, AlovaEventBase.spawn(method, args), error, retryTimes.current)
      );
      stopManuallyError.current = undefinedValue;
      retryTimes.current = 0; // 重置已重试次数
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
        clearTimeout(retryTimer.current); // 清除重试定时器
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
       * Consider this situation: user call stop() and send another request immediately,
       * but now the previous request haven't finished. `next()` will raises the branch on completion.
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

          // 请求失败时触发重试机制
          error => {
            // 没有手动触发停止，以及重试次数未到达最大时触发重试
            if (!stopManuallyError.current && (isNumber(retry) ? retryTimes.current < retry : retry(error, ...args))) {
              retryTimes.current += 1;
              // 计算重试延迟时间
              const retryDelay = delayWithBackoff(backoff, retryTimes.current);
              // 延迟对应时间重试
              retryTimer.current = setTimeoutFn(() => {
                // 触发重试事件
                eventManager.emit(
                  RetryEventKey,
                  newInstance(
                    RetriableRetryEvent<AG, Args>,
                    AlovaEventBase.spawn(method, args),
                    retryTimes.current,
                    retryDelay
                  )
                );
                // 如果手动停止了则不再触发重试
                promiseCatch(send(...args), noop); // 捕获错误不再往外抛，否则重试时也会抛出错误
              }, retryDelay);
            } else {
              error = stopManuallyError.current || error; // 如果stopManuallyError有值表示是通过stop函数触发停止的
              resolveFail(error);
            }

            // 返回reject执行后续的错误流程
            return promiseReject(error);
          }
        )
        .finally(() => {
          requesting.current = falseValue;
        });
    }
  });

  /**
   * 停止重试，只在重试期间调用有效
   * 如果正在请求中，则触发中断请求，让请求错误来抛出错误，否则手动修改状态以及触发onFail
   * 停止后将立即触发onFail事件
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
   * 重试事件绑定
   * 它们将在重试发起后触发
   * @param handler 重试事件回调
   */
  const onRetry = (handler: RetryHandler<AG, Args>) => {
    eventManager.on(RetryEventKey, event => handler(event));
  };

  /**
   * 失败事件绑定
   * 它们将在不再重试时触发，例如到达最大重试次数时，重试回调返回false时，手动调用stop停止重试时
   * 而alova的onError事件是在每次请求报错时都将被触发
   *
   * 注意：如果没有重试次数时，onError、onComplete和onFail会被同时触发
   *
   * @param handler 失败事件回调
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
