import createSerializerPerformer from '@/util/serializer';
import { createAssert, instanceOf, isFn, trueValue, undefinedValue } from '@alova/shared';
import type { StatesHook } from 'alova';
import { computed, getCurrentInstance, onMounted, onUnmounted, ref, watch } from 'vue';
import { DataSerializer } from '~/typings/clienthook';
import { NuxtHookConfig } from '~/typings/stateshook/nuxt';
import { VueHookExportType } from '~/typings/stateshook/vue';

const errorSerializer: DataSerializer = {
  forward: err =>
    instanceOf(err, Error)
      ? {
          name: err.name,
          message: err.message,
          stack: err.stack
        }
      : undefinedValue,
  backward: (errPayload: any) => {
    const err = new Error(errPayload.message);
    err.name = errPayload.name;
    err.stack = errPayload.stack;
    return err;
  }
};
const counterKey = '__ALOVA_COUNTER';
const assert: ReturnType<typeof createAssert> = createAssert('nuxt-hook');
const isSSR = typeof window === 'undefined';
let allowRequest = isSSR;
// the vue's predefined hooks
export default ({ nuxtApp: useNuxtApp, serializer = {} }: NuxtHookConfig) => {
  assert(isFn(useNuxtApp), '`useNuxtApp` is required in nuxt states hook');
  const performer = createSerializerPerformer({
    error: errorSerializer,
    ...serializer
  });

  return {
    name: 'Vue',
    create: (data, key) => {
      const nuxtApp = useNuxtApp();
      (nuxtApp as any)[counterKey] = (nuxtApp as any)[counterKey] || 0;
      const counter = ((nuxtApp as any)[counterKey] += 1);
      const stateKey = `alova_${key}_${counter}`;
      const nuxtStatePayload = nuxtApp.payload[stateKey];

      //  deserialize data in client
      const state = ref(performer.deserialize(nuxtStatePayload) ?? data);
      nuxtApp.hooks.hook('app:rendered', () => {
        nuxtApp.payload[stateKey] = state.value;
      });
      return state;
    },
    dehydrate: state => state.value,
    update: (newVal, state) => {
      // serialize data in server, and deserialize in client ↑↑↑
      state.value = isSSR ? performer.serialize(newVal) : newVal;
    },
    effectRequest({ handler, removeStates, immediate, watchingStates }) {
      if (getCurrentInstance()) {
        onUnmounted(removeStates);
      }
      const nuxtApp = useNuxtApp();
      nuxtApp.hooks.hook('app:mounted', () => {
        allowRequest = trueValue;
      });

      immediate && allowRequest && handler();

      watchingStates?.forEach((state, i) => {
        watch(
          state,
          () => {
            handler(i);
          },
          { deep: trueValue }
        );
      });
    },
    computed: getter => computed(getter),
    watch: (states, callback) => {
      watch(states, callback, {
        deep: trueValue
      });
    },
    onMounted: callback => {
      if (getCurrentInstance()) {
        onMounted(callback);
      } else {
        setTimeout(callback, 10);
      }
    },
    onUnmounted: callback => {
      getCurrentInstance() && onUnmounted(callback);
    }
  } as StatesHook<VueHookExportType<unknown>>;
};
