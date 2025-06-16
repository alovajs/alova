import createSerializerPerformer from '@/util/serializer';
import { createAssert, instanceOf, isFn, isSSR, trueValue, undefinedValue } from '@alova/shared';
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
let allowRequest = isSSR;
// the vue's predefined hooks
export default ({ nuxtApp: useNuxtApp, serializers = {} }: NuxtHookConfig) => {
  assert(isFn(useNuxtApp), '`useNuxtApp` is required in nuxt states hook');
  const performer = createSerializerPerformer({
    error: errorSerializer,
    ...serializers
  });

  const getCounter = (key: string) => {
    const nuxtApp = useNuxtApp();
    (nuxtApp as any)[counterKey] = (nuxtApp as any)[counterKey] || 0;
    const counter = ((nuxtApp as any)[counterKey] += 1);
    return `alova_${key}_${counter}`;
  };

  return {
    name: 'Vue',
    create: (data, key) => {
      const nuxtApp = useNuxtApp();
      const stateKey = getCounter(key);
      const nuxtStatePayload = nuxtApp.payload[stateKey];
      //  deserialize data in client
      const state = ref(performer.deserialize(nuxtStatePayload) ?? data);
      isSSR &&
        nuxtApp.hooks.hook('app:rendered', () => {
          // serialize data in server so that it can be jsonify, and deserialize in client ↑↑↑
          nuxtApp.payload[stateKey] = performer.serialize(state.value);
        });
      return state;
    },
    dehydrate: state => state.value,
    update: (newVal, state) => {
      // serialize data in server, and deserialize in client ↑↑↑
      state.value = newVal;
    },
    effectRequest({ handler, removeStates, immediate, watchingStates }, referingObject) {
      if (getCurrentInstance()) {
        onUnmounted(removeStates);
      }
      const nuxtApp = useNuxtApp();
      const stateKey = getCounter('initialRequest');
      let initialRequestInServer = referingObject.initialRequest;
      // sync the initial request flag to client, and then it can judge whether the request is allowed in client
      if (isSSR) {
        nuxtApp.hooks.hook('app:rendered', () => {
          nuxtApp.payload[stateKey] = referingObject.initialRequest;
        });
      } else {
        initialRequestInServer = !!nuxtApp.payload[stateKey];
        !allowRequest &&
          nuxtApp.hooks.hook('page:loading:end', () => {
            allowRequest = trueValue;
          });
      }

      // if initialRequestInServer is `false`, it indicated that is not call hook with `await`, so it need to request in client
      immediate && (allowRequest || !initialRequestInServer) && handler();

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
