import { Method } from '../packages/alova/src';

type GetData = {
  path: string;
  method: string;
  params: Record<string, string>;
};
type PostData = {
  path: string;
  method: string;
  params: Record<string, string>;
  data: Record<string, string>;
};
export type Result<T = string> = {
  code: number;
  msg: string;
  data: T extends string ? GetData : PostData;
};

// 辅助函数
export const untilCbCalled = <T>(setCb: (cb: (arg: T) => void, ...others: any[]) => void, ...args: any[]) =>
  new Promise<T>(resolve => {
    setCb(
      d => {
        resolve(d);
      },
      ...args
    );
  });

export const delay = (ts = 0) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ts);
  });

/**
 * resolve returned promise when param promise is rejected
 */
export const untilReject = (promise: Promise<any> | Method) =>
  new Promise<Error>(resolve => {
    promise.catch(resolve);
  });

export const generateContinuousNumbers = (
  end: number,
  start = 0,
  transform: ((i: number) => any) | Record<string | number, any> = i => i
) => {
  const transformFn = typeof transform === 'object' ? (i: number) => transform[i] || i : transform;
  return Array.from({ length: Math.abs(end - start + 1) }).map((_, i) => transformFn(start + i));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const expectType = <T>(value: T) => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const expectTrue = <T extends true>() => {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const expectAssignableBy = <T, T2 extends T = T>(value: T2) => {};

export const randomId = () => Math.random().toString(36).slice(2);
