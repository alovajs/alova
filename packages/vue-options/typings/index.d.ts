import { GeneralFn } from '@alova/shared';
import { StatesExportHelper, StatesHook } from 'alova';

export interface OptionsState<T> {
  value: T;
  type: 's';
}
export interface OptionsComputed<T extends GeneralFn> {
  value: T;
  type: 'c';
}

export type UseHookCallers = Record<string, Record<string, any>>;
export type UseHookMapGetter<UHC extends UseHookCallers> = (this: any, context: any) => UHC;

type PickFunction<T extends Record<string, any>, U = true> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends (...args: any) => any ? (U extends true ? K : never) : U extends false ? K : never;
  }[keyof T]
>;
export type FlattenObjectKeys<T extends Record<string, unknown>, K = keyof T> = K extends string
  ? T[K] extends { update: GeneralFn }
    ? `${K}$${FlattenObjectKeys<T[K]>}`
    : K
  : never;

/** vUE superstitious */
export interface VueHookMapperMixin<UHC extends UseHookCallers> {
  created(): void;
  data(): {
    [K in keyof UHC]: PickFunction<UHC[K], false>;
  };
  methods: PickFunction<{
    [K in FlattenObjectKeys<UHC>]: K extends `${infer P}$${infer S}` ? UHC[P][S] : never;
  }>;
}

/**
 * Dynamically map the return value and operation function of useHook to vueComponent
 * @param mapGetter usehook mapping function which will return a mapped collection
 * @returns vue mixins array
 */
export declare function mapAlovaHook<UHM extends UseHookCallers>(
  mapGetter: UseHookMapGetter<UHM>
): VueHookMapperMixin<UHM>[];

export type VueOptionExportType<T> = StatesExportHelper<{
  name: 'VueOption';
  State: OptionsState<T>;
  Computed: OptionsComputed<any>;
  Export: OptionsState<T> | OptionsComputed<any>;
  Watched: string;
  StateExport: T;
  ComputedExport: T;
}>;

/**
 * vue options statesHook
 */
export declare const VueOptionsHook: StatesHook<VueOptionExportType<unknown>>;
