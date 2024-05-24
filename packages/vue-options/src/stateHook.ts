import { ObjectCls, trueValue } from '@alova/shared/vars';
import { StatesHook } from 'alova';

const on = (component: any, lifecycle: 'um' | 'm', handler: () => void) => {
  const { $, $options } = component;
  let eventHandlers = [];
  /* c8 ignore start */
  if ($) {
    // vue3，它将在npm run test:vue3中测试到
    // um为生命周期unmounted，它保存在了$中
    // m为生命周期mounted，它保存在了$中
    // 动态注入生命周期函数，组件卸载时移除对应状态
    eventHandlers = $[lifecycle] = $[lifecycle] || [];
  } /* c8 ignore stop */ else {
    const lifecycleVue2 = {
      um: 'destroyed',
      m: 'mounted'
    }[lifecycle];
    // vue2中销毁事件名为destroyed，生命周期保存在了$options中
    // vue2中mounted事件名为mounted，生命周期保存在了$options中
    const lifecycleContext = ObjectCls.getPrototypeOf($options);
    eventHandlers = lifecycleContext[lifecycleVue2] = lifecycleContext[lifecycleVue2] || [];
  }
  eventHandlers.push(handler);
};

export default {
  create: data => data,
  export: state => state,
  dehydrate: (_, key, { component, dataKey }) => component[dataKey][key],
  update: (newValue, _, key, { component, dataKey }) => {
    component[dataKey][key] = newValue;
  },
  effectRequest({ handler, removeStates, immediate, watchingStates }, { component }) {
    // 需要异步执行，在mapAlovaHook中对config注入component和dataKey
    setTimeout(() => {
      on(component, 'um', removeStates);
      immediate && handler();
      let timer: NodeJS.Timeout | void;
      (watchingStates || []).forEach((state, i) => {
        component.$watch(
          state,
          () => {
            timer && clearTimeout(timer);
            timer = setTimeout(() => {
              handler(i);
              timer = undefined;
            });
          },
          { deep: trueValue }
        );
      });
    });
  },
  computed: (getter, _, referingObject) => {
    // TODO: 在此记录并在mapAlovaHook中，通过一个新的vue实例实现计算属性
    referingObject.abc = getter; // 先随便写的
  },
  watch: (states, callback, { component }) => {
    (states || []).forEach(state => {
      component.$watch(state, callback, { deep: trueValue });
    });
  },
  onMounted: (callback, { component }) => {
    on(component, 'm', callback);
  },
  onUnmounted: (callback, { component }) => {
    on(component, 'm', callback);
  }
} as StatesHook<unknown, unknown>;
