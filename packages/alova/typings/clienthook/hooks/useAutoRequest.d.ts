import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, UseHookExposure } from '../general';
import { RequestHookConfig } from './useRequest';

/**
 * useAutoRequest配置
 */
export type AutoRequestHookConfig<AG extends AlovaGenerics, Args extends any[] = any[]> = {
  /**
   * 轮询事件，单位ms，0表示不开启
   * @default 0
   */
  pollingTime?: number;
  /**
   * 浏览器显示隐藏或tab切换
   * @default true
   */
  enableVisibility?: boolean;
  /**
   * 浏览器聚焦
   * @default true
   */
  enableFocus?: boolean;
  /**
   * 开启网络重连
   * @default true
   */
  enableNetwork?: boolean;
  /**
   * 节流时间，单位ms，表示在节流时间内多次触发只会发送1次请求
   * @default 1000
   */
  throttle?: number;
} & RequestHookConfig<AG, Args>;

export type NotifyHandler = () => void;
export type UnbindHandler = () => void;

/**
 * 在一定条件下可以自动重新拉取数据，从而刷新页面，使用场景有：
 * 1. 浏览器 tab 切换时拉取最新数据
 * 2. 浏览器聚焦时拉取最新数据
 * 3. 网络重连时拉取最新数据
 * 4. 轮询请求
 * 可同时配置以上的一个或多个触发条件，也可以配置节流时间来防止短时间内触发多次请求，例如 1 秒内只允许触发一次。
 * @param handler method实例或获取函数
 * @param config 配置参数
 * @return useAutoRequest相关数据和操作函数
 */
export declare function useAutoRequest<AG extends AlovaGenerics, Args extends any[] = any[]>(
  handler: Method<AG> | AlovaMethodHandler<AG, Args>,
  config?: AutoRequestHookConfig<AG, Args>
): UseHookExposure<AG, Args>;
export declare namespace useAutoRequest {
  function onNetwork<AG extends AlovaGenerics = AlovaGenerics>(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<AG>
  ): UnbindHandler;
  function onPolling<AG extends AlovaGenerics = AlovaGenerics>(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<AG>
  ): UnbindHandler;
  function onVisibility<AG extends AlovaGenerics = AlovaGenerics>(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<AG>
  ): UnbindHandler;
  function onFocus<AG extends AlovaGenerics = AlovaGenerics>(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<AG>
  ): UnbindHandler;
}
