export type GeneralFn = (...args: any[]) => any;

/**
 * common UI framework state type
 */
export interface FrameworkState<T> {
  [x: string]: T;
}
