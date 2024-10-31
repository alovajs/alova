import { noop } from '@alova/shared';
import Taro from '@tarojs/taro';
import { mockStorageContainer, taroDownloadConfig, taroRequestConfig, taroUploadConfig } from '../../test/utils';

interface TaroMockMap {
  request: typeof Taro.request;
  uploadFile: typeof Taro.uploadFile;
  downloadFile: typeof Taro.downloadFile;
  getStorageSync: typeof Taro.getStorageSync;
  setStorageSync: typeof Taro.setStorageSync;
  removeStorageSync: typeof Taro.removeStorageSync;
}

// 统一的响应时间
const responseDelay = 1000;

// 进度间隔时间
const progressInterval = 100;
const progressHandler = {
  upload: noop as Taro.UploadTask.OnProgressUpdateCallback,
  download: noop as Taro.DownloadTask.OnProgressUpdateCallback
};
const noopPromise = Promise.resolve(undefined as any);

export default <TaroMockMap>{
  /**
   * 模拟实现uni.request
   * @param options 请求参数
   */
  request(options) {
    taroRequestConfig.handler && taroRequestConfig.handler(options);
    const timer = setTimeout(() => {
      if (!taroRequestConfig.error && options.success) {
        options.success({
          data: {
            url: options.url,
            method: options.method,
            header: options.header || {},
            data: options.data
          } as any,
          statusCode: 200,
          header: options.header || {},
          cookies: [],
          errMsg: ''
        });
      } else if (taroRequestConfig.error && options.fail) {
        options.fail({
          errMsg: taroRequestConfig.error.message
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
      offHeadersReceived: noop,
      onChunkReceived: noop,
      offChunkReceived: noop,
      then: () => noopPromise,
      catch: () => noopPromise,
      finally: () => noopPromise,
      [Symbol.toStringTag]: 'requestTask'
    };
  },

  /**
   * uni.uploadFile模拟实现
   * @param options 上传参数
   */
  uploadFile(options) {
    taroUploadConfig.handler && taroUploadConfig.handler(options);
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
      if (!taroUploadConfig.error && options.success) {
        options.success({
          data: {
            url: options.url,
            header: options.header || {}
          } as any,
          statusCode: 200,
          header: options.header || {},
          cookies: [],
          errMsg: ''
        });
      } else if (taroUploadConfig.error && options.fail) {
        options.fail({
          errMsg: taroUploadConfig.error.message
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
      onProgressUpdate(callback) {
        progressHandler.upload = callback;
      },
      headersReceive: noop,
      progress: noop,
      offProgressUpdate: noop,
      onHeadersReceived: noop,
      offHeadersReceived: noop,
      onChunkReceived: noop,
      offChunkReceived: noop,
      then: () => noopPromise,
      catch: () => noopPromise,
      finally: () => noopPromise,
      [Symbol.toStringTag]: 'requestTask'
    };
  },

  /**
   * uni.downloadFile模拟实现
   * @param options 上传参数
   */
  downloadFile(options) {
    taroDownloadConfig.handler && taroDownloadConfig.handler(options);
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
      if (!taroDownloadConfig.error && options.success) {
        options.success({
          filePath: 'test_path',
          tempFilePath: 'test_temp_path',
          statusCode: 200,
          header: options.header || {},
          cookies: [],
          errMsg: ''
        });
      } else if (taroDownloadConfig.error && options.fail) {
        options.fail({
          errMsg: taroDownloadConfig.error.message
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
      onProgressUpdate(callback) {
        progressHandler.download = callback;
      },
      offProgressUpdate: noop,
      onHeadersReceived: noop,
      offHeadersReceived: noop,
      headersReceive: noop,
      progress: noop,
      then: () => noopPromise,
      catch: () => noopPromise,
      finally: () => noopPromise,
      [Symbol.toStringTag]: 'downloadTask'
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
