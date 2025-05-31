import useUploader from '@/hooks/uploader/useUploader';
import ReactHook from '@/statesHook/react';
import { xhrRequestAdapter } from '@alova/adapter-xhr';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createAlova } from 'alova';
import { useState } from 'react';
import { Result } from 'root/testUtils';

const baseURL = process.env.NODE_BASE_URL as string;
const alovaInst = createAlova({
  baseURL,
  requestAdapter: xhrRequestAdapter(),
  statesHook: ReactHook,
  responded: res => res.data.data,
  cacheLogger: false
});

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

// 模拟文件对象
const mockFile = (name: string) => new File(['mock file content'], name, { type: 'text/plain' });

describe('react => useUploader', () => {
  test('should upload single file with default mode', async () => {
    const file1 = mockFile('test1.txt');

    const TestComponent = () => {
      const { fileList, file, appendFiles, upload } = useUploader(({ file }) => mockUpload(file), {
        limit: 3,
        replaceSrc: data => {
          // I don't know why it will be converted to `[object File]` when append to `FormData`
          expect(data.data).toStrictEqual({ file: '[object File]' });
          return `https://example.com/uploads/${file1.name}`;
        }
      });
      const [appendCount, setAppendCount] = useState<number | null>(null);
      const [uploadResult, setUploadResult] = useState<any>(null);

      const handleTest = async () => {
        const count = await appendFiles({ file: file1 });
        setAppendCount(count);

        const [res] = await upload();
        setUploadResult(res);
      };

      return (
        <div>
          <button
            onClick={handleTest}
            data-testid="test-button">
            Test
          </button>
          <div data-testid="file-count">{fileList.length}</div>
          <div data-testid="append-count">{appendCount}</div>
          <div data-testid="first-file-status">{file?.status}</div>
          <div data-testid="first-file-src">{file?.src}</div>
          <div data-testid="file-status">{fileList[0]?.status}</div>
          <div data-testid="file-src">{fileList[0]?.src}</div>
          <div data-testid="upload-result">{JSON.stringify(uploadResult?.data)}</div>
          <div data-testid="upload-method">{uploadResult?.method}</div>
          <div data-testid="upload-path">{uploadResult?.path}</div>
        </div>
      );
    };

    render(<TestComponent />);
    const testButton = screen.getByTestId('test-button');
    testButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('file-count')).toHaveTextContent('1');
      expect(screen.getByTestId('append-count')).toHaveTextContent('1');
      expect(screen.getByTestId('first-file-status')).toHaveTextContent('2');
      expect(screen.getByTestId('first-file-src')).toHaveTextContent(`https://example.com/uploads/${file1.name}`);
      expect(screen.getByTestId('file-status')).toHaveTextContent('2');
      expect(screen.getByTestId('file-src')).toHaveTextContent(`https://example.com/uploads/${file1.name}`);
      expect(screen.getByTestId('upload-result')).toHaveTextContent('{"file":"[object File]"}');
      expect(screen.getByTestId('upload-method')).toHaveTextContent('POST');
      expect(screen.getByTestId('upload-path')).toHaveTextContent('/unit-test-upload');
    });
  });

  test('should handle each mode with separate requests', async () => {
    const file1 = mockFile('test1.txt');
    const file2 = mockFile('test2.txt');

    const uploadHandler = vi.fn(fileData => mockUpload(fileData.file));

    const TestComponent = () => {
      const { fileList, appendFiles, upload, uploading, successCount, failCount } = useUploader(uploadHandler, {
        mode: 'each',
        replaceSrc: (_, i) =>
          [`https://example.com/uploads/${file1.name}`, `https://example.com/uploads/${file2.name}`][i]
      });

      const handleTest = async () => {
        await appendFiles([{ file: file1 }, { file: file2 }]);
      };

      return (
        <div>
          <button
            onClick={handleTest}
            data-testid="test-button">
            Test
          </button>
          <button
            onClick={() => upload()}
            data-testid="test-button2">
            Test2
          </button>
          <div data-testid="file-count">{fileList.length}</div>
          <div data-testid="success-count">{successCount}</div>
          <div data-testid="fail-count">{failCount}</div>
          <div data-testid="file1-status">{fileList[0]?.status}</div>
          <div data-testid="file2-status">{fileList[1]?.status}</div>
          <div data-testid="file1-src">{fileList[0]?.src}</div>
          <div data-testid="file2-src">{fileList[1]?.src}</div>
          <div data-testid="upload-complete">{uploading ? 'true' : 'false'}</div>
        </div>
      );
    };

    render(<TestComponent />);
    fireEvent.click(screen.getByTestId('test-button'));
    await waitFor(() => {
      expect(screen.getByTestId('upload-complete')).toHaveTextContent('false');
      expect(uploadHandler).not.toHaveBeenCalled();
      expect(screen.getByTestId('file-count')).toHaveTextContent('2');
      expect(screen.getByTestId('success-count')).toHaveTextContent('0');
      expect(screen.getByTestId('fail-count')).toHaveTextContent('0');
      expect(screen.getByTestId('file1-status')).toHaveTextContent('0');
      expect(screen.getByTestId('file2-status')).toHaveTextContent('0');
      expect(screen.getByTestId('file1-src')).toBeEmptyDOMElement();
      expect(screen.getByTestId('file2-src')).toBeEmptyDOMElement();
    });

    fireEvent.click(screen.getByTestId('test-button2'));
    await waitFor(() => {
      expect(screen.getByTestId('upload-complete')).toHaveTextContent('false');
      expect(uploadHandler).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('file-count')).toHaveTextContent('2');
      expect(screen.getByTestId('success-count')).toHaveTextContent('2');
      expect(screen.getByTestId('fail-count')).toHaveTextContent('0');
      expect(screen.getByTestId('file1-status')).toHaveTextContent('2');
      expect(screen.getByTestId('file2-status')).toHaveTextContent('2');
      expect(screen.getByTestId('file1-src')).toHaveTextContent(`https://example.com/uploads/${file1.name}`);
      expect(screen.getByTestId('file2-src')).toHaveTextContent(`https://example.com/uploads/${file2.name}`);
    });
  });

  test('should handle batch mode with single request', async () => {
    const file1 = mockFile('test1.txt');
    const file2 = mockFile('test2.txt');

    const uploadHandler = vi.fn(files => mockBatchUpload(files.map((f: any) => f.file)));

    const TestComponent = () => {
      const { fileList, appendFiles, upload, uploading } = useUploader(uploadHandler, {
        mode: 'batch',
        replaceSrc: (data, index) =>
          [`https://example.com/uploads/${file1.name}`, `https://example.com/uploads/${file2.name}`][index]
      });

      const handleTest = async () => {
        await appendFiles([{ file: file1 }, { file: file2 }]);
        await upload();
      };

      return (
        <div>
          <button
            onClick={handleTest}
            data-testid="test-button">
            Test
          </button>
          <div data-testid="file-count">{fileList.length}</div>
          <div data-testid="file1-status">{fileList[0]?.status}</div>
          <div data-testid="file2-status">{fileList[1]?.status}</div>
          <div data-testid="file1-src">{fileList[0]?.src}</div>
          <div data-testid="file2-src">{fileList[1]?.src}</div>
          <div data-testid="upload-complete">{uploading ? 'true' : 'false'}</div>
        </div>
      );
    };

    render(<TestComponent />);
    fireEvent.click(screen.getByTestId('test-button'));

    await waitFor(() => {
      expect(screen.getByTestId('upload-complete')).toHaveTextContent('false');
      expect(uploadHandler).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('file-count')).toHaveTextContent('2');
      expect(screen.getByTestId('file1-status')).toHaveTextContent('2');
      expect(screen.getByTestId('file2-status')).toHaveTextContent('2');
      expect(screen.getByTestId('file1-src')).toHaveTextContent(`https://example.com/uploads/${file1.name}`);
      expect(screen.getByTestId('file2-src')).toHaveTextContent(`https://example.com/uploads/${file2.name}`);
    });
  });

  test('should handle file status transitions', async () => {
    const file1 = mockFile('test1.txt');

    const TestComponent = () => {
      const { fileList, appendFiles, upload } = useUploader(({ file }) => mockUpload(file), {
        replaceSrc: (_, i) => `https://example.com/uploads/test${i + 1}.txt`
      });

      const handleTest = async () => {
        await appendFiles({ file: file1 });
      };

      return (
        <div>
          <button
            onClick={handleTest}
            data-testid="test-button">
            Test
          </button>
          <button
            onClick={() => upload()}
            data-testid="test-button2">
            Test2
          </button>
          <div data-testid="status">{JSON.stringify(fileList.map(file => file.status))}</div>
          <div data-testid="src">{JSON.stringify(fileList.map(file => file.src))}</div>
          <div data-testid="progress">{JSON.stringify(fileList.map(file => file.progress))}</div>
        </div>
      );
    };

    render(<TestComponent />);
    fireEvent.click(screen.getByTestId('test-button'));
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent(JSON.stringify([0]));
      expect(screen.getByTestId('src')).toHaveTextContent(JSON.stringify([null]));
      expect(screen.getByTestId('progress')).toHaveTextContent(JSON.stringify([{ uploaded: 0, total: 17 }]));
    });

    fireEvent.click(screen.getByTestId('test-button2'));
    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent(JSON.stringify([2]));
      expect(screen.getByTestId('src')).toHaveTextContent(JSON.stringify(['https://example.com/uploads/test1.txt']));
      expect(screen.getByTestId('progress')).toHaveTextContent(JSON.stringify([{ uploaded: 17, total: 17 }]));
    });
  });

  test('should remove specific files', async () => {
    const file1 = mockFile('test1.txt');
    const file2 = mockFile('test2.txt');
    const file3 = mockFile('test3.txt');
    const file4 = mockFile('test4.txt');
    let uploadSuccessIndex = -1;

    const TestComponent = () => {
      const { successCount, failCount, upload, appendFiles, removeFiles, fileList } = useUploader(({ file }) => {
        uploadSuccessIndex += 1;
        return uploadSuccessIndex === 0 ? mockUpload(file) : mockErrorUpload(file);
      });

      const handleTest = async () => {
        await appendFiles([
          {
            file: file1
          },
          {
            file: file2
          },
          {
            file: file3
          },
          {
            file: file4
          }
        ]);
      };

      return (
        <div>
          <button
            onClick={handleTest}
            data-testid="test-button">
            Test
          </button>
          <button
            onClick={() => upload()}
            data-testid="upload-button">
            Test2
          </button>
          <button
            onClick={() => removeFiles(1)}
            data-testid="remove-button">
            Test3
          </button>
          <button
            onClick={() => removeFiles()}
            data-testid="remove-all-button">
            Test3
          </button>
          <div data-testid="file-count">{fileList.length}</div>
          <div data-testid="success-count">{successCount}</div>
          <div data-testid="fail-count">{failCount}</div>
          <div data-testid="file1-status">{fileList[0]?.status}</div>
          <div data-testid="file2-status">{fileList[1]?.status}</div>
          <div data-testid="file3-status">{fileList[2]?.status}</div>
          <div data-testid="file4-status">{fileList[3]?.status}</div>
        </div>
      );
    };

    render(<TestComponent />);
    fireEvent.click(screen.getByTestId('test-button'));
    await waitFor(() => {
      expect(screen.getByTestId('file-count')).toHaveTextContent('4');
      expect(screen.getByTestId('success-count')).toHaveTextContent('0');
      expect(screen.getByTestId('fail-count')).toHaveTextContent('0');
      expect(screen.getByTestId('file1-status')).toHaveTextContent('0');
      expect(screen.getByTestId('file2-status')).toHaveTextContent('0');
      expect(screen.getByTestId('file3-status')).toHaveTextContent('0');
      expect(screen.getByTestId('file4-status')).toHaveTextContent('0');
    });

    fireEvent.click(screen.getByTestId('upload-button'));
    await waitFor(() => {
      expect(screen.getByTestId('file-count')).toHaveTextContent('4');
      expect(screen.getByTestId('success-count')).toHaveTextContent('1');
      expect(screen.getByTestId('fail-count')).toHaveTextContent('3');
    });

    fireEvent.click(screen.getByTestId('remove-button'));
    await waitFor(() => {
      expect(screen.getByTestId('file-count')).toHaveTextContent('3');
      expect(screen.getByTestId('success-count')).toHaveTextContent('1');
      expect(screen.getByTestId('fail-count')).toHaveTextContent('2');
      expect(screen.getByTestId('file1-status')).toHaveTextContent('2');
      expect(screen.getByTestId('file2-status')).toHaveTextContent('3');
      expect(screen.getByTestId('file3-status')).toHaveTextContent('3');
    });

    fireEvent.click(screen.getByTestId('remove-all-button'));
    await waitFor(() => {
      expect(screen.getByTestId('file-count')).toHaveTextContent('0');
      expect(screen.getByTestId('success-count')).toHaveTextContent('0');
      expect(screen.getByTestId('fail-count')).toHaveTextContent('0');
    });
  });
});
