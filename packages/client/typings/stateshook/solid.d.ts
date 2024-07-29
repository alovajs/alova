import { StatesExportHelper, StatesHook } from 'alova';
import { Accessor, Setter } from 'solid-js';

// 定义 Solid Hook 导出的类型
export type SolidHookExportType<T> = StatesExportHelper<{
  name: 'Solid';
  State: SolidState<T>;
  Computed: Accessor<T>;
  Watched: T;
  StateExport: Accessor<T>;
  ComputedExport: Accessor<T>;
}>;

// 定义 Solid 状态的类型
export type SolidState<D> = [Accessor<D>, Setter<D>];
// 定义 Solid Hook 的类型
export type SolidHookType = StatesHook<SolidHookExportType<unknown>>;

// 声明 Solid Hook
declare const solidHook: SolidHookType;

export default solidHook;
