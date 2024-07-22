import { isPlainObject, noop } from '@alova/shared/function';
import Taro from '@tarojs/taro';
import { Arg, ProgressUpdater } from 'alova';
import { TaroRequestAdapter } from '~/typings';

/**
 * Uniapp请求适配器
 */
const requestAdapter: TaroRequestAdapter = (elements, method) => {
  const { url, data, type, headers: header } = elements;
  let taskInstance: Taro.RequestTask<any> | Taro.UploadTask.UploadTaskPromise | Taro.DownloadTask.DownloadTaskPromise;
  let onDownload: ReturnType<TaroRequestAdapter>['onDownload'] = noop;
  let onUpload: ReturnType<TaroRequestAdapter>['onUpload'] = noop;

  const responsePromise = new Promise<
    | Taro.uploadFile.SuccessCallbackResult
    | Taro.downloadFile.FileSuccessCallbackResult
    | Taro.request.SuccessCallbackResult<any>
  >((resolve, reject) => {
    const { config: adapterConfig } = method;
    const { requestType, timeout } = adapterConfig;
    if (requestType === 'upload') {
      const formData = {} as Arg;
      const fileData = {} as Arg;
      if (isPlainObject(data)) {
        Object.keys(data).forEach(key => {
          if (['name', 'filePath'].includes(key)) {
            fileData[key] = data[key as keyof typeof data];
          } else {
            formData[key] = data[key as keyof typeof data];
          }
        });
      }

      // 上传文件
      const uploadTask = (taskInstance = Taro.uploadFile({
        ...adapterConfig,
        filePath: fileData.filePath,
        name: fileData.name,
        url,
        header,
        formData,
        timeout,
        success: res => resolve(res),
        fail: reason => reject(new Error(reason.errMsg)),
        complete: noop
      }));

      // 监听上传进度
      onUpload = (handler: ProgressUpdater) => {
        uploadTask.onProgressUpdate(({ totalBytesSent, totalBytesExpectedToSend }) => {
          handler(totalBytesSent, totalBytesExpectedToSend);
        });
      };
    } else if (requestType === 'download') {
      // 下载文件
      const downloadTask = (taskInstance = Taro.downloadFile({
        ...adapterConfig,
        url,
        header,
        timeout,
        success: res => resolve(res),
        fail: reason => reject(new Error(reason.errMsg)),
        complete: noop
      }));

      // 监听下载进度
      onDownload = (handler: ProgressUpdater) => {
        downloadTask.onProgressUpdate(({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          handler(totalBytesWritten, totalBytesExpectedToWrite);
        });
      };
    } else {
      // 发送普通请求
      taskInstance = Taro.request({
        ...adapterConfig,
        url,
        data,
        header,
        method: type as any,
        timeout,
        success: res => resolve(res),
        fail: reason => reject(new Error(reason.errMsg))
      });
    }
  });

  return {
    response: () => responsePromise,
    headers: () => responsePromise.then(res => res.header || {}),
    abort: () => {
      taskInstance.abort();
    },
    onDownload,
    onUpload
  };
};

export default requestAdapter;
