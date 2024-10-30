import { axiosRequestAdapter } from '@/index';
import { createAlova } from 'alova';
import axios, { AxiosError } from 'axios';
import { readFileSync } from 'node:fs';
import path from 'path';
import { Result, delay } from 'root/testUtils';

const baseURL = process.env.NODE_BASE_URL as string;
describe('request adapter', () => {
  test('should call axios and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: axiosRequestAdapter(),
      timeout: 100000,
      responded(response) {
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

    const data = await Get;
    expect(data.data).toStrictEqual({
      path: '/unit-test',
      method: 'GET',
      params: {
        a: '1',
        b: '2'
      }
    });
    expect(data.data.method).toBe('GET');
    expect(data.data.params).toStrictEqual({
      a: '1',
      b: '2'
    });
  });

  test('should call axios with post', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: axiosRequestAdapter(),
      responded: {
        onSuccess({ data }) {
          return data;
        }
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

    const data = await Post;
    const dataObj = JSON.parse(data);
    expect(dataObj.data).toStrictEqual({
      path: '/unit-test',
      method: 'POST',
      params: {
        a: '1',
        b: '2'
      },
      data: {
        post1: 'p1',
        post2: 'p2'
      }
    });
  });

  test('api not found when request', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: axiosRequestAdapter(),
      responded({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get<Result>('/unit-test-404');
    try {
      await Get;
    } catch (errRaw: any) {
      expect(errRaw).toBeInstanceOf(AxiosError);
      expect(errRaw.response.status).toBe(404);
      expect(errRaw.response.statusText).toBe('api not found');
    }
  });

  test('request fail with axios', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: axiosRequestAdapter(),
      responded({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get<Result>('/unit-test-error');
    try {
      await Get;
    } catch (errRaw: any) {
      expect(errRaw).toBeInstanceOf(AxiosError);
      expect(errRaw.message).toMatch(/Network Error/);
    }
  });

  test('should cancel request when call `controller.abort`', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: axiosRequestAdapter(),
      responded({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get<Result>('/unit-test-1s');
    delay(10).then(Get.abort);
    await expect(Get).rejects.toThrow('canceled');
  });

  test('should upload file and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: axiosRequestAdapter(),
      responded({ data }) {
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

    const data = await Post;
    expect(data.code).toBe(200);
  });

  test('should download file and pass the right args', async () => {
    const alovaInst = createAlova({
      baseURL,
      requestAdapter: axiosRequestAdapter(),
      responded({ data }) {
        return data;
      }
    });

    const Get = alovaInst.Get('/unit-test-download', {
      responseType: 'blob'
    });

    let downloading = {};
    Get.onDownload(progress => {
      downloading = progress;
    });

    const data = await Get;
    expect(data).toBeInstanceOf(Blob);
    expect(downloading).toEqual({ total: 250569, loaded: 250569 });
  });

  test('should request with custom axios instance', async () => {
    const newAxiosInst = axios.create({
      baseURL,
      timeout: 5000
    });

    const axiosRequestFn = vi.fn();
    const axiosResponseFn = vi.fn();
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
      // 比axios的request钩子更早触发
      beforeRequest() {
        expect(axiosRequestFn).not.toHaveBeenCalled();
      },
      // 比axios的response钩子更迟触发
      responded(res) {
        expect(axiosResponseFn).toHaveBeenCalled();
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

    const data = await Get;
    expect(data.code).toBe(200);
    expect(data.data.method).toBe('GET');
    expect(data.data.params).toStrictEqual({
      a: '1',
      b: '2'
    });
    expect(data.data.path).toBe('/unit-test');
  });
});
