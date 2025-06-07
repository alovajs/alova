import useUploader from '@/hooks/uploader/useUploader';
import SolidHook from '@/statesHook/solid';
import { xhrRequestAdapter } from '@alova/adapter-xhr';
import { createAlova } from 'alova';
import { Result } from 'root/testUtils';

const baseURL = process.env.NODE_BASE_URL as string;
const alovaInst = createAlova({
  baseURL,
  statesHook: SolidHook,
  requestAdapter: xhrRequestAdapter(),
  responded: res => res.data.data,
  cacheLogger: false
});

URL.createObjectURL = (_: Blob) => `blob:${Date.now()}`;

// 模拟FormData上传
const mockUpload = (file: File, delay?: number) => {
  const formData = new FormData();
  formData.append('file', file);
  return alovaInst.Post<Result<true>['data']>('/unit-test-upload', formData, {
    headers: {
      delay
    }
  });
};

// vitest测试此文件
describe('solid => useUploader', () => {
  // 模拟文件对象
  const mockFile = (name: string) => {
    const file = new File(['mock file content'], name, { type: 'text/plain' });
    return file;
  };

  test('should upload single file with default mode', async () => {
    const file1 = mockFile('test1.txt');

    const { fileList, file, appendFiles, upload, progress } = useUploader(({ file }) => mockUpload(file), {
      limit: 3,
      replaceSrc: data => {
        // I don't know why it will be converted to `[object File]` when append to `FormData`
        expect(data.data).toStrictEqual({ file: '[object File]' });
        return `https://example.com/uploads/${file1.name}`;
      }
    });

    // 添加文件
    const appendCount = await appendFiles({ file: file1 });
    expect(appendCount).toBe(1);
    expect(fileList().length).toBe(1);
    expect(fileList()[0].file).toBe(file1);
    expect(fileList()[0].status).toBe(0);

    // 执行上传
    const [res] = await upload();
    expect(file()?.status).toBe(2);
    expect(fileList()[0].status).toBe(2);
    expect(fileList()[0].src).toBe(`https://example.com/uploads/${file1.name}`);
    expect(fileList()[0].progress).toStrictEqual({ uploaded: 17, total: 17 });
    expect(file()?.src).toBe(`https://example.com/uploads/${file1.name}`);
    expect(progress()).toStrictEqual({ uploaded: 17, total: 17 });

    expect((res as Result<true>['data']).data).toStrictEqual({
      file: '[object File]'
    });
    expect((res as Result<true>['data']).method).toBe('POST');
    expect((res as Result<true>['data']).path).toBe('/unit-test-upload');
  });
});
