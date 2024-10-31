import { GeneralFn, isFn, ObjectCls, objectKeys } from '@alova/shared';
import { OptionsComputed, OptionsState } from '~/typings';

/**
 * Classify useHook's exposure items
 * @param useHookExposure useHook return object
 * @returns split object
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
 * Extract the watch collection required by the container instance, and use the watch function to point this to the outer vue instance through apply.
 * @param targetNamespace Namespace, corresponding to the receiving key of useHook
 * @param outerVueInstance Outer vue instance
 * @param states Container instance states
 * @param computeds Computeds of container instances
 * @returns The watch collection required in the container instance
 */
export const extractWatches = (
  targetNamespace: string,
  outerVueInstance: any,
  states: Record<string, any>,
  computeds: Record<string, GeneralFn>
) => {
  const watches = outerVueInstance.$options.watch || {};

  // In the browser environment, `instance.$options.watch` is the component watch object, but in the test environment, the watch object is on the prototype chain of `instance.$options.watch`, so judgment needs to be made
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
