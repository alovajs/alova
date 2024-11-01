import type { BackoffPolicy } from '@alova/shared';
import { AlovaGenerics, Method } from 'alova';
import { AlovaErrorEvent, AlovaEvent, AlovaMethodHandler, UseHookExposure } from '../general';
import { RequestHookConfig } from './useRequest';

/**
 * useRetriableRequest配置
 */
export type RetriableHookConfig<AG extends AlovaGenerics, Args extends any[]> = {
  /**
   * The maximum number of retries can also be set as a function that returns a boolean value to dynamically determine whether to continue retrying.
   * @default 3
   */
  retry?: number | ((error: Error, ...args: [...Args, ...any[]]) => boolean);

  /**
   * avoidance strategy
   */
  backoff?: BackoffPolicy;
} & RequestHookConfig<AG, Args>;

/**
 * useRetriableRequest onRetry callback event instance
 */
export interface RetriableRetryEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaEvent<AG, Args> {
  /**
   * Current number of retries
   */
  retryTimes: number;

  /**
   * Delay time for this retry
   */
  retryDelay: number;
}
/**
 * useRetriableRequest onFail callback event instance
 */
export interface RetriableFailEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaErrorEvent<AG, Args> {
  /**
   * Number of retries on failure
   */
  retryTimes: number;
}
/**
 * useRetriableRequest return value
 */
export interface RetriableExposure<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends UseHookExposure<AG, Args, RetriableExposure<AG, Args>> {
  /**
   * Stop retrying, the call is only valid during the retry period
   * The onFail event will be triggered immediately after stopping
   *
   */
  stop(): void;

  /**
   * Retry event binding
   * They will be triggered after the retry is initiated
   * @param handler Retry event callback
   */
  onRetry(handler: (event: RetriableRetryEvent<AG, Args>) => void): this;

  /**
   * failed event binding
   * They will be triggered when there are no more retries, such as when the maximum number of retries is reached, when the retry callback returns false, or when stop is manually called to stop retries.
   * The onError event of alova will be triggered every time an error is requested.
   *
   * Note: If there are no retries, onError, onComplete and onFail will be triggered at the same time.
   *
   * @param handler Failure event callback
   */
  onFail(handler: (event: RetriableFailEvent<AG, Args>) => void): this;
}

/**
 * useRetriableRequest
 * Request hook with retry function
 * Applicable scenarios:
 * 1. Retry if the request fails, or retry with custom rules
 * 2. Manual stop/start retry
 *
 * @param handler method instance or get function
 * @param config Configuration parameters
 * @return useRetriableRequest related data and operation functions
 */
export declare function useRetriableRequest<AG extends AlovaGenerics, Args extends any[] = any[]>(
  handler: Method<AG> | AlovaMethodHandler<AG, Args>,
  config?: RetriableHookConfig<AG, Args>
): RetriableExposure<AG, Args>;
