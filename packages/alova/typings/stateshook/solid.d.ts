import { StatesExportHelper, StatesHook } from 'alova';
import { Accessor, Setter } from 'solid-js';

// define SolidHooks export type
export type SolidHookExportType<T> = StatesExportHelper<{
  name: 'Solid';
  State: SolidState<T>;
  Computed: SolidState<T>;
  Watched: Accessor<T>;
  StateExport: Accessor<T>;
  ComputedExport: Accessor<T>;
}>;

// solid state type
export type SolidState<D> = [Accessor<D>, Setter<D>];
// solid hook type
export type SolidHookType = StatesHook<SolidHookExportType<unknown>>;

declare const solidHook: SolidHookType;
export default solidHook;
