import { isPlainObject } from '@alova/shared/function';
import { ObjectCls } from '@alova/shared/vars';
import Vue from 'vue';
import { UseHookCallers, UseHookMapGetter, VueHookMapperMixin } from '~/typings';
import { splitStatesAndFn } from './helper';
import myAssert from './myAssert';

const vueComponentAlovaHookStateKey = 'alovaHook$';
/**
 * 将useHook的返回值和操作函数动态映射到vueComponent上
 *
 * 本模块经历了一定的探索过程，如下：
 * 1. 在beforeCreate中动态添加use hook数据和函数到$options中，发现在mapGetter中无法访问到完整的vueComponent数据；
 * 2. 在data函数中调用mapGetter并返回use hook数据，这样就避免了动态添加，但获取的数据还是不够完整，例如computed、injecting无法获取到；
 * 3. 为了让mapGetter中的this可以访问到完整的数据，如data、props、computed、injecting、setup、methods等，就必须在created及以后的生命周期触发函数，但发现dataKey无法动态通过$set挂载到vueComponent对象上，$set只能动态挂载data中的某个子对象中；
 * 4. 在data中先定义一个用于存放全部use hook数据的命名空间（例如叫alova_namespace），那在用户访问use hook数据时需要通过alova_namespace.xxx.loading，太麻烦了，希望可以减少一层；
 * 5. 希望使用computed来减少一层访问路径，但在created中无法自行动态挂载computed到vueComponent上；
 * 6. （最终方案）想到通过Object.defineProperty自定义挂载use hook数据到vueComponent上，并作为代理访问，这样就实现了访问xxx.loading时实际访问的是alova_namespace.xxx.loading
 *
 * @param mapGetter usehook映射函数，它将返回映射的集合
 * @returns vue mixins数组
 */
export default <GR extends UseHookCallers>(mapGetter: UseHookMapGetter<GR>) => {
  const mixinItem = {
    data() {
      return {
        [vueComponentAlovaHookStateKey]: {}
      };
    },
    created(this: Vue) {
      const vm = this;
      const hookMapper = mapGetter.call(vm, vm);
      myAssert(isPlainObject(hookMapper), 'expect receive an object which contains use hook return values');

      // 在created阶段遍历发送请求
      for (const dataKey in hookMapper) {
        // 可以在useHookReturns中通过_$c获取useHook的config对象引用，将vue对象和dataKey传入alova内部
        const useHookExposure = hookMapper[dataKey];
        const { referingObject } = useHookExposure;
        myAssert(
          !!referingObject,
          `the use hook exposure of key \`${dataKey}\` is not supported in vue options style.`
        );

        // TODO: 添加计算属性的方式
        // const computedContainer = new Vue({
        //   computed: {
        //     test2: () => {
        //       console.log('test2已更新');
        //       return `${this.wechatUrl}_test2`;
        //     }
        //   }
        // });
        // Object.defineProperty(this, 'test2', {
        //   get: () => {
        //     console.log('已读取test2');
        //     return computedContainer.test2;
        //   },
        //   enumerable: true,
        //   configurable: true
        // });

        referingObject.dataKey = dataKey;
        referingObject.component = vm;

        // 不设置set函数，禁止覆盖use hook对应的对象
        ObjectCls.defineProperty(vm, dataKey, {
          get: () => (vm as any)[vueComponentAlovaHookStateKey][dataKey] || {},
          set: value => {
            (vm as any)[vueComponentAlovaHookStateKey][dataKey] = value;
          }
        });
        const [states, fns] = splitStatesAndFn(useHookExposure);
        if (vm.$set) {
          // vue2
          vm.$set((vm as any)[vueComponentAlovaHookStateKey], dataKey, states);
        } /* c8 ignore start */ else {
          // vue3，它将在npm run test:vue3中测试到
          (vm as any)[vueComponentAlovaHookStateKey][dataKey] = states;
        }
        /* c8 ignore stop */
        for (const key in fns) {
          (vm as any)[`${dataKey}$${key}`] = function anonymous(...args: any) {
            return fns[key](...args);
          };
        }
      }
    }
  };
  return [mixinItem as VueHookMapperMixin<GR>];
};
