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
  responseData: T extends string ? GetData : PostData;
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
