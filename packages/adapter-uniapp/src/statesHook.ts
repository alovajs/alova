import { len } from '@alova/shared/vars';
import VueHook from 'alova/vue';

export default {
  ...VueHook,
  effectRequest(effectRequestParams, referingObject) {
    const { handler } = effectRequestParams;
    effectRequestParams.handler = (...args: any[]) => {
      // 当没有参数时，表示为立即发送请求，此时延迟100ms让页面中的onLoad先执行
      // 当有参数时，表示通过useWatcher状态改变时发送请求，此时直接调用handler即可
      len(args) > 0 ? handler(...args) : setTimeout(() => handler(...args), 100);
    };
    return VueHook.effectRequest(effectRequestParams, referingObject);
  }
} as typeof VueHook;
