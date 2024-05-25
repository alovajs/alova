import Taro from '@tarojs/taro';

// 请求事件配置
export const taroRequestConfig = {
  handler: undefined as ((...args: any[]) => void) | undefined,
  error: undefined as Error | undefined
};
export function onRequestCall(handler: (options: Taro.request.Option) => void, error?: Error) {
  taroRequestConfig.handler = handler;
  taroRequestConfig.error = error;
}

// 上传事件配置
export const taroUploadConfig = {
  handler: undefined as ((...args: any[]) => void) | undefined,
  error: undefined as Error | undefined
};
export function onUploadCall(handler: (options: Taro.uploadFile.Option) => void, error?: Error) {
  taroUploadConfig.handler = handler;
  taroUploadConfig.error = error;
}

// 下载事件配置
export const taroDownloadConfig = {
  handler: undefined as ((...args: any[]) => void) | undefined,
  error: undefined as Error | undefined
};
export function onDownloadCall(handler: (options: Taro.downloadFile.Option) => void, error?: Error) {
  taroDownloadConfig.handler = handler;
  taroDownloadConfig.error = error;
}

// 模拟的存储容器
export const mockStorageContainer: Record<string, any> = {};

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
