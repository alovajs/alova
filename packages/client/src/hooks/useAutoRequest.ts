import { noop, statesHookHelper } from '@alova/shared/function';
import { falseValue, isSSR, trueValue } from '@alova/shared/vars';
import { AlovaMethodHandler, Method, UseHookReturnType, promiseStatesHook, useRequest } from 'alova';
import { AutoRequestHookConfig, NotifyHandler, UnbindHandler } from '~/typings/general';

interface AutoRequestHook<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader> {
  (
    handler:
      | Method<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
      | AlovaMethodHandler<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>,
    config?: AutoRequestHookConfig<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
  ): UseHookReturnType<State, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>;
  onNetwork(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
  ): UnbindHandler;
  onPolling(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
  ): UnbindHandler;
  onVisibility(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
  ): UnbindHandler;
  onFocus(
    notify: NotifyHandler,
    config: AutoRequestHookConfig<State, Computed, Watched, Export, Responded, Transformed, RequestConfig, Response, ResponseHeader>
  ): UnbindHandler;
}

export const defaultConfig: AutoRequestHookConfig<any, any, any, any, any, any, any, any, any> = {
  enableFocus: trueValue,
  enableNetwork: trueValue,
  throttle: 1000
};
const useAutoRequest: AutoRequestHook<any, any, any, any, any, any, any, any, any> = (handler, config = {}) => {
  let notifiable = trueValue;
  const { enableFocus = trueValue, enableVisibility = trueValue, enableNetwork = trueValue, pollingTime = 0, throttle = 1000 } = config;
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
  return {
    ...states,
    __referingObj: referingObject
  };
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
