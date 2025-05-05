import { AlovaEventBase } from '@/event';
import { statesHookHelper } from '@/util/helper';
import { createAssert, createEventManager, isArray, len, mapItem, newInstance, undefinedValue } from '@alova/shared';
import { AlovaGenerics, Method, promiseStatesHook } from 'alova';
import { FileItem, RawFile, UploadHookConfig, UploadingFileData } from '~/typings/clienthook/hooks/useUploader';
import {
  AlovaFileCompleteEvent,
  AlovaFileErrorEvent,
  AlovaFileEvent,
  AlovaFileExceededEvent,
  AlovaFileMismatchEvent,
  AlovaFileSuccessEvent
} from './event';

export type UploadEvents<AG extends AlovaGenerics, Args extends any[]> = {
  filesAppend: AlovaFileEvent;
  exceed: AlovaFileExceededEvent;
  formatMismatch: AlovaFileMismatchEvent;
  success: AlovaFileSuccessEvent<AG, Args>;
  error: AlovaFileErrorEvent<AG, Args>;
  complete: AlovaFileCompleteEvent<AG, Args>;
};

const assert = createAssert('useUploader');

export default <AG extends AlovaGenerics = AlovaGenerics, Args extends any[] = any[]>(
  handler: (fileData: UploadingFileData) => Method<AG>,
  { limit, accept, replaceSrcFromResponse, mode }: UploadHookConfig<AG> = {}
) => {
  const { create, ref, computed, objectify, exposeProvider } = statesHookHelper<AG>(promiseStatesHook());

  const error = create<Error | undefined>(undefinedValue, 'error');

  const eventManager = createEventManager<UploadEvents<AG, Args>>();
  const createUploadEvent = (progressValue: number, files: FileItem[], rawFiles: RawFile[], allRawFiles: RawFile[]) =>
    new AlovaUploadEvent<AG, Args>(
      AlovaEventBase.spawn<AG, Args>(methodInstance, usingArgs.current),
      progressValue,
      files,
      rawFiles,
      allRawFiles
    );

  const createUploadErrorEvent = (errorValue: Error, files: FileItem[], rawFiles: RawFile[], allRawFiles: RawFile[]) =>
    new AlovaUploadErrorEvent<AG, Args>(
      AlovaEventBase.spawn<AG, Args>(methodInstance, usingArgs.current),
      errorValue,
      files,
      rawFiles,
      allRawFiles
    );

  const fileList = create([] as FileItem[], 'fileList');
  const file = computed(() => fileList.v[0], [fileList], 'file');
  const loading = create(false, 'loading');
  const totalProgress = create(
    {
      loaded: 0,
      total: 0,
      count: 0,
      successCount: 0,
      failCount: 0
    },
    'progress'
  );

  const appendFiles = (files?: RawFile | RawFile[], start?: number) => {
    const rawFiles = isArray(files) ? files : [files];

    // 文件格式转换
    const convertedFiles = mapItem(rawFiles, file => {
      // 添加文件数量限制检查
      if (limit && len(fileList.v) + len(rawFiles) > limit) {
        const exceedFiles = rawFiles.slice(limit - len(fileList.v));
        eventManager.emit('exceed', newInstance(AlovaFileExceededEvent));
        validFiles = validFiles.slice(0, limit - len(fileList.v));
      }

      // 完善Canvas转换逻辑
      if (file?.file instanceof HTMLCanvasElement) {
        const promise = new Promise<File>(resolve => {
          file.file.toBlob(blob => {
            if (blob) resolve(new File([blob], 'canvas_image.png'));
          });
        });
        await promise.then(f => (convertedFile = f));
      }

      // 完善文件转换逻辑
      let convertedFile: File;
      if (typeof file.file === 'string') {
        // Base64转File
        const arr = file.file.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        convertedFile = new File([u8arr], 'file', { type: mime || 'application/octet-stream' });
      } else if (file.file instanceof Blob) {
        convertedFile = new File([file.file], 'file', { type: file.file.type });
      } else if (file.file instanceof ArrayBuffer) {
        convertedFile = new File([new Blob([file.file])], 'file');
      } else if (file.file instanceof HTMLCanvasElement) {
        file.file.toBlob(blob => {
          if (blob) convertedFile = new File([blob], 'file');
        });
      } else {
        convertedFile = file.file;
      }

      // 添加格式验证逻辑
      const isValidType =
        config.fileTypes?.some(
          type => convertedFile.type === type || new RegExp(type.replace('*', '.*')).test(convertedFile.type)
        ) ?? true;

      if (!isValidType) {
        eventManager.emit('formatMismatch', {
          file: convertedFile,
          rawFile: file,
          typeError: new Error('Unsupported file type')
        });
        return null;
      }
      return {
        src: file.src,
        file: convertedFile,
        status: file.status || 0,
        progress: { loaded: 0, total: convertedFile.size }
      };
    });

    // 更新fileList
    const insertPos = start ?? fileList.v.length;
    fileList.v.splice(insertPos, 0, ...convertedFiles);

    // 触发事件
    eventManager.emit('filesAppend', {
      files: convertedFiles,
      rawFiles: validFiles,
      allRawFiles: rawFiles
    });

    return convertedFiles.length;
  };

  const upload = (...indexes: number[]) => {
    loading.v = true;
    const filesToUpload =
      indexes.length > 0 ? indexes.map(i => fileList.v[i]) : fileList.v.filter(f => f.status === 0 || f.status === 3);

    // 并行上传
    const uploadPromises = filesToUpload.map(file => {
      file.status = 1;
      return handler({ file: file.file, name: file.name, files: fileList.v.map(f => f.file) })
        .then(response => {
          file.status = 2;
          totalProgress.v.successCount += 1;
          eventManager.emit('success', { file, response });
        })
        .catch(error => {
          file.status = 3;
          file.error = error;
          totalProgress.v.failCount += 1;
          eventManager.emit('error', { file, error });
        })
        .finally(() => {
          totalProgress.v.count -= 1;
          eventManager.emit('complete', { file });
          if (totalProgress.v.count === 0) {
            loading.v = false;
          }
        });
    });
    totalProgress.v.count = uploadPromises.length;
    return Promise.all(uploadPromises);
  };

  return exposeProvider({
    progress: totalProgress,
    error,
    fileList,
    loading,
    file,
    appendFiles,
    upload,
    onFilesAppend: (handler: (event: AlovaFileEvent) => void) => eventManager.on('filesAppend', handler),
    onExceed: (handler: (event: AlovaFileExceededEvent) => void) => eventManager.on('exceed', handler),
    onFormatMismatch: (handler: (event: AlovaFileMismatchEvent) => void) => eventManager.on('formatMismatch', handler),
    onSuccess: (handler: (event: AlovaFileSuccessEvent<AG, Args>) => void) => eventManager.on('success', handler),
    onError: (handler: (event: AlovaFileErrorEvent<AG, Args>) => void) => eventManager.on('error', handler),
    onComplete: (handler: (event: AlovaFileCompleteEvent<AG, Args>) => void) => eventManager.on('complete', handler)
  });
};
