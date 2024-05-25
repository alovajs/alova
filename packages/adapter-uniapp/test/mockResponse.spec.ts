/// <reference path="../node_modules/@dcloudio/types/index.d.ts" />
import AdapterUniapp, { uniappMockResponse, uniappRequestAdapter } from '@/index';
import { createAlovaMockAdapter, defineMock } from '@alova/mock';
import { createAlova, invalidateCache } from 'alova';

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
  httpAdapter: uniappRequestAdapter,
  onMockResponse: uniappMockResponse
});

const alovaInst = createAlova({
  baseURL: 'http://xxx',
  ...AdapterUniapp({
    mockRequest: mockAdapter
  })
});
interface ResponseData {
  url: string;
  method: string;
  data: any;
  header: Record<string, any>;
}

// 每个用例运行前清除缓存，避免相互影响
beforeEach(() => invalidateCache());
describe('mock response adapter', () => {
  test('request success', async () => {
    const Get = alovaInst.Get<ResponseData>('/unit-test', {});
    const result = await Get.send();
    expect(result).toStrictEqual({ data: { id: 1 }, statusCode: 200, header: {}, cookies: [] });
  });

  test('request error', async () => {
    const Get = alovaInst.Get<ResponseData>('/unit-test-error', {});
    const result = await Get.send();
    expect(result).toStrictEqual({ data: undefined, statusCode: 500, header: {}, cookies: [] });
  });

  test('request fail', async () => {
    const Get = alovaInst.Get<ResponseData>('/unit-test-fail', {});
    try {
      await Get.send();
    } catch (error: any) {
      expect(error.message).toBe('network error');
    }
  });

  test('uploadFile', async () => {
    const Post = alovaInst.Post<ResponseData>(
      '/unit-test-upload',
      {
        name: 'abc',
        filePath: 'http://xxx'
      },
      {
        requestType: 'upload'
      }
    );
    const result = await Post.send();
    expect(result).toStrictEqual({
      data: {
        uploadPath: 'http://upload-xxxxx'
      },
      statusCode: 200
    });
  });

  test('downloadFile', async () => {
    const Get = alovaInst.Get<ResponseData>('/unit-test-download', {
      requestType: 'download'
    });
    const result = await Get.send();
    expect(result).toStrictEqual({
      tempFilePath: 'http://download-xxxxx',
      statusCode: 200
    });
  });
});
