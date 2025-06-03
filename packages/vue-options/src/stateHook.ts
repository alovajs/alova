import { isObject, ObjectCls, setTimeoutFn, trueValue } from '@alova/shared';
import { StatesHook } from 'alova';
import { VueOptionExportType } from '~/typings';

const on = (component: any, lifecycle: 'um' | 'm', handler: () => void) => {
  const { $, $options } = component;
  let eventHandlers = [];
  if ($) {
    // vue3, it will be tested in npm run test:vue3
    // um is the life cycle unmounted, which is saved in $
    // m is the life cycle mounted, which is stored in $
    // Dynamically inject life cycle functions and remove the corresponding state when the component is uninstalled
    eventHandlers = $[lifecycle] = $[lifecycle] || [];
  } else {
    const lifecycleVue2 = {
      um: 'destroyed',
      m: 'mounted'
    }[lifecycle];
    // The destruction event in vue2 is named destroyed, and the life cycle is saved in $options.
    // The mounted event in vue2 is named mounted, and the life cycle is saved in $options.
    const lifecycleContext = ObjectCls.getPrototypeOf($options);
    eventHandlers = lifecycleContext[lifecycleVue2] = lifecycleContext[lifecycleVue2] || [];
  }
  eventHandlers.push(handler);
};

export default {
  name: 'VueOption',
  create: (data, key) => ({ value: data, key, type: 's' }),

  // Explanation: Computed generally relies on states, so states on components must be accessed to implement dependency tracking.
  dehydrate: (_, key, { component, dataKey }) => component[dataKey]?.[key],
  update: (newValue, _, key, referingObject) => {
    // async update, because the `component` and `dataKey` must be mounted to referingObject first.
    setTimeoutFn(() => {
      const { component, dataKey } = referingObject;
      if (dataKey === '__proto__' || dataKey === 'constructor' || dataKey === 'prototype') {
        throw new Error(`Invalid dataKey: ${dataKey}`);
      }
      component[dataKey][key] = newValue;
    });
  },
  effectRequest({ handler, removeStates, immediate, watchingStates }, referingObject) {
    // It needs to be executed asynchronously, and the component and data key are injected into the config in the map alova hook.
    setTimeout(() => {
      const { component, dataKey } = referingObject;
      on(component, 'um', removeStates);
      immediate && handler();
      let timer: NodeJS.Timeout | void;
      (watchingStates || []).forEach((state, i) => {
        component.$watch(
          // watchingStates may come from request policy hooks, and what is received at this time is state or computed
          isObject(state) ? `${dataKey}.${(state as any).key}` : state,
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
  computed: (getter, _, key) => ({
    value: getter,
    key,
    type: 'c'
  }),
  watch: (states, callback, referingObject) => {
    setTimeoutFn(() => {
      const { component, dataKey } = referingObject;
      (states || []).forEach(state => {
        component.$watch(`${dataKey}.${state.key}`, callback, { deep: trueValue });
      });
    });
  },
  onMounted: (callback, { component }) => {
    on(component, 'm', callback);
  },
  onUnmounted: (callback, { component }) => {
    on(component, 'm', callback);
  }
} as StatesHook<VueOptionExportType<unknown>>;
