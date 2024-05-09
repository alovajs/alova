export type GeneralFn = (...args: any[]) => any;

/**
 * common UI framework state type
 */
export interface GeneralState<T = unknown> {
  [x: string]: T;
}

/**
 * is any type
 */
export type IsAny<T, P, N> = 0 extends 1 & T ? P : N;

/**
 * is unknown type
 */
export type IsUnknown<T, P, N> = IsAny<T, P, N> extends P ? N : unknown extends T ? P : N;
