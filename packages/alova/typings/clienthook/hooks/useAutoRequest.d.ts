import { AlovaGenerics, Method } from 'alova';
import { AlovaMethodHandler, UseHookExposure } from '../general';
import { RequestHookConfig } from './useRequest';

/**
 * useAutoRequest configuration
 */
export type AutoRequestHookConfig<AG extends AlovaGenerics, Args extends any[] = any[]> = {
  /**
   * Polling event, unit is `ms`, 0 means not enabled
   * @default 0
   */
  pollingTime?: number;
  /**
   * Browser display hide or tab switch
   * @default true
   */
  enableVisibility?: boolean;
  /**
   * Browser spotlight
   * @default true
   */
  enableFocus?: boolean;
  /**
   * Enable network reconnection
   * @default true
   */
  enableNetwork?: boolean;
  /**
   * Throttle time, unit ms, means that only one request will be sent if triggered multiple times within the throttling time.
   * @default 1000
   */
  throttle?: number;
} & RequestHookConfig<AG, Args>;

export type NotifyHandler = () => void;
export type UnbindHandler = () => void;

/**
 * Under certain conditions, data can be automatically re-pulled to refresh the page. Usage scenarios include:
 * 1. Pull the latest data when the browser tab is switched
 * 2. Pull the latest data when the browser is focused
 * 3. Pull the latest data when the network is reconnected
 * 4. Polling request
 * One or more of the above trigger conditions can be configured at the same time, and the throttling time can also be configured to prevent multiple requests from being triggered in a short period of time. For example, only one trigger is allowed within 1 second.
 * @param handler method instance or get function
 * @param config Configuration parameters
 * @return useAutoRequest related data and operation functions
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
