import { noop, undefinedValue } from '@alova/shared';
import type { ProgressUpdater } from 'alova';
import axios, { AxiosResponseHeaders } from 'axios';
import { AdapterCreateOptions, AxiosRequestAdapter } from '~/typings';

/**
 * axios request adapter
 */
export default function requestAdapter(options: AdapterCreateOptions = {}) {
  const adaptedAxiosInstance = options.axios || axios;
  const adapter: AxiosRequestAdapter = (_, method) => {
    let downloadHandler: ProgressUpdater = noop;
    let uploadHandler: ProgressUpdater = noop;
    const { config } = method;
    const controller = new AbortController();
    const { baseURL, timeout } = adaptedAxiosInstance.defaults;
    const responsePromise = adaptedAxiosInstance({
      url: method.url,
      method: method.type,
      baseURL: baseURL || method.baseURL,
      timeout: timeout || method.config.timeout,
      data: method.data,
      signal: controller.signal,
      // `onUploadProgress` allows handling progress events for uploads
      onUploadProgress:
        process.env.NODE_ENV !== 'test'
          ? event => {
              uploadHandler(event.loaded, event.total || 1);
            }
          : undefinedValue,
      // `onDownloadProgress` allows handling progress events for downloads
      onDownloadProgress: event => {
        downloadHandler(event.loaded, event.total || 1);
      },
      ...config
    });

    return {
      response: () => responsePromise,
      headers: () => responsePromise.then(res => res?.headers as AxiosResponseHeaders),
      abort: () => {
        controller.abort();
      },
      onDownload: handler => {
        downloadHandler = handler;
      },
      onUpload: handler => {
        uploadHandler = handler;
      }
    };
  };
  return adapter;
}
