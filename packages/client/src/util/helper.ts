import {
  $self,
  FrameworkReadableState,
  FrameworkState,
  GeneralFn,
  GeneralState,
  ObjectCls,
  clearTimeoutTimer,
  createAssert,
  falseValue,
  filterItem,
  forEach,
  includes,
  injectReferingObject,
  instanceOf,
  isFn,
  isNumber,
  mapItem,
  newInstance,
  noop,
  nullValue,
  objAssign,
  objectKeys,
  pushItem,
  setTimeoutFn,
  trueValue
} from '@alova/shared';
import { Method } from 'alova';

import type { AlovaGenerics, EffectRequestParams, ReferingObject, StatesExport, StatesHook } from 'alova';
import type { AlovaMethodHandler, ExportedComputed, ExportedState } from '~/typings/clienthook';

/**
 * Compatible functions, throwing parameters
 * @param error mistake
 */
export const throwFn = <T>(error: T) => {
  throw error;
};

export function useCallback<Fn extends GeneralFn = GeneralFn>(onCallbackChange: (callbacks: Fn[]) => void = noop) {
  let callbacks: Fn[] = [];

  const setCallback = (fn: Fn) => {
    if (!callbacks.includes(fn)) {
      callbacks.push(fn);
      onCallbackChange(callbacks);
    }
    // Return unregister function
    return () => {
      callbacks = filterItem(callbacks, e => e !== fn);
      onCallbackChange(callbacks);
    };
  };

  const triggerCallback = (...args: any[]) => {
    if (callbacks.length > 0) {
      return forEach(callbacks, fn => fn(...args));
    }
  };

  const removeAllCallback = () => {
    callbacks = [];
    onCallbackChange(callbacks);
  };

  return [setCallback, triggerCallback as Fn, removeAllCallback] as const;
}

/**
 * Create a debounce function and trigger the function immediately when delay is 0
 * Scenario: When calling useWatcher and setting immediate to true, the first call must be executed immediately, otherwise it will cause a delayed call
 * @param {GeneralFn} fn callback function
 * @param {number|(...args: any[]) => number} delay Delay description, dynamic delay can be achieved when set as a function
 * @returns Delayed callback function
 */
export const debounce = (fn: GeneralFn, delay: number | ((...args: any[]) => number)) => {
  let timer: any = nullValue;
  return function debounceFn(this: any, ...args: any[]) {
    const bindFn = fn.bind(this, ...args);
    const delayMill = isNumber(delay) ? delay : delay(...args);
    timer && clearTimeoutTimer(timer);
    if (delayMill > 0) {
      timer = setTimeoutFn(bindFn, delayMill);
    } else {
      bindFn();
    }
  };
};

/**
 * Get the request method object
 * @param methodHandler Request method handle
 * @param args Method call parameters
 * @returns request method object
 */
export const getHandlerMethod = (methodHandler: Method | AlovaMethodHandler, args: any[] = []) => {
  const methodInstance = isFn(methodHandler) ? methodHandler(...args) : methodHandler;
  createAssert('scene')(
    instanceOf(methodInstance, Method),
    'hook handler must be a method instance or a function that returns method instance'
  );
  return methodInstance;
};

/**
 * Convert each value of the object and return the new object
 * @param obj object
 * @param callback callback function
 * @returns converted object
 */
export const mapObject = <T extends Record<string, any>, U>(
  obj: T,
  callback: (value: T[keyof T], key: string, parent: T) => U
) => {
  const ret: Record<string, U> = {};
  for (const key in obj) {
    ret[key] = callback(obj[key], key, obj);
  }
  return ret as Record<keyof T, U>;
};

export const enum EnumHookType {
  USE_REQUEST = 1,
  USE_WATCHER = 2,
  USE_FETCHER = 3
}

interface MemorizedFunction {
  (...args: any[]): any;
  memorized: true;
}

type ActualStateTranslator<AG extends AlovaGenerics, StateProxy extends FrameworkReadableState<any, string>> =
  StateProxy extends FrameworkState<any, string>
    ? ExportedState<StateProxy['v'], AG['StatesExport']>
    : ExportedComputed<StateProxy['v'], AG['StatesExport']>;
type CompletedExposingProvider<AG extends AlovaGenerics, O extends Record<string | number | symbol, any>> = {
  [K in keyof O]: O[K] extends FrameworkReadableState<any, string>
    ? ActualStateTranslator<AG, O[K]>
    : // eslint-disable-next-line @typescript-eslint/no-unused-vars
      K extends `on${infer _}`
      ? (...args: Parameters<O[K]>) => CompletedExposingProvider<AG, O>
      : O[K];
};
/**
 * create simple and unified, framework-independent states creators and handlers.
 * @param statesHook states hook from `promiseStatesHook` function of alova
 * @param referingObject refering object exported from `promiseStatesHook` function
 * @returns simple and unified states creators and handlers
 */
export function statesHookHelper<AG extends AlovaGenerics>(
  statesHook: StatesHook<StatesExport<unknown>>,
  referingObject: ReferingObject = { trackedKeys: {}, bindError: falseValue, ...injectReferingObject() }
) {
  const ref = <Data>(initialValue: Data) => (statesHook.ref ? statesHook.ref(initialValue) : { current: initialValue });
  referingObject = ref(referingObject).current;
  const exportState = <Data>(state: GeneralState<Data>) =>
    (statesHook.export || $self)(state, referingObject) as GeneralState<Data>;
  const memorize = <Callback extends GeneralFn>(fn: Callback) => {
    if (!isFn(statesHook.memorize)) {
      return fn;
    }
    const memorizedFn = statesHook.memorize(fn);
    (memorizedFn as unknown as MemorizedFunction).memorized = trueValue;
    return memorizedFn;
  };
  const { dehydrate } = statesHook;

  // For performance reasons, only value is different, and the key is tracked can be updated.
  const update = (newValue: any, state: GeneralState, key: string) =>
    newValue !== dehydrate(state, key, referingObject) &&
    referingObject.trackedKeys[key] &&
    statesHook.update(newValue, state, key, referingObject);
  const mapDeps = (deps: (GeneralState | FrameworkReadableState<any, string>)[]) =>
    mapItem(deps, item => (instanceOf(item, FrameworkReadableState) ? item.e : item));
  const createdStateList = [] as string[];

  // key of deps on computed
  const depKeys: Record<string, true> = {};

  return {
    create: <Data, Key extends string>(initialValue: Data, key: Key) => {
      pushItem(createdStateList, key); // record the keys of created states.
      return newInstance(
        FrameworkState<Data, Key>,
        statesHook.create(initialValue, key, referingObject) as GeneralState<Data>,
        key,
        state => dehydrate(state, key, referingObject),
        exportState,
        (state, newValue) => update(newValue, state, key)
      );
    },
    computed: <Data, Key extends string>(
      getter: () => Data,
      depList: (GeneralState | FrameworkReadableState<any, string>)[],
      key: Key
    ) => {
      // Collect all dependencies in computed
      forEach(depList, dep => {
        if (dep.k) {
          depKeys[dep.k as string] = trueValue;
        }
      });

      return newInstance(
        FrameworkReadableState<Data, Key>,
        statesHook.computed(getter, mapDeps(depList), key, referingObject) as GeneralState<Data>,
        key,
        state => dehydrate(state, key, referingObject),
        exportState
      );
    },
    effectRequest: (effectRequestParams: EffectRequestParams<any>) =>
      statesHook.effectRequest(effectRequestParams, referingObject),
    ref,
    watch: (source: (GeneralState | FrameworkReadableState<any, string>)[], callback: () => void) =>
      statesHook.watch(mapDeps(source), callback, referingObject),
    onMounted: (callback: () => void) => statesHook.onMounted(callback, referingObject),
    onUnmounted: (callback: () => void) => statesHook.onUnmounted(callback, referingObject),
    memorize,

    /**
     * refering object that sharing some value with this object.
     */
    __referingObj: referingObject,

    /**
     * expose provider for specified use hook.
     * @param object object that contains state proxy, framework state, operating function and event binder.
     * @returns provider component.
     */
    exposeProvider: <O extends Record<string | number | symbol, any>>(object: O) => {
      const provider: Record<string | number | symbol, any> = {};
      const originalStatesMap: Record<string, GeneralState> = {};
      for (const key in object) {
        const value = object[key];
        const isValueFunction = isFn(value);
        // if it's a memorized function, don't memorize it any more, add it to provider directly.
        // if it's start with `on`, that indicates it is an event binder, we should define a new function which return provider object.
        // if it's a common function, add it to provider with memorize mode.

        // Note that: in some situation, state is a function such as solid's signal, and state value is set to function in react,  the state will be detected as a function. so we should check whether the key is in `trackedKeys`
        if (isValueFunction && !referingObject.trackedKeys[key]) {
          provider[key] = key.startsWith('on')
            ? (...args: any[]) => {
                value(...args);
                // eslint-disable-next-line
                return completedProvider;
              }
            : (value as MemorizedFunction).memorized
              ? value
              : memorize(value);
        } else {
          const isFrameworkState = instanceOf(value, FrameworkReadableState);
          if (isFrameworkState) {
            originalStatesMap[key] = value.s;
          }
          // otherwise, it's a state proxy or framework state, add it to provider with getter mode.
          ObjectCls.defineProperty(provider, key, {
            get: () => {
              // record the key that is being tracked.
              referingObject.trackedKeys[key] = trueValue;
              return isFrameworkState ? value.e : value;
            },

            // set need to set an function,
            // otherwise it will throw `TypeError: Cannot set property __referingObj of #<Object> which has only a getter` when setting value
            set: noop,
            enumerable: trueValue,
            configurable: trueValue
          });
        }
      }

      const { update: nestedHookUpdate, __proxyState: nestedProxyState } = provider;
      // reset the tracked keys and bingError flag, so that the nest hook providers can be initialized.
      // Always track the dependencies in computed
      referingObject.trackedKeys = {
        ...depKeys
      };
      referingObject.bindError = falseValue;

      const extraProvider = {
        // expose referingObject automatically.
        __referingObj: referingObject,

        // the new updating function that can update the new states and nested hook states.
        update: memorize(
          (newStates: {
            [K in keyof O]?: any;
          }) => {
            objectKeys(newStates).forEach(key => {
              if (includes(createdStateList, key)) {
                update(newStates[key], originalStatesMap[key], key);
              } else if (key in provider && isFn(nestedHookUpdate)) {
                nestedHookUpdate({
                  [key]: newStates[key]
                });
              }
            });
          }
        ),
        __proxyState: memorize(<K extends keyof O>(key: K) => {
          if (includes(createdStateList, key as string) && instanceOf(object[key], FrameworkReadableState)) {
            // need to tag the key that is being tracked so that it can be updated with `state.v = xxx`.
            referingObject.trackedKeys[key as string] = trueValue;
            return object[key];
          }
          return nestedProxyState(key);
        })
      };

      const completedProvider = objAssign(provider, extraProvider) as CompletedExposingProvider<
        AG,
        O & typeof extraProvider
      >;
      return completedProvider;
    },

    /**
     * transform state proxies to object.
     * @param states proxy array of framework states
     * @param filterKey filter key of state proxy
     * @returns an object that contains the states of target form
     */
    objectify: <S extends FrameworkReadableState<any, string>[], Key extends 's' | 'v' | 'e' | undefined = undefined>(
      states: S,
      filterKey?: Key
    ) =>
      states.reduce(
        (result, item) => {
          (result as any)[item.k] = filterKey ? item[filterKey] : item;
          return result;
        },
        {} as {
          [K in S[number]['k']]: Key extends undefined
            ? Extract<S[number], { k: K }>
            : Extract<S[number], { k: K }>[NonNullable<Key>];
        }
      ),

    transformState2Proxy: <Key extends string>(state: GeneralState<any>, key: Key) =>
      newInstance(
        FrameworkState<any, Key>,
        state,
        key,
        state => dehydrate(state, key, referingObject),
        exportState,
        (state, newValue) => update(newValue, state, key)
      )
  };
}
