import useUploader from '@/hooks/uploader/useUploader';
import VueHook from '@/statesHook/vue';
import { xhrRequestAdapter } from '@alova/adapter-xhr';
import { createAlova } from 'alova';
import { Result } from 'root/testUtils';

const baseURL = process.env.NODE_BASE_URL as string;
const alovaInst = createAlova({
  baseURL,
  statesHook: VueHook,
  requestAdapter: xhrRequestAdapter(),
  responded: res => res.data.data,
  cacheLogger: false
});

URL.createObjectURL = (_: Blob) => `blob:${Date.now()}`;

// 模拟FormData上传
const mockUpload = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return alovaInst.Post<Result<true>['data']>('/unit-test-upload', formData);
};

// 模拟批量上传
const mockBatchUpload = (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  return alovaInst.Post<Result<true>['data']>('/unit-test-upload', formData);
};

// 模拟错误上传
const mockErrorUpload = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return alovaInst.Post<Result<true>['data']>('/unit-test-error', formData);
};

// vitest测试此文件
describe('vue => useUploader', () => {
  // 模拟文件对象
  const mockFile = (name: string) => {
    const file = new File(['mock file content'], name, { type: 'text/plain' });
    return file;
  };

  test('should upload single file with default mode', async () => {
    const file1 = mockFile('test1.txt');

    const { fileList, file, appendFiles, upload } = useUploader(({ file }) => mockUpload(file), {
      limit: 3,
      replaceSrc: data => {
        // I don't know why it will be converted to `[object File]` when append to `FormData`
        expect(data.data).toStrictEqual({ file: '[object File]' });
        return `https://example.com/uploads/${file1.name}`;
      }
    });

    // 添加文件
    const appendCount = await appendFiles({
      file: { file: file1 }
    });
    expect(appendCount).toBe(1);
    expect(fileList.value.length).toBe(1);
    expect(fileList.value[0].file).toBe(file1);
    expect(fileList.value[0].status).toBe(0);

    // 执行上传
    const [res] = await upload();
    expect(file.value?.status).toBe(2);
    expect(fileList.value[0].status).toBe(2);
    expect(fileList.value[0].src).toBe(`https://example.com/uploads/${file1.name}`);
    expect(file.value?.src).toBe(`https://example.com/uploads/${file1.name}`);
    expect(res.data).toStrictEqual({
      file: '[object File]'
    });
    expect(res.method).toBe('POST');
    expect(res.path).toBe('/unit-test-upload');
  });

  test('should handle each mode with separate requests', async () => {
    const file1 = mockFile('test1.txt');
    const file2 = mockFile('test2.txt');

    const uploadHandler = vi.fn(fileData => mockUpload(fileData.file));

    const { fileList, upload, appendFiles } = useUploader(uploadHandler, {
      mode: 'each',
      replaceSrc: (_, i) =>
        [`https://example.com/uploads/${file1.name}`, `https://example.com/uploads/${file2.name}`][i]
    });

    await appendFiles({ file: [{ file: file1 }, { file: file2 }] });
    await upload();

    expect(uploadHandler).toHaveBeenCalledTimes(2);
    expect(fileList.value[0].status).toBe(2);
    expect(fileList.value[1].status).toBe(2);
    expect(fileList.value[0].src).toBe(`https://example.com/uploads/${file1.name}`);
    expect(fileList.value[1].src).toBe(`https://example.com/uploads/${file2.name}`);
  });

  test('should handle batch mode with single request', async () => {
    const file1 = mockFile('test1.txt');
    const file2 = mockFile('test2.txt');

    const uploadHandler = vi.fn(files => mockBatchUpload(files.map((f: any) => f.file)));

    const { fileList, upload, appendFiles } = useUploader(uploadHandler, {
      mode: 'batch',
      replaceSrc: (data, index) =>
        [`https://example.com/uploads/${file1.name}`, `https://example.com/uploads/${file2.name}`][index]
    });

    await appendFiles({ file: [{ file: file1 }, { file: file2 }] });
    await upload();

    expect(uploadHandler).toHaveBeenCalledTimes(1);
    expect(fileList.value[0].status).toBe(2);
    expect(fileList.value[1].status).toBe(2);
    expect(fileList.value[0].src).toBe(`https://example.com/uploads/${file1.name}`);
    expect(fileList.value[1].src).toBe(`https://example.com/uploads/${file2.name}`);
  });

  test('should handle file status transitions', async () => {
    const file1 = mockFile('test1.txt');

    const { fileList, upload, appendFiles, uploading } = useUploader(({ file }) => mockUpload(file));
    await appendFiles({ file: { file: file1 } });
    fileList.value.forEach(file => expect(file.status).toBe(0)); // Not uploaded

    const uploadingMethod = upload();
    expect(uploading.value).toBeTruthy(); // Upload in progress
    fileList.value.forEach(file => expect(file.status).toBe(1));

    await uploadingMethod;
    fileList.value.forEach(file => expect(file.status).toBe(2)); // Upload completed
    expect(uploading.value).toBeFalsy(); // Upload completed

    // uploading error test
    const {
      fileList: fileList2,
      upload: upload2,
      appendFiles: appendFiles2,
      uploading: uploading2,
      error
    } = useUploader(({ file }) => mockErrorUpload(file));
    await appendFiles2({ file: { file: file1 } });
    const uploadingMethodError = upload2();
    expect(uploading2.value).toBeTruthy(); // Upload in progress
    fileList2.value.forEach(file => expect(file.status).toBe(1));

    await uploadingMethodError.catch(() => {});
    fileList2.value.forEach(file => expect(file.status).toBe(3)); // Upload failed
    expect(error.value?.message).toBe('Network Error'); // Error occurred
  });

  test('should handle appendFiles with start position', async () => {
    const file1 = mockFile('test1.txt');
    const file2 = mockFile('test2.txt');
    const file3 = mockFile('test3.txt');

    const { fileList, appendFiles } = useUploader(({ file }) => alovaInst.Post('/upload', { file }));

    const appendCount = await appendFiles({ file: [{ file: file1 }, { file: file2 }] });
    const appendCount2 = await appendFiles({ file: { file: file3 }, start: 1 });

    expect(appendCount).toBe(2);
    expect(appendCount2).toBe(1);
    expect(fileList.value.length).toBe(3);
    expect(fileList.value[0].file).toStrictEqual(file1);
    expect(fileList.value[1].file).toStrictEqual(file3);
    expect(fileList.value[2].file).toStrictEqual(file2);
  });

  // 文件上传模式测试
  test('should respect file limit', async () => {
    const file1 = mockFile('test1.txt');
    const file2 = mockFile('test2.txt');
    const file3 = mockFile('test3.txt');
    const { fileList, appendFiles } = useUploader(({ file }) => mockUpload(file), { limit: 2 });

    // 尝试添加超过限制的文件
    expect(
      appendFiles({
        file: [{ file: file1 }, { file: file2 }, { file: file3 }]
      })
    ).rejects.toThrow('The number of files exceeds the limit of 2');
    expect(fileList.value.length).toBe(0);
  });

  test('should generate local link when enabled', async () => {
    const file1 = mockFile('test1.txt');
    const { fileList, appendFiles, upload } = useUploader(({ file }) => mockUpload(file), {
      localLink: true,
      replaceSrc: () => `https://example.com/uploads/${file1.name}`
    });

    await appendFiles({ file: { file: file1 } });
    expect(fileList.value[0].src).toMatch(/^blob:/);

    await upload();
    expect(fileList.value[0].src).toBe(`https://example.com/uploads/${file1.name}`);
  });

  test('should handle File type', async () => {
    const file = mockFile('test.txt');
    const { fileList, appendFiles, upload } = useUploader(({ file }) => mockUpload(file), {
      replaceSrc: data => {
        expect(data.data).toStrictEqual({ file: '[object File]' });
        return 'https://example.com/uploads/test';
      }
    });

    await appendFiles({ file: { file } });
    expect(fileList.value[0].file).toBe(file);
    await upload();
  });

  test('should handle base64 string type', async () => {
    const base64 = 'data:text/plain;base64,SGVsbG8gd29ybGQ=';
    const { fileList, appendFiles } = useUploader(({ file }) => mockUpload(file));
    const appendCount = await appendFiles({ file: { file: base64 } });
    expect(appendCount).toBe(1);
    expect(fileList.value[0].file).toBeInstanceOf(File);
    expect(fileList.value[0].file.type).toBe('text/plain');
    expect(fileList.value[0].file.name).toBe('file');
    expect(fileList.value[0].file.text()).resolves.toBe('Hello world');

    await appendFiles({
      file: { file: base64, mimeType: 'image/png', name: 'text.png' }
    });
    expect(fileList.value[1].file).toBeInstanceOf(File);
    expect(fileList.value[1].file.type).toBe('image/png');
    expect(fileList.value[1].file.name).toBe('text.png');
    expect(fileList.value[1].file.text()).resolves.toBe('Hello world');
  });

  test('should handle Blob type', async () => {
    const blob = new Blob(['content'], { type: 'text/plain' });
    const { fileList, appendFiles } = useUploader(({ file }) => mockUpload(file));

    await appendFiles({ file: { file: blob } });
    expect(fileList.value[0].file).toBeInstanceOf(File);
    expect(fileList.value[0].file.type).toBe('text/plain');
    expect(fileList.value[0].file.text()).resolves.toBe('content');

    await appendFiles({
      file: { file: blob, mimeType: 'image/png', name: 'text.png' }
    });
    expect(fileList.value[1].file).toBeInstanceOf(File);
    expect(fileList.value[1].file.type).toBe('image/png');
    expect(fileList.value[1].file.name).toBe('text.png');
    expect(fileList.value[1].file.text()).resolves.toBe('content');
  });

  test('should handle ArrayBuffer type', async () => {
    const te = new TextEncoder().encode('content');
    const arrayBuffer = new ArrayBuffer(te.byteLength);
    new Uint8Array(arrayBuffer).set(te);
    const { fileList, appendFiles } = useUploader(({ file }) => mockUpload(file));

    await appendFiles({ file: { file: arrayBuffer } });
    expect(fileList.value[0].file).toBeInstanceOf(File);
    expect(fileList.value[0].file.type).toBe('text/plain');
    expect(fileList.value[0].file.text()).resolves.toBe('content');

    await appendFiles({
      file: { file: arrayBuffer, mimeType: 'image/png', name: 'text.png' }
    });
    expect(fileList.value[1].file).toBeInstanceOf(File);
    expect(fileList.value[1].file.type).toBe('image/png');
    expect(fileList.value[1].file.name).toBe('text.png');
    expect(fileList.value[1].file.text()).resolves.toBe('content');
  });

  test('should handle HTMLCanvasElement type', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => {
      callback(new Blob(['content'], { type: 'image/png' }));
    });
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    const { fileList, appendFiles } = useUploader(({ file }) => mockUpload(file));

    await appendFiles({ file: { file: canvas } });
    expect(fileList.value[0].file).toBeInstanceOf(File);
    expect(fileList.value[0].file.type).toBe('image/png');
    expect(fileList.value[0].file.text()).resolves.toBe('content');

    await appendFiles({
      file: { file: canvas, mimeType: 'image/jpg', name: 'text.jpg' }
    });
    expect(fileList.value[1].file).toBeInstanceOf(File);
    expect(fileList.value[1].file.type).toBe('image/jpg');
    expect(fileList.value[1].file.name).toBe('text.jpg');
    expect(fileList.value[1].file.text()).resolves.toBe('content');
  });

  test('should track upload progress', async () => {
    const file1 = mockFile('test1.txt');
    const { progress, upload, appendFiles, fileList } = useUploader(({ file }) => mockUpload(file));

    await appendFiles({ file: { file: file1 } });
    await upload();
    expect(progress.value.uploaded).toBe(17);
    expect(progress.value.total).toBe(17);
    expect(progress.value.successCount).toBe(1);
    expect(fileList.value[0].progress.uploaded).toBe(17);
    expect(fileList.value[0].progress.total).toBe(17);

    await appendFiles({ file: { file: file1 } });
    await upload();
    expect(progress.value.uploaded).toBe(34);
    expect(progress.value.total).toBe(34);
    expect(progress.value.successCount).toBe(2);
    expect(fileList.value[1].progress.uploaded).toBe(17);
    expect(fileList.value[1].progress.total).toBe(17);
  });

  test('should handle success and complete events', async () => {
    const file1 = mockFile('test1.txt');

    const { upload, appendFiles, onSuccess, onComplete } = useUploader(({ file }) => mockUpload(file));

    const successHandler = vi.fn();
    const completeHandler = vi.fn();

    onSuccess(successHandler);
    onComplete(completeHandler);

    await appendFiles({ file: { file: file1 } });
    await upload();

    expect(successHandler).toHaveBeenCalledTimes(1);
    expect(completeHandler).toHaveBeenCalledTimes(1);
  });

  test('should handle error events', async () => {
    const file1 = mockFile('test1.txt');

    const { upload, appendFiles, onError, error, onComplete } = useUploader(({ file }) => mockErrorUpload(file));

    const errorHandler = vi.fn();
    const completeHandler = vi.fn();

    onError(errorHandler);
    onComplete(completeHandler);

    await appendFiles({ file: { file: file1 } });
    await upload().catch(() => {});

    expect(errorHandler).toHaveBeenCalledTimes(1);
    expect(completeHandler).toHaveBeenCalledTimes(1);
    expect(error.value?.message).toBe('Network Error');
  });

  test('should handle file selection', async () => {
    const { fileList, appendFiles } = useUploader(({ file }) => alovaInst.Post('/upload', { file }));

    const files = [mockFile('test1.txt'), mockFile('test2.txt')];
    // 使用vi重写HTMLInputElement.prototype.addEventListener
    vi.spyOn(HTMLInputElement.prototype, 'click');
    vi.spyOn(HTMLInputElement.prototype, 'addEventListener').mockImplementation(function (
      this: HTMLInputElement,
      event,
      handler
    ) {
      Object.defineProperty(this, 'files', {
        value: files,
        writable: true
      });
      if (event === 'change') {
        expect(this.multiple).toBeTruthy();
        expect(this.accept).toBe('image/*');
        setTimeout(() => {
          (handler as any)(new Event('change', { bubbles: true, cancelable: true }));
        }, 300);
      }
    });

    // 模拟文件选择对话框
    const appendCount = await appendFiles({
      multiple: true,
      accept: 'image/*'
    });

    expect(HTMLInputElement.prototype.click).toHaveBeenCalledTimes(1);
    expect(appendCount).toBe(2);
    expect(fileList.value.length).toBe(2);
    expect(fileList.value[0].file).toBe(files[0]);
    expect(fileList.value[1].file).toBe(files[1]);

    // 恢复原型方法
    vi.spyOn(HTMLInputElement.prototype, 'click').mockRestore();
    vi.spyOn(HTMLInputElement.prototype, 'addEventListener').mockRestore();
  });
});
