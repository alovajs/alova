/// <reference path="../node_modules/@dcloudio/types/index.d.ts" />
import AdapterUniapp from '@/index';
import { noop } from '@alova/shared/function';
import { createAlova } from 'alova';
import { useRequest } from 'alova/client';
import { delay, untilCbCalled } from 'root/testUtils';
import { onDownloadCall, onRequestCall, onUploadCall } from './utils';

describe('request adapter', () => {
  test('should call uni.request and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      beforeRequest(method) {
        method.config.headers.a = 'a';
        method.meta = {
          from: 'beforeRequest'
        };
      },
      responded(data, m) {
        expect(m.meta).toStrictEqual({
          from: 'beforeRequest'
        });
        expect(m.config.headers.a).toBe('a');

        const { statusCode, data: subData } = data as UniNamespace.RequestSuccessCallbackResult;
        expect(statusCode).toBe(200);
        if (subData) {
          return subData;
        }
        return null;
      },
      ...AdapterUniapp()
    });

    interface ResponseData {
      url: string;
      method: string;
      data: any;
      header: Record<string, any>;
    }
    const Get = alovaInst.Get<ResponseData>('/unit-test', {
      params: {
        a: '1',
        b: '2'
      },
      enableHttp2: true,
      sslVerify: true
    });

    // 验证请求数据
    const mockFn = jest.fn();
    onRequestCall(options => {
      mockFn();
      expect(options.url).toBe('http://xxx/unit-test?a=1&b=2');
      expect(options.enableHttp2).toBeTruthy();
      expect(options.sslVerify).toBeTruthy();
    });

    const { loading, data, downloading, error, onSuccess } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(loading.value).toBeFalsy();
    expect(data.value.url).toBe('http://xxx/unit-test?a=1&b=2');
    expect(data.value.header).toStrictEqual({ a: 'a' });
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
  });

  test('should call uni.request with post', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      responded(data) {
        const { statusCode, data: subData } = data as UniNamespace.RequestSuccessCallbackResult;
        expect(statusCode).toBe(200);
        if (subData) {
          return subData;
        }
        return null;
      },
      ...AdapterUniapp()
    });

    interface ResponseData {
      url: string;
      method: string;
      data: any;
      header: Record<string, any>;
    }
    const Post = alovaInst.Post<ResponseData>(
      '/unit-test',
      { post1: 'p1', post2: 'p2' },
      {
        params: {
          a: '1',
          b: '2'
        },
        dataType: 'json',
        shareRequest: false
      }
    );

    // 验证请求数据
    const mockFn = jest.fn();
    onRequestCall(options => {
      mockFn();
      expect(options.url).toBe('http://xxx/unit-test?a=1&b=2');
      expect(options.data).toStrictEqual({
        post1: 'p1',
        post2: 'p2'
      });
      expect(options.dataType).toBe('json');
    });

    const { loading, data, onSuccess } = useRequest(Post);
    await untilCbCalled(onSuccess);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(loading.value).toBeFalsy();
    expect(data.value.url).toBe('http://xxx/unit-test?a=1&b=2');
    expect(data.value.header).toStrictEqual({});
    expect(data.value.data).toStrictEqual({
      post1: 'p1',
      post2: 'p2'
    });
  });

  test('request fail with uni.request', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      responded: {
        onSuccess(data) {
          const { data: subData } = data as UniNamespace.RequestSuccessCallbackResult;
          if (subData) {
            return subData;
          }
          return null;
        },
        onError(error) {
          expect(error.message).toBe('mock fail');
          throw error;
        }
      },
      ...AdapterUniapp()
    });

    interface ResponseData {
      url: string;
      method: string;
      data: any;
      header: Record<string, any>;
    }
    const Get = alovaInst.Get<ResponseData>('/unit-test');

    // 模拟请求失败
    onRequestCall(noop, new Error('mock fail'));

    const { loading, data, downloading, error, onError } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    const { error: errRaw } = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBe(errRaw);
    expect(error.value?.message).toBe('mock fail');
  });

  test('should cancel request when call `task.abort` returned by uni.request', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      responded(data) {
        const { data: subData } = data as UniNamespace.RequestSuccessCallbackResult;
        return subData || null;
      },
      ...AdapterUniapp()
    });

    interface ResponseData {
      url: string;
      method: string;
      data: any;
      header: Record<string, any>;
    }
    const Get = alovaInst.Get<ResponseData>('/unit-test');

    const { loading, data, downloading, error, abort, onError } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    // 过120毫秒后中断请求，因为在[src/statesHook.ts]中延迟了100毫秒请求
    delay(120).then(() => {
      abort();
    });

    await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value?.message).toBe('request:fail abort');
  });

  test('should call uni.uploadFile and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      responded(data) {
        const { statusCode, data: subData } = data as UniNamespace.UploadFileSuccessCallbackResult;
        expect(statusCode).toBe(200);
        if (subData) {
          return subData;
        }
        return null;
      },
      ...AdapterUniapp()
    });

    const Post = alovaInst.Post<string>(
      '/unit-test',
      {
        name: 'file_name',
        filePath: 'http://file_path',
        files: ['f1', 'f2'],
        file: 'file',
        f1: 'f1',
        f2: 'f2'
      },
      {
        requestType: 'upload',
        fileType: 'image'
      }
    );

    // 验证请求数据
    const mockFn = jest.fn();
    onUploadCall(options => {
      mockFn();
      expect(options.url).toBe('http://xxx/unit-test');
      expect(options.formData).toStrictEqual({
        f1: 'f1',
        f2: 'f2'
      });
      expect(options.name).toBe('file_name');
      expect(options.filePath).toBe('http://file_path');
      expect(options.files).toStrictEqual(['f1', 'f2']);
      expect(options.file).toBe('file');
      expect(options.fileType).toBe('image');
    });

    const { loading, data, uploading, downloading, error, onSuccess } = useRequest(Post);
    await untilCbCalled(onSuccess);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBe('success');
    expect(uploading.value).toEqual({ total: 200, loaded: 200 });
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
  });

  test('should cancel request when call `task.abort` returned by uni.uploadFile', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      responded(data) {
        const { statusCode, data: subData } = data as UniNamespace.UploadFileSuccessCallbackResult;
        expect(statusCode).toBe(200);
        if (subData) {
          return subData;
        }
        return null;
      },
      ...AdapterUniapp()
    });

    const Post = alovaInst.Post<string>(
      '/unit-test',
      {
        name: 'file_name',
        filePath: 'http://file_path',
        files: ['f1', 'f2'],
        file: 'file',
        f1: 'f1',
        f2: 'f2'
      },
      {
        requestType: 'upload',
        fileType: 'image'
      }
    );

    const { loading, data, uploading, error, onError, abort } = useRequest(Post);
    await untilCbCalled(setTimeout, 250);
    abort();

    await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(uploading.value).toEqual({ total: 200, loaded: 40 });
    expect(error.value?.message).toBe('uploadFile:fail abort');
  });

  test('should call uni.downloadFile and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      ...AdapterUniapp()
    });

    const Get = alovaInst.Get<UniNamespace.DownloadSuccessData>('/unit-test', {
      requestType: 'download',
      filePath: 'http://file_path'
    });

    // 验证请求数据
    const mockFn = jest.fn();
    onDownloadCall(options => {
      mockFn();
      expect(options.url).toBe('http://xxx/unit-test');
      expect(options.filePath).toBe('http://file_path');
    });

    const { loading, data, uploading, downloading, error, onSuccess } = useRequest(Get);
    await untilCbCalled(onSuccess);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(loading.value).toBeFalsy();
    expect(data.value.statusCode).toBe(200);
    expect(data.value.tempFilePath).toBe('test_path');
    expect(uploading.value).toEqual({ total: 0, loaded: 0 });
    expect(downloading.value).toEqual({ total: 200, loaded: 200 });
    expect(error.value).toBeUndefined();
  });

  test('should cancel request when call `task.abort` returned by uni.downloadFile', async () => {
    const alovaInst = createAlova({
      baseURL: 'http://xxx',
      ...AdapterUniapp()
    });

    const Get = alovaInst.Get<UniNamespace.DownloadSuccessData>('/unit-test', {
      requestType: 'download',
      filePath: 'http://file_path'
    });

    const { loading, data, downloading, error, onError, abort } = useRequest(Get);
    await untilCbCalled(setTimeout, 250);
    abort();

    await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 200, loaded: 40 });
    expect(error.value?.message).toBe('downloadFile:fail abort');
  });
});
