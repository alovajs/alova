import { TonMounted$, TonUnmounted$ } from '@/framework/type';
import { noop } from '@/helper';
import { falseValue, isSSR, trueValue } from '@/helper/variables';
import { AlovaMethodHandler, Method, UseHookReturnType, useRequest } from 'alova';
import { AutoRequestHookConfig, NotifyHandler, UnbindHandler } from '~/typings/general';

interface AutoRequestHook<S, E, R, T, RC, RE, RH> {
  (
    handler: Method<S, E, R, T, RC, RE, RH> | AlovaMethodHandler<S, E, R, T, RC, RE, RH>,
    config: AutoRequestHookConfig<S, E, R, T, RC, RE, RH>,
    onMounted$: TonMounted$,
    onUnmounted$: TonUnmounted$
  ): UseHookReturnType<S, E, R, T, RC, RE, RH>;
  onNetwork(notify: NotifyHandler, config: AutoRequestHookConfig<S, E, R, T, RC, RE, RH>): UnbindHandler;
  onPolling(notify: NotifyHandler, config: AutoRequestHookConfig<S, E, R, T, RC, RE, RH>): UnbindHandler;
  onVisibility(notify: NotifyHandler, config: AutoRequestHookConfig<S, E, R, T, RC, RE, RH>): UnbindHandler;
  onFocus(notify: NotifyHandler, config: AutoRequestHookConfig<S, E, R, T, RC, RE, RH>): UnbindHandler;
}

export const defaultConfig: AutoRequestHookConfig<any, any, any, any, any, any, any> = {
  enableFocus: trueValue,
  enableNetwork: trueValue,
  throttle: 1000
};
const useAutoRequest: AutoRequestHook<any, any, any, any, any, any, any> = (
  handler,
  config,
  onMounted$,
  onUnmounted$
) => {
  let notifiable = trueValue;
  const {
      enableFocus = trueValue,
      enableVisibility = trueValue,
      enableNetwork = trueValue,
      pollingTime = 0,
      throttle = 1000
    } = config,
    states = useRequest(handler, config),
    notify = () => {
      if (notifiable) {
        states.send();
        if (throttle > 0) {
          notifiable = falseValue;
          setTimeout(() => (notifiable = trueValue), throttle);
        }
      }
    };

  let offNetwork = noop,
    offFocus = noop,
    offVisiblity = noop,
    offPolling = noop;
  onMounted$(() => {
    if (!isSSR) {
      offNetwork = enableNetwork ? useAutoRequest.onNetwork(notify, config) : offNetwork;
      offFocus = enableFocus ? useAutoRequest.onFocus(notify, config) : offFocus;
      offVisiblity = enableVisibility ? useAutoRequest.onVisibility(notify, config) : offVisiblity;
      offPolling = pollingTime > 0 ? useAutoRequest.onPolling(notify, config) : offPolling;
    }
  });
  onUnmounted$(() => {
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
