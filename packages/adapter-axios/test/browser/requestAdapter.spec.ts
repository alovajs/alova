import { axiosRequestAdapter } from '@/index';
import { createAlova, useRequest } from 'alova';
import VueHook from 'alova/vue';
import axios, { AxiosError } from 'axios';
import { readFileSync } from 'node:fs';
import path from 'path';
import { Result, delay, untilCbCalled } from 'root/testUtils';

const baseURL = process.env.NODE_BASE_URL as string;
describe('request adapter', () => {
  test('should call axios and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL: baseURL,
      requestAdapter: axiosRequestAdapter(),
      statesHook: VueHook,
      timeout: 100000,
      responsed(response) {
        const { status, data, config } = response;
        expect(status).toBe(200);
        expect(config.baseURL).toBe(baseURL);
        expect(config.url).toBe('/unit-test');
        expect(config.method).toBe('get');
        expect(config.timeout).toBe(100000);
        expect(config.decompress).toBeTruthy();
        expect(config.xsrfCookieName).toBe('xsrf_cookie');
        expect(config.xsrfHeaderName).toBe('xsrf_header');
        expect(config.responseEncoding).toBe('utf8');
        expect(config.params).toStrictEqual({ a: '1', b: '2' });
        expect(config.data).toBeUndefined();
        return data;
      }
    });

    const Get = alovaInst.Get<Result>('/unit-test', {
      params: {
        a: '1',
        b: '2'
      },
      responseEncoding: 'utf8',
      decompress: true,
      xsrfCookieName: 'xsrf_cookie',
      xsrfHeaderName: 'xsrf_header'
    });

    const { loading, data, downloading, error, onSuccess } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.code).toBe(200);
    expect(data.value.data.method).toBe('GET');
    expect(data.value.data.params).toStrictEqual({
      a: '1',
      b: '2'
    });
    expect(data.value.data.path).toBe('/unit-test');
    expect(downloading.value).toEqual({ total: 92, loaded: 92 });
    expect(error.value).toBeUndefined();
  });

  test('should call axios with post', async () => {
    const alovaInst = createAlova({
      baseURL: baseURL,
      requestAdapter: axiosRequestAdapter(),
      statesHook: VueHook,
      responsed({ data }) {
        return data;
      }
    });

    const Post = alovaInst.Post<string>(
      '/unit-test',
      { post1: 'p1', post2: 'p2' },
      {
        params: {
          a: '1',
          b: '2'
        },
        responseType: 'text',
        shareRequest: false
      }
    );

    const { loading, data, onSuccess } = useRequest(Post);
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();

    const dataObj = JSON.parse(data.value);
    expect(dataObj.code).toBe(200);
    expect(dataObj.data.method).toBe('POST');
    expect(dataObj.data.data).toStrictEqual({
      post1: 'p1',
      post2: 'p2'
    });
    expect(dataObj.data.path).toBe('/unit-test');
  });

  test('api not found when request', async () => {
    const alovaInst = createAlova({
      baseURL: baseURL,
      requestAdapter: axiosRequestAdapter(),
      statesHook: VueHook,
      errorLogger: false,
      responsed({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get<Result>('/unit-test-404');
    const { loading, data, downloading, error, onError } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    const { error: errRaw } = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeInstanceOf(AxiosError);
    expect(errRaw).toBeInstanceOf(AxiosError);
    expect(errRaw.response.status).toBe(404);
    expect(errRaw.response.statusText).toBe('api not found');
  });

  test('request fail with axios', async () => {
    const alovaInst = createAlova({
      baseURL: baseURL,
      requestAdapter: axiosRequestAdapter(),
      statesHook: VueHook,
      errorLogger: false,
      responsed({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get<Result>('/unit-test-error');
    const { loading, data, downloading, error, onError } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(downloading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();

    const { error: errRaw } = await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeInstanceOf(AxiosError);
    expect(errRaw).toBeInstanceOf(AxiosError);
    expect(error.value?.message).toMatch(/Network Error/);
  });

  test('should cancel request when call `controller.abort`', async () => {
    const alovaInst = createAlova({
      baseURL: baseURL,
      requestAdapter: axiosRequestAdapter(),
      statesHook: VueHook,
      errorLogger: false,
      responsed({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get<Result>('/unit-test-1s');
    const { loading, data, error, abort, onError } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    delay(10).then(abort);
    await untilCbCalled(onError);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeUndefined();
    expect(error.value?.message).toBe('canceled');
  });

  test('should upload file and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL: baseURL,
      requestAdapter: axiosRequestAdapter(),
      statesHook: VueHook,
      responsed({ data }) {
        return data;
      }
    });

    // 使用formData上传文件
    const formData = new FormData();
    formData.append('f1', 'f1');
    formData.append('f2', 'f2');
    const imageFile = new File([readFileSync(path.resolve(__dirname, '../../../../assets/img-test.jpg'))], 'file', {
      type: 'image/jpeg'
    });
    formData.append('file', imageFile);
    const Post = alovaInst.Post<Result<string>>('/unit-test', formData, {
      withCredentials: true
      // 设置上传回调后，msw无法接收请求
      // enableUpload: true
    });

    const { loading, data, uploading, error, onSuccess } = useRequest(Post);
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.code).toBe(200);
    expect(data.value.data.method).toBe('POST');
    expect(data.value.data.path).toBe('/unit-test');
    expect(uploading.value).toEqual({ total: 0, loaded: 0 });
    expect(error.value).toBeUndefined();
  });

  test('should download file and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL: baseURL,
      requestAdapter: axiosRequestAdapter(),
      statesHook: VueHook,
      responsed({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get('/unit-test-download', {
      enableDownload: true,
      responseType: 'blob'
    });

    const { loading, data, uploading, downloading, error, onSuccess } = useRequest(Get);
    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value).toBeInstanceOf(Blob);
    expect(uploading.value).toEqual({ total: 0, loaded: 0 });
    expect(downloading.value).toEqual({ total: 250569, loaded: 250569 });
    expect(error.value).toBeUndefined();
  });

  test('should request with custom axios instance', async () => {
    const newAxiosInst = axios.create({
      baseURL: baseURL,
      timeout: 5000
    });

    const axiosRequestFn = jest.fn();
    const axiosResponseFn = jest.fn();
    newAxiosInst.interceptors.request.use(config => {
      axiosRequestFn();
      return config;
    });
    newAxiosInst.interceptors.response.use(response => {
      axiosResponseFn();
      return response.data;
    });

    const alovaInst = createAlova({
      requestAdapter: axiosRequestAdapter({
        axios: newAxiosInst
      }),
      statesHook: VueHook,
      // 比axios的request钩子更早触发
      beforeRequest() {
        expect(axiosRequestFn).not.toBeCalled();
      },
      // 比axios的response钩子更迟触发
      responsed(res) {
        expect(axiosResponseFn).toBeCalled();
        return res;
      }
    });

    const Get = alovaInst.Get<Result>('/unit-test', {
      params: {
        a: '1',
        b: '2'
      },
      responseEncoding: 'utf8',
      decompress: true,
      xsrfCookieName: 'xsrf_cookie',
      xsrfHeaderName: 'xsrf_header'
    });

    const { loading, data, error, onSuccess } = useRequest(Get);
    expect(loading.value).toBeTruthy();
    expect(data.value).toBeUndefined();
    expect(error.value).toBeUndefined();

    await untilCbCalled(onSuccess);
    expect(loading.value).toBeFalsy();
    expect(data.value.code).toBe(200);
    expect(data.value.data.method).toBe('GET');
    expect(data.value.data.params).toStrictEqual({
      a: '1',
      b: '2'
    });
    expect(data.value.data.path).toBe('/unit-test');
    expect(error.value).toBeUndefined();
  });
});
