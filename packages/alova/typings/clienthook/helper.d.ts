import { FrameworkReadableState, FrameworkState, GeneralFn, GeneralState } from '@alova/shared';
import type { AlovaGenerics, EffectRequestParams, ReferingObject, StatesExport, StatesHook } from 'alova';
import { ExportedComputed, ExportedState } from './general';

type ActualStateTranslator<AG extends AlovaGenerics, StateProxy extends FrameworkReadableState<any, string>> =
  StateProxy extends FrameworkState<any, string>
    ? ExportedState<StateProxy['v'], AG['StatesExport']>
    : ExportedComputed<StateProxy['v'], AG['StatesExport']>;
type CompletedExposingProvider<AG extends AlovaGenerics, O extends Record<string | number | symbol, any>> = {
  [K in keyof O]: O[K] extends FrameworkReadableState<any, string>
    ? ActualStateTranslator<AG, O[K]>
    : K extends `on${infer eventUnused}`
      ? (...args: Parameters<O[K]>) => CompletedExposingProvider<AG, O>
      : O[K];
};

/**
 * create simple and unified, framework-independent states creators and handlers.
 * @param statesHook states hook from `promiseStatesHook` function of alova
 * @param referingObject refering object exported from `promiseStatesHook` function
 * @returns simple and unified states creators and handlers
 */
// eslint-disable-next-line
export declare function statesHookHelper<AG extends AlovaGenerics>(
  statesHook: StatesHook<StatesExport<unknown>>,
  referingObject?: ReferingObject
): {
  create: <Data, Key extends string>(initialValue: Data, key: Key) => FrameworkState<Data, Key>;
  computed: <Data, Key extends string>(
    getter: () => Data,
    depList: (GeneralState | FrameworkReadableState<any, string>)[],
    key: Key
  ) => FrameworkReadableState<Data, Key>;
  effectRequest: (effectRequestParams: EffectRequestParams<any>) => void;
  ref: <Data>(initialValue: Data) => {
    current: Data;
  };
  memorize: <Callback extends GeneralFn>(fn: Callback) => Callback;
  watch: (source: (GeneralState | FrameworkReadableState<any, string>)[], callback: () => void) => void;
  onMounted: (callback: () => void) => void;
  onUnmounted: (callback: () => void) => void;
  /**
   * refering object that sharing some value with this object.
   */
  __referingObj: ReferingObject;
  /**
   * expose provider for specified use hook.
   * @param object object that contains state proxy, framework state, operating function and event binder.
   * @returns provider component.
   */
  exposeProvider: <O extends Record<string | number | symbol, any>>(
    object: O
  ) => CompletedExposingProvider<
    AG,
    O & {
      __referingObj: ReferingObject;
      update: (newStates: { [K in keyof O]?: any }) => void;
      __proxyState: <K extends keyof O>(key: K) => any;
    }
  >;
  /**
   * transform state proxies to object.
   * @param states proxy array of framework states
   * @param filterKey filter key of state proxy
   * @returns an object that contains the states of target form
   */
  objectify: <S extends FrameworkReadableState<any, string>[], Key extends 's' | 'v' | 'e' | undefined = undefined>(
    states: S,
    filterKey?: Key
  ) => {
    [K in S[number]['k']]: Key extends undefined
      ? Extract<
          S[number],
          {
            k: K;
          }
        >
      : Extract<
          S[number],
          {
            k: K;
          }
        >[NonNullable<Key>];
  };
  transformState2Proxy: <Key extends string>(state: GeneralState<any>, key: Key) => FrameworkState<any, Key>;
};
