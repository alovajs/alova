import { isPlainObject, ObjectCls, trueValue } from '@alova/shared';
import { computed, reactive, version } from 'vue';
import { UseHookCallers, UseHookMapGetter, VueHookMapperMixin } from '~/typings';
import { classifyHookExposure, extractWatches } from './helper';
import myAssert from './myAssert';

/**
 * Dynamically map the return value and operation function of useHook to vueComponent
 *
 * ** This module has gone through a certain exploration process, as follows: **
 * 1. Dynamically add use hook data and functions to $options in beforeCreate, and find that the complete vueComponent data cannot be accessed in mapGetter;
 * 2. Call mapGetter in the data function and return the use hook data. This avoids dynamic addition, but the data obtained is still incomplete. For example, computed and injecting cannot be obtained;
 * 3. In order to allow this in mapGetter to access complete data, such as data, props, computed, injecting, setup, methods, etc., the function must be triggered in the created and subsequent life cycles. However, it was found that the dataKey cannot be dynamically hung through $set. Loaded to the vueComponent object, $set can only dynamically mount a sub-object in data;
 * 4. First define a namespace in data to store all use hook data (for example, called alova_namespace). Then when users access use hook data, they need to go through alova_namespace.xxx.loading. It is too troublesome. I hope it can be reduced by one layer;
 * 5. I hope to use computed to reduce one layer of access paths, but I cannot dynamically mount computed to vueComponent in created;
 * 6. (Scheme in 1.x) I thought of custom-mounting use hook data to vueComponent through Object.defineProperty and accessing it as a proxy. In this way, when accessing xxx.loading, the actual access is alova_namespace.xxx.loading.
 * 7. (Scheme in 2.x) In order to adapt to alova@3.x, it is now necessary to dynamically mount calculated properties to the current instance. At the same time, we also hope to eliminate the need for watch properties and the auxiliary function `mapWatcher`. Use `reactive` in the first solution ` and `computed` to dynamically create state and calculated properties and mount them on the current instance. The current required versions are vue@2.7.x and vue@3.x, and versions before vue@2.7 will no longer be supported.
 *
 * @param mapGetter usehook mapping function which will return a mapped collection
 * @returns vue mixins array
 */
export default <UHC extends UseHookCallers>(mapGetter: UseHookMapGetter<UHC>) => {
  const mixinItem = {
    created(this: any) {
      const vm = this;
      const hookMapper = mapGetter.call(vm, vm);
      myAssert(isPlainObject(hookMapper), 'expect receive an object which contains use hook exposures');

      // Traverse and send requests in the created phase
      for (const dataKey in hookMapper) {
        // You can get the config object reference of use hook through $c in use hook returns, and pass the vue object and data key into alova.
        const useHookExposure = hookMapper[dataKey];
        const { __referingObj: referingObject } = useHookExposure;
        myAssert(
          !!referingObject,
          `the use hook exposure of key \`${dataKey}\` is not supported in vue options style.`
        );

        referingObject.component = vm;
        referingObject.dataKey = dataKey;
        const originalTrackedKeys = { ...referingObject.trackedKeys };
        const [states, computeds, fns] = classifyHookExposure(useHookExposure);
        referingObject.trackedKeys = originalTrackedKeys; // recovery trackedKeys

        // require the version of vue must be 3.x or 2.7.x
        myAssert(/^3|2\.7/.test(version), 'please upgrade vue to `2.7.x` or `3.x`');

        // Mount reactive state and computed properties
        const proxy = {};
        vm[dataKey] = proxy;
        const rectiveStates = reactive(states);
        for (const key in states) {
          ObjectCls.defineProperty(proxy, key, {
            get: () => {
              referingObject.trackedKeys[key] = trueValue;
              return rectiveStates[key];
            },
            set: value => {
              rectiveStates[key] = value;
              return value;
            }
          });
        }
        for (const key in computeds) {
          const computedState = computed(computeds[key]);
          ObjectCls.defineProperty(proxy, key, {
            get: () => {
              referingObject.trackedKeys[key] = trueValue;
              return computedState.value;
            }
          });
        }

        // Set watchers
        const watchers = extractWatches(dataKey, vm, states, computeds);
        for (const watchingKey in watchers) {
          vm.$watch(watchingKey, watchers[watchingKey]);
        }

        // Dynamically mount the function to the vue instance
        for (const key in fns) {
          (vm as any)[`${dataKey}$${key}`] = function (...args: any) {
            return fns[key](...args);
          };
        }
      }
    }
  };
  return [mixinItem as VueHookMapperMixin<UHC>];
};
