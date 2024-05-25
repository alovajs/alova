import { noop } from '@alova/shared/function';
import { mockStorageContainer, uniDownloadConfig, uniRequestConfig, uniUploadConfig } from './utils';

type AnyFn = (options: any) => any;
interface UniMockMap {
  request: AnyFn;
  uploadFile: AnyFn;
  downloadFile: AnyFn;
  getStorageSync: UniNamespace.Uni['getStorageSync'];
  setStorageSync: UniNamespace.Uni['setStorageSync'];
  removeStorageSync: UniNamespace.Uni['removeStorageSync'];
  clearStorageSync: UniNamespace.Uni['clearStorageSync'];
}

// 统一的响应时间
const responseDelay = 1000;

// 进度间隔时间
const progressInterval = 100;
const progressHandler = {
  upload: noop as (result: UniNamespace.OnProgressUpdateResult) => void,
  download: noop as (result: UniNamespace.OnProgressDownloadResult) => void
};
const uniMockMap: UniMockMap = {
  /**
   * 模拟实现uni.request
   * @param options 请求参数
   */
  request(options) {
    uniRequestConfig.handler && uniRequestConfig.handler(options);
    const timer = setTimeout(() => {
      if (!uniRequestConfig.error && options.success) {
        options.success({
          data: {
            url: options.url,
            method: options.method,
            header: options.header || {},
            data: options.data
          },
          statusCode: 200,
          header: options.header || {},
          cookies: []
        });
      } else if (uniRequestConfig.error && options.fail) {
        options.fail({
          errMsg: uniRequestConfig.error.message
        });
      }
    }, responseDelay);

    return {
      abort() {
        clearTimeout(timer);
        options.fail &&
          options.fail({
            errMsg: 'request:fail abort'
          });
      },
      onHeadersReceived: noop,
      offHeadersReceived: noop
    };
  },

  /**
   * uni.uploadFile模拟实现
   * @param options 上传参数
   */
  uploadFile(options) {
    uniUploadConfig.handler && uniUploadConfig.handler(options);

    const total = 200;
    let sent = 20;
    const progressTimer = setInterval(() => {
      sent += (200 / responseDelay) * progressInterval;
      progressHandler.upload({
        totalBytesExpectedToSend: total,
        totalBytesSent: sent,
        progress: sent / total
      });
    }, progressInterval);

    const timer = setTimeout(() => {
      clearInterval(progressTimer);
      if (!uniUploadConfig.error && options.success) {
        options.success({
          data: 'success',
          statusCode: 200
        });
      } else if (uniUploadConfig.error && options.fail) {
        options.fail({
          errMsg: uniUploadConfig.error.message
        });
      }
    }, responseDelay);

    return {
      abort() {
        clearTimeout(timer);
        clearInterval(progressTimer);
        options.fail &&
          options.fail({
            errMsg: 'uploadFile:fail abort'
          });
      },
      onProgressUpdate(callback: any) {
        progressHandler.upload = callback;
      },
      offProgressUpdate: noop,
      onHeadersReceived: noop,
      offHeadersReceived: noop
    };
  },

  /**
   * uni.downloadFile模拟实现
   * @param options 上传参数
   */
  downloadFile(options) {
    uniDownloadConfig.handler && uniDownloadConfig.handler(options);

    const total = 200;
    let written = 20;
    const progressTimer = setInterval(() => {
      written += (200 / responseDelay) * progressInterval;
      progressHandler.download({
        totalBytesExpectedToWrite: total,
        totalBytesWritten: written,
        progress: written / total
      });
    }, progressInterval);
    const timer = setTimeout(() => {
      clearInterval(progressTimer);
      if (!uniDownloadConfig.error && options.success) {
        options.success({
          tempFilePath: 'test_path',
          statusCode: 200
        });
      } else if (uniDownloadConfig.error && options.fail) {
        options.fail({
          errMsg: uniDownloadConfig.error.message
        });
      }
    }, responseDelay);

    return {
      abort() {
        clearTimeout(timer);
        clearInterval(progressTimer);
        options.fail &&
          options.fail({
            errMsg: 'downloadFile:fail abort'
          });
      },
      onProgressUpdate(callback: any) {
        progressHandler.download = callback;
      },
      offProgressUpdate: noop,
      onHeadersReceived: noop,
      offHeadersReceived: noop
    };
  },

  // uni存储函数模拟
  setStorageSync(key, value) {
    mockStorageContainer[key] = value;
  },
  getStorageSync(key) {
    return mockStorageContainer[key];
  },
  removeStorageSync(key) {
    delete mockStorageContainer[key];
  },
  clearStorageSync() {
    for (const key in mockStorageContainer) {
      delete mockStorageContainer[key];
    }
  }
};

declare const global: any;
global.uni = (window as any).uni = uniMockMap;
