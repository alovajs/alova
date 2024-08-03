import useRequest from '@/hooks/core/useRequest';
import { noop, statesHookHelper } from '@alova/shared/function';
import { falseValue, trueValue } from '@alova/shared/vars';
import { AlovaGenerics, globalConfigMap, Method, promiseStatesHook } from 'alova';
import {
  AlovaMethodHandler,
  AutoRequestHookConfig,
  NotifyHandler,
  UnbindHandler,
  UseHookExposure
} from '~/typings/clienthook';

interface AutoRequestHook {
  <AG extends AlovaGenerics>(
    handler: Method<AG> | AlovaMethodHandler<AG>,
    config?: AutoRequestHookConfig<AG>
  ): UseHookExposure<AG>;
  onNetwork<AG extends AlovaGenerics = AlovaGenerics>(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<AG>
  ): UnbindHandler;
  onPolling<AG extends AlovaGenerics = AlovaGenerics>(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<AG>
  ): UnbindHandler;
  onVisibility<AG extends AlovaGenerics = AlovaGenerics>(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<AG>
  ): UnbindHandler;
  onFocus<AG extends AlovaGenerics = AlovaGenerics>(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<AG>
  ): UnbindHandler;
}

export const defaultConfig: AutoRequestHookConfig<AlovaGenerics> = {
  enableFocus: trueValue,
  enableNetwork: trueValue,
  throttle: 1000
};
const useAutoRequest: AutoRequestHook = (handler, config = {}) => {
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
    if (!globalConfigMap.ssr) {
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
