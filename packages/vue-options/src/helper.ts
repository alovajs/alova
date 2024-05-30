import { isFn } from '@alova/shared/function';
import { GeneralFn } from '@alova/shared/types';
import { ObjectCls, objectKeys } from '@alova/shared/vars';
import { OptionsComputed, OptionsState } from '~/typings';

/**
 * 将useHook的暴露项进行分类
 * @param useHookExposure useHook的返回对象
 * @returns 拆分后的对象
 */
export const classifyHookExposure = (useHookExposure: Record<string, any>) => {
  const states = {} as Record<string, any>;
  const computeds = {} as Record<string, GeneralFn>;
  const fns = {} as Record<string, GeneralFn>;
  objectKeys(useHookExposure).forEach(key => {
    const item = useHookExposure[key];
    if (isFn(item)) {
      fns[key] = item;
    } else if ((item as OptionsState<any>).type === 's') {
      states[key] = item.value;
    } else if ((item as OptionsComputed<any>).type === 'c') {
      computeds[key] = item.value;
    }
  });
  return [states, computeds, fns] as const;
};

const getPrototypeOf = (obj: any) => ObjectCls.getPrototypeOf(obj);
/**
 * 提取出容器实例需要的watch集合，并将watch函数通过apply将this指向外层vue实例
 * @param targetNamespace 命名空间，对应useHook的接收key
 * @param outerVueInstance 外层vue实例
 * @param states 容器实例的states
 * @param computeds 容器实例的computeds
 * @returns 容器实例中需要的watch集合
 */
export const extractWatches = (
  targetNamespace: string,
  outerVueInstance: any,
  states: Record<string, any>,
  computeds: Record<string, GeneralFn>
) => {
  const watches = outerVueInstance.$options.watch || {};

  // 在浏览器环境下`instance.$options.watch`为组件watch对象，但在test环境下，watch对象在`instance.$options.watch`的原型链上，因此需要做判断
  const outerWatchHandlers: Record<string, any> =
    getPrototypeOf(watches) === getPrototypeOf({}) ? watches : getPrototypeOf(watches);
  return objectKeys(outerWatchHandlers).reduce(
    (watches, key) => {
      const [namespace, innerKey] = key.split('.').map(s => s.trim());
      if (namespace === targetNamespace && (states[innerKey] || computeds[innerKey])) {
        watches[key] = (...args: any[]) => outerWatchHandlers[key].apply(outerVueInstance, args);
      }
      return watches;
    },
    {} as typeof outerWatchHandlers
  );
};
