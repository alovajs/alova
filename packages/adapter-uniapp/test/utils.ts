/// <reference path="../node_modules/@dcloudio/types/uni-app/index.d.ts" />

// 请求事件配置
export const uniRequestConfig = {
  handler: undefined as Function | undefined,
  error: undefined as Error | undefined
};
export function onRequestCall(handler: (options: UniNamespace.RequestOptions) => void, error?: Error) {
  uniRequestConfig.handler = handler;
  uniRequestConfig.error = error;
}

// 上传事件配置
export const uniUploadConfig = {
  handler: undefined as Function | undefined,
  error: undefined as Error | undefined
};
export function onUploadCall(handler: (options: UniNamespace.UploadFileOption) => void, error?: Error) {
  uniUploadConfig.handler = handler;
  uniUploadConfig.error = error;
}

// 下载事件配置
export const uniDownloadConfig = {
  handler: undefined as Function | undefined,
  error: undefined as Error | undefined
};
export function onDownloadCall(handler: (options: UniNamespace.DownloadFileOption) => void, error?: Error) {
  uniDownloadConfig.handler = handler;
  uniDownloadConfig.error = error;
}

// 模拟的存储容器
export const mockStorageContainer: Record<string, any> = {};
