import { axiosMockResponse, axiosRequestAdapter } from '@/index';
import { createAlovaMockAdapter, defineMock } from '@alova/mock';
import { createAlova, invalidateCache } from 'alova';
import { AxiosError, AxiosResponse } from 'axios';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const mocks = defineMock({
  '/unit-test': () => ({
    id: 1
  }),
  '/unit-test-error': () => ({
    status: 500,
    statusText: 'server error'
  }),
  '/unit-test-fail': () => {
    throw new Error('network error');
  },
  '[POST]/unit-test-upload': () => ({
    uploadPath: 'http://upload-xxxxx'
  }),
  '/unit-test-download': () => 'http://download-xxxxx'
});

// 模拟数据请求适配器
const mockAdapter = createAlovaMockAdapter([mocks], {
  delay: 100,
  httpAdapter: axiosRequestAdapter(),
  ...axiosMockResponse
});

const alovaInst = createAlova({
  baseURL: 'http://xxx',
  requestAdapter: mockAdapter
});

// 每个用例运行前清除缓存，避免相互影响
beforeEach(() => invalidateCache());
describe('mock response adapter', () => {
  test('request success', async () => {
    const Get = alovaInst.Get<AxiosResponse<{ id: number }>>('/unit-test');
    const result = await Get;
    expect(result.status).toBe(200);
    expect(result.statusText).toBe('ok');
    expect(result.data).toStrictEqual({ id: 1 });
    expect(!!result.config).toBeTruthy();
  });

  test('request error', async () => {
    const Get = alovaInst.Get<any>('/unit-test-error', {});
    try {
      await Get;
    } catch (error: any) {
      expect(error).toBeInstanceOf(AxiosError);
      expect(error.message).toBe('server error');
      expect(error.data).toBeUndefined();
      expect(!!error.config).toBeTruthy();
    }
  });

  test('request fail', async () => {
    const Get = alovaInst.Get<never>('/unit-test-fail', {});
    try {
      await Get;
    } catch (error: any) {
      expect(error).toBeInstanceOf(AxiosError);
      expect(error.message).toBe('network error');
    }
  });

  test('uploadFile', async () => {
    // 使用formData上传文件
    const formData = new FormData();
    formData.append('f1', 'f1');
    formData.append('f2', 'f2');
    const imageFile = new File([readFileSync(path.resolve(__dirname, '../../../../assets/img-test.jpg'))], 'file', {
      type: 'image/jpeg'
    });
    formData.append('file', imageFile);
    const Post = alovaInst.Post<AxiosResponse<{ uploadPath: string }>>('/unit-test-upload', formData, {
      withCredentials: true
    });
    const result = await Post;
    expect(result.status).toBe(200);
    expect(result.statusText).toBe('ok');
    expect(result.data).toStrictEqual({
      uploadPath: 'http://upload-xxxxx'
    });
    expect(!!result.config).toBeTruthy();
  });

  test('downloadFile', async () => {
    const Get = alovaInst.Get<AxiosResponse<string>>('/unit-test-download');
    const result = await Get;
    expect(result.status).toBe(200);
    expect(result.statusText).toBe('ok');
    expect(result.data).toBe('http://download-xxxxx');
    expect(!!result.config).toBeTruthy();
  });
});
