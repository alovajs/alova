import { BackoffPolicy } from '@alova/shared/types';
import { AlovaGenerics, Method } from 'alova';
import { AlovaErrorEvent, AlovaEvent, AlovaMethodHandler, UseHookExposure } from '../general';
import { RequestHookConfig } from './useRequest';

/**
 * useRetriableRequest配置
 */
export type RetriableHookConfig<AG extends AlovaGenerics> = {
  /**
   * 最大重试次数，也可以设置为返回 boolean 值的函数，来动态判断是否继续重试。
   * @default 3
   */
  retry?: number | ((error: Error, ...args: any[]) => boolean);

  /**
   * 避让策略
   */
  backoff?: BackoffPolicy;
} & RequestHookConfig<AG>;

/**
 * useRetriableRequest onRetry回调事件实例
 */
export interface RetriableRetryEvent<AG extends AlovaGenerics> extends AlovaEvent<AG> {
  /**
   * 当前的重试次数
   */
  retryTimes: number;

  /**
   * 本次重试的延迟时间
   */
  retryDelay: number;
}
/**
 * useRetriableRequest onFail回调事件实例
 */
export interface RetriableFailEvent<AG extends AlovaGenerics> extends AlovaErrorEvent<AG> {
  /**
   * 失败时的重试次数
   */
  retryTimes: number;
}
/**
 * useRetriableRequest返回值
 */
export interface RetriableExposure<AG extends AlovaGenerics> extends UseHookExposure<AG, RetriableExposure<AG>> {
  /**
   * 停止重试，只在重试期间调用有效
   * 停止后将立即触发onFail事件
   *
   */
  stop(): void;

  /**
   * 重试事件绑定
   * 它们将在重试发起后触发
   * @param handler 重试事件回调
   */
  onRetry(handler: (event: RetriableRetryEvent<AG>) => void): this;

  /**
   * 失败事件绑定
   * 它们将在不再重试时触发，例如到达最大重试次数时，重试回调返回false时，手动调用stop停止重试时
   * 而alova的onError事件是在每次请求报错时都将被触发
   *
   * 注意：如果没有重试次数时，onError、onComplete和onFail会被同时触发
   *
   * @param handler 失败事件回调
   */
  onFail(handler: (event: RetriableFailEvent<AG>) => void): this;
}

/**
 * useRetriableRequest
 * 具有重试功能的请求hook
 * 适用场景：
 * 1. 请求失败重试、或自定义规则重试
 * 2. 手动停止/启动重试
 *
 * @param handler method实例或获取函数
 * @param config 配置参数
 * @return useRetriableRequest相关数据和操作函数
 */
export declare function useRetriableRequest<AG extends AlovaGenerics>(
  handler: Method<AG> | AlovaMethodHandler<AG>,
  config?: RetriableHookConfig<AG>
): RetriableExposure<AG>;
