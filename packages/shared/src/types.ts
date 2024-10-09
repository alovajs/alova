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

export type IsAssignable<T, T2> = T2 extends T ? true : false;

export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

export type UsePromiseExposure<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
};

export interface BackoffPolicy {
  /**
   * Delay time for re-request, in milliseconds
   * @default 1000
   */
  delay?: number;
  /**
   * Specify the delay multiple. For example, if the multiplier is set to 1.5 and the delay is 2 seconds, the first retry will be 2 seconds, the second will be 3 seconds, and the third will be 4.5 seconds
   * @default 0
   */
  multiplier?: number;

  /**
   * The jitter starting percentage value of the delay request, ranging from 0-1
   * When only startQuiver is set, endQuiver defaults to 1
   * For example, if it is set to 0.5, it will add a random time of 50% to 100% to the current delay time
   * If endQuiver has a value, the delay time will increase by a random value in the range of startQuiver and endQuiver
   */
  startQuiver?: number;

  /**
   * The jitter ending percentage value of the delay request, ranging from 0-1
   * When only endQuiver is set, startQuiver defaults to 0
   * For example, if it is set to 0.5, it will add a random time from 0% to 50% to the current delay time
   * If startQuiver has a value, the delay time will increase by a random value between startQuiver and endQuiver
   */
  endQuiver?: number;
}
