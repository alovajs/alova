import { ObjectCls, trueValue } from '@alova/shared/vars';
import { StatesHook } from 'alova';
import { OptionsComputed, OptionsState } from '~/typings';

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
  create: data => ({ value: data, type: 's' }),

  // 解释：在computed中一般会依赖states，因此必须访问组件上的states才能实现依赖追踪
  dehydrate: (_, key, { component, dataKey }) => component[dataKey][key],
  update: (newValue, _, key, { component, dataKey }) => {
    component[dataKey][key] = newValue;
  },
  effectRequest({ handler, removeStates, immediate, watchingStates }, referingObject) {
    // 需要异步执行，在mapAlovaHook中对config注入component和dataKey
    setTimeout(() => {
      const { component } = referingObject;
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
  computed: getter => ({
    value: getter,
    type: 'c'
  }),
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
} as StatesHook<OptionsState<any>, OptionsComputed<any>, string, OptionsState<any> | OptionsComputed<any>>;
