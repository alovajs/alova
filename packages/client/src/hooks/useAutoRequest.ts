import useRequest from '@/hooks/core/useRequest';
import { noop, statesHookHelper } from '@alova/shared/function';
import { falseValue, isSSR, trueValue } from '@alova/shared/vars';
import { AlovaGenerics, Method, promiseStatesHook } from 'alova';
import { AlovaMethodHandler, RequestHookConfig, UseHookExposure } from '~/typings';
import { NotifyHandler, UnbindHandler } from '~/typings/general';

/**
 * useAutoRequest配置
 */
export type AutoRequestHookConfig<AG extends AlovaGenerics> = {
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
} & RequestHookConfig<AG>;

interface AutoRequestHook<AG extends AlovaGenerics> {
  (handler: Method<AG> | AlovaMethodHandler<AG>, config?: AutoRequestHookConfig<AG>): UseHookExposure<AG>;
  onNetwork(notify: NotifyHandler, config: AutoRequestHookConfig<AG>): UnbindHandler;
  onPolling(notify: NotifyHandler, config: AutoRequestHookConfig<AG>): UnbindHandler;
  onVisibility(notify: NotifyHandler, config: AutoRequestHookConfig<AG>): UnbindHandler;
  onFocus(notify: NotifyHandler, config: AutoRequestHookConfig<AG>): UnbindHandler;
}

export const defaultConfig: AutoRequestHookConfig<AlovaGenerics> = {
  enableFocus: trueValue,
  enableNetwork: trueValue,
  throttle: 1000
};

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
const useAutoRequest: AutoRequestHook<AlovaGenerics> = (handler, config = {}) => {
  let notifiable = trueValue;
  const {
    enableFocus = trueValue,
    enableVisibility = trueValue,
    enableNetwork = trueValue,
    pollingTime = 0,
    throttle = 1000
  } = config;
  const { onMounted, onUnmounted, __referingObj: referingObject } = statesHookHelper(promiseStatesHook());
  const states = useRequest(handler, {
    ...config,
    __referingObj: referingObject
  });
  const notify = () => {
    if (notifiable) {
      states.send();
      if (throttle > 0) {
        notifiable = falseValue;
        setTimeout(() => {
          notifiable = trueValue;
        }, throttle);
      }
    }
  };

  let offNetwork = noop;
  let offFocus = noop;
  let offVisiblity = noop;
  let offPolling = noop;
  onMounted(() => {
    if (!isSSR) {
      offNetwork = enableNetwork ? useAutoRequest.onNetwork(notify, config) : offNetwork;
      offFocus = enableFocus ? useAutoRequest.onFocus(notify, config) : offFocus;
      offVisiblity = enableVisibility ? useAutoRequest.onVisibility(notify, config) : offVisiblity;
      offPolling = pollingTime > 0 ? useAutoRequest.onPolling(notify, config) : offPolling;
    }
  });
  onUnmounted(() => {
    offNetwork();
    offFocus();
    offVisiblity();
    offPolling();
  });
  return states;
};

const on = (type: string, handler: NotifyHandler) => {
  window.addEventListener(type, handler);
  return () => window.removeEventListener(type, handler);
};
useAutoRequest.onNetwork = notify => on('online', notify);
useAutoRequest.onFocus = notify => on('focus', notify);
useAutoRequest.onVisibility = notify => {
  const handle = () => document.visibilityState === 'visible' && notify();
  return on('visibilitychange', handle);
};
useAutoRequest.onPolling = (notify, config) => {
  const timer = setInterval(notify, config.pollingTime);
  return () => clearInterval(timer);
};

export default useAutoRequest;
