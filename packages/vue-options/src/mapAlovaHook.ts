import { isPlainObject } from '@alova/shared/function';
import { ObjectCls, trueValue } from '@alova/shared/vars';
import { computed, reactive, version } from 'vue';
import { UseHookCallers, UseHookMapGetter, VueHookMapperMixin } from '~/typings';
import { classifyHookExposure, extractWatches } from './helper';
import myAssert from './myAssert';

/**
 * 将useHook的返回值和操作函数动态映射到vueComponent上
 *
 * **本模块经历了一定的探索过程，如下：**
 * 1. 在beforeCreate中动态添加use hook数据和函数到$options中，发现在mapGetter中无法访问到完整的vueComponent数据；
 * 2. 在data函数中调用mapGetter并返回use hook数据，这样就避免了动态添加，但获取的数据还是不够完整，例如computed、injecting无法获取到；
 * 3. 为了让mapGetter中的this可以访问到完整的数据，如data、props、computed、injecting、setup、methods等，就必须在created及以后的生命周期触发函数，但发现dataKey无法动态通过$set挂载到vueComponent对象上，$set只能动态挂载data中的某个子对象中；
 * 4. 在data中先定义一个用于存放全部use hook数据的命名空间（例如叫alova_namespace），那在用户访问use hook数据时需要通过alova_namespace.xxx.loading，太麻烦了，希望可以减少一层；
 * 5. 希望使用computed来减少一层访问路径，但在created中无法自行动态挂载computed到vueComponent上；
 * 6. （1.x中的方案）想到通过Object.defineProperty自定义挂载use hook数据到vueComponent上，并作为代理访问，这样就实现了访问xxx.loading时实际访问的是alova_namespace.xxx.loading
 * 7. （2.x中的方案）为了适配alova@3.x，现在需要动态挂载计算属性到当前实例上，同时也希望消除watch属性需要辅助函数`mapWatcher`，先方案时使用`reactive`和`computed`来动态创建状态和计算属性并挂载到当前实例上，目前要求版本为vue@2.7.x和vue@3.x，将不再支持vue@2.7之前的版本
 *
 * @param mapGetter usehook映射函数，它将返回映射的集合
 * @returns vue mixins数组
 */
export default <UHC extends UseHookCallers>(mapGetter: UseHookMapGetter<UHC>) => {
  const mixinItem = {
    created(this: any) {
      const vm = this;
      const hookMapper = mapGetter.call(vm, vm);
      myAssert(isPlainObject(hookMapper), 'expect receive an object which contains use hook exposures');

      // 在created阶段遍历发送请求
      for (const dataKey in hookMapper) {
        // 可以在useHookReturns中通过_$c获取useHook的config对象引用，将vue对象和dataKey传入alova内部
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

        // 挂载响应式状态和计算属性
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

        // 设置watchers
        const watchers = extractWatches(dataKey, vm, states, computeds);
        for (const watchingKey in watchers) {
          vm.$watch(watchingKey, watchers[watchingKey]);
        }

        // 将函数动态挂载到vue实例上
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
