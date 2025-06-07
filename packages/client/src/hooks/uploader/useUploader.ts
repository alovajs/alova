import { AlovaCompleteEvent, AlovaErrorEvent, AlovaEventBase, AlovaSuccessEvent } from '@/event';
import { statesHookHelper } from '@/util/helper';
import {
  PromiseCls,
  createAssert,
  createEventManager,
  falseValue,
  filterItem,
  forEach,
  includes,
  instanceOf,
  isArray,
  isNumber,
  isObject,
  isString,
  len,
  mapItem,
  newInstance,
  promiseFinally,
  pushItem,
  splice,
  trueValue,
  undefinedValue
} from '@alova/shared';
import { AlovaGenerics, Method, promiseStatesHook } from 'alova';
import {
  AlovaFileItem,
  AlovaRawFile,
  FileAppendOptions,
  FileConverter,
  Mode,
  UploadHookConfig,
  UploadingFileData
} from '~/typings/clienthook/hooks/useUploader';
import { KEY_COMPLETE, KEY_ERROR, KEY_SUCCESS } from '../core/implements/alovaEvent';

export type UploadEvents<AG extends AlovaGenerics, Args extends any[]> = {
  success: AlovaSuccessEvent<AG, Args>;
  error: AlovaErrorEvent<AG, Args>;
  complete: AlovaCompleteEvent<AG, Args>;
};

const assert: ReturnType<typeof createAssert> = createAssert('useUploader');

function useUploader<AG extends AlovaGenerics = AlovaGenerics, M extends Mode = 'each'>(
  handler: (fileData: M extends 'each' ? UploadingFileData : UploadingFileData[]) => Method<AG>,
  { limit = 0, localLink, replaceSrc, mode }: UploadHookConfig<AG, M> = {}
) {
  const { create, computed, exposeProvider, ref } = statesHookHelper<AG>(promiseStatesHook());

  const eventManager = createEventManager<UploadEvents<AG, any[]>>();

  const fileList = create([] as AlovaFileItem[], 'fileList');
  const file = computed(() => fileList.v[0] as AlovaFileItem | undefined, [fileList], 'file');
  const uploading = create(false, 'uploading');
  const successCount = create(0, 'successCount');
  const failCount = create(0, 'failCount');
  const totalProgress = computed(
    () => ({
      ...fileList.v.reduce(
        (progress, { progress: itemProgress, status }) => {
          if (status !== 0) {
            progress.total += itemProgress.total;
            progress.uploaded += itemProgress.uploaded;
          }
          return progress;
        },
        {
          uploaded: 0,
          total: 0
        }
      )
    }),
    [fileList],
    'progress'
  );
  const error = computed(() => fileList.v.find(item => item.error)?.error, [fileList], 'error');

  const appendFiles = async (
    files: AlovaRawFile | AlovaRawFile[] | FileAppendOptions = {},
    options: FileAppendOptions = {}
  ) => {
    // If no files are provided, call selectFile to get them
    let optionsFiles: AlovaRawFile | AlovaRawFile[] = files as AlovaRawFile | AlovaRawFile[];
    let finallyOptions: FileAppendOptions = options;
    if (!(files as AlovaRawFile).file && !isArray(files)) {
      finallyOptions = files as FileAppendOptions;
      optionsFiles = [];
    }

    let rawFiles: AlovaRawFile[] = isArray(optionsFiles) ? optionsFiles : [optionsFiles];
    if (len(rawFiles) <= 0) {
      rawFiles = await useUploader.selectFile(finallyOptions);
    }

    // Check file quantity limit
    assert(limit <= 0 || len(fileList.v) + len(rawFiles) <= limit, `The number of files exceeds the limit of ${limit}`);

    // File format conversion
    const { converters } = useUploader;
    const convertedFiles = await PromiseCls.all(
      mapItem(rawFiles, async file => {
        const converter = converters.find(({ is }) => is(file));

        assert(
          converter,
          `Invalid file type, only ${mapItem(converters, ({ name }) => name).join(', ')} are supported, if other file needs, customize convert function with \`useUploader.convertFile.push({ is: ..., convert: ... })\``
        );
        const convertedFile = await converter.convert(file as AlovaRawFile<any>);
        assert(convertedFile, 'Failed to convert file');

        return {
          src: file.src || (localLink ? URL.createObjectURL(convertedFile) : undefined),
          file: convertedFile,
          status: 0 as NonNullable<AlovaFileItem['status']>,
          progress: { uploaded: 0, total: convertedFile.size }
        };
      })
    );

    // Update fileList
    const insertPosition = finallyOptions.start ?? len(fileList.v);
    const validConvertedFiles = filterItem(convertedFiles, Boolean);
    const fileListValue = [...fileList.v];
    splice(fileListValue, insertPosition, 0, ...validConvertedFiles);
    fileList.v = fileListValue;
    return len(convertedFiles);
  };

  const getTargetFiles = (
    positions: Array<AlovaFileItem | number>,
    excludeStatuses: AlovaFileItem['status'][] = [1, 2],
    type: 'upload' | 'abort' = 'upload'
  ) => {
    const assertErrorWords = {
      upload: 'uploaded',
      abort: 'aborted'
    }[type];
    const fileListValue = fileList.v;
    return len(positions) > 0
      ? mapItem(positions, (item, i) => {
          const isItemNum = isNumber(item);
          const fileItem = isItemNum ? fileListValue[item] : item;
          const positionText = isItemNum ? `index ${item}` : `position ${i}`;
          assert(fileItem, `The file of ${positionText} does not exist`);
          len(excludeStatuses) > 0 &&
            assert(
              !includes(excludeStatuses, fileItem.status) && isObject(fileItem.file),
              `The file of ${positionText} cannot be ${assertErrorWords}, which status is ${fileItem.status}`
            );
          return fileItem;
        })
      : filterItem(fileListValue, f => !includes(excludeStatuses, f.status));
  };

  const filterFiles = (files: AlovaFileItem[], statuses: number[]) =>
    filterItem(files, file => (len(statuses) > 0 ? includes(statuses, file.status) : trueValue));
  const uploadingMethods = ref<Array<{ f: AlovaFileItem['file']; m: Method }>>([]);
  const pushMethod = (file: AlovaFileItem['file'], method: Method) => {
    const index = fileList.v.findIndex(fileItem => fileItem.file === file);
    if (index > -1) {
      pushItem(uploadingMethods.current, { f: file, m: method });
    }
  };
  const removeMethod = (method: Method) => {
    uploadingMethods.current = filterItem(uploadingMethods.current, ({ m }) => m !== method);
  };

  const abort = (...positions: Array<AlovaFileItem | number>) => {
    const filesToAbort = getTargetFiles(positions, [0, 2, 3], 'abort');
    const abortMethods: Method[] = [];
    if (len(filesToAbort) > 0) {
      forEach(filesToAbort, ({ file }) => {
        const uploadingItem = uploadingMethods.current.find(({ f }) => f === file);
        uploadingItem && pushItem(abortMethods, uploadingItem.m);
      });
    } else {
      pushItem(abortMethods, ...mapItem(uploadingMethods.current, ({ m }) => m));
    }

    // remove the repeat items
    const abortMethodSet: Method[] = [];
    forEach(abortMethods, m => {
      if (!abortMethodSet.includes(m)) {
        pushItem(abortMethodSet, m);
      }
    });
    forEach(abortMethodSet, method => method.abort());
  };

  const removeFiles = (...positions: Array<AlovaFileItem | number>) => {
    const filesToRemove = getTargetFiles(positions, []);
    if (len(filesToRemove) > 0) {
      // abort uploading files before removing them
      abort(...filterFiles(filesToRemove, [1]));
      fileList.v = filterItem(fileList.v, file => !includes(filesToRemove, file));
      successCount.v = len(filterFiles(fileList.v, [2]));
      failCount.v = len(filterFiles(fileList.v, [3]));
    } else {
      abort(...filterFiles(fileList.v, [1]));
      fileList.v = [];
    }
  };

  const createEvent = (method: Method<AG>, response: any, error?: any) => {
    const baseEvent = (AlovaEventBase<AG, any[]>).spawn(method, [] as unknown as any[]);
    return {
      successEvent: newInstance(AlovaSuccessEvent<AG, any[]>, baseEvent, response, falseValue),
      errorEvent: newInstance(AlovaErrorEvent<AG, any[]>, baseEvent, error),
      completeEvent: newInstance(
        AlovaCompleteEvent<AG, any[]>,
        baseEvent,
        error ? KEY_ERROR : KEY_SUCCESS,
        response,
        falseValue,
        error
      )
    };
  };

  const updateFileStatus = (
    file: AlovaFileItem,
    status: AlovaFileItem['status'],
    response?: any,
    error?: any,
    index = 0
  ) => {
    file.status = status;
    if (status === 2) {
      file.progress.uploaded = file.progress.total;
      if (replaceSrc) {
        const src = replaceSrc(response, index);
        if (src) {
          file.src = src;
        }
      }
    } else if (status === 3) {
      file.error = error;
    }
    // trigger reactivity in react
    fileList.v = [...fileList.v];
  };

  const createBatchUploadHandler = (filesToUpload: AlovaFileItem[], filesData: UploadingFileData[]) => {
    const uploadingMethod = handler(filesData as M extends 'each' ? UploadingFileData : UploadingFileData[]);
    uploadingMethod.onUpload(totalProgress => {
      forEach(filesToUpload, file => {
        file.progress.uploaded = totalProgress.loaded * (file.progress.total / totalProgress.total);
      });
    });
    forEach(filesToUpload, ({ file }) => pushMethod(file, uploadingMethod));

    return uploadingMethod
      .then(
        response => {
          forEach(filesToUpload, (file, i) => updateFileStatus(file, 2, response, undefined, i));
          successCount.v = len(filterFiles(fileList.v, [2]));
          const { successEvent, completeEvent } = createEvent(uploadingMethod, response);
          eventManager.emit(KEY_SUCCESS, successEvent);
          eventManager.emit(KEY_COMPLETE, completeEvent);
          return response;
        },
        error => {
          forEach(filesToUpload, file => updateFileStatus(file, 3, undefined, error));
          failCount.v = len(filterFiles(fileList.v, [3]));
          const { errorEvent, completeEvent } = createEvent(uploadingMethod, undefined, error);
          eventManager.emit(KEY_ERROR, errorEvent);
          eventManager.emit(KEY_COMPLETE, completeEvent);
          return error;
        }
      )
      .finally(() => {
        uploading.v = false;
        removeMethod(uploadingMethod);
      });
  };

  const createEachUploadHandler = (filesToUpload: AlovaFileItem[]) => {
    const uploadPromises = mapItem(filesToUpload, (file, i) => {
      const uploadingMethod = handler({ file: file.file, name: file.file.name } as M extends 'each'
        ? UploadingFileData
        : UploadingFileData[]);

      uploadingMethod.onUpload(({ loaded, total }) => {
        forEach(filesToUpload, file => {
          file.progress.uploaded = loaded;
          file.progress.total = total;
        });
      });

      pushMethod(file.file, uploadingMethod);
      return uploadingMethod
        .then(
          response => {
            updateFileStatus(file, 2, response, undefinedValue, i);
            successCount.v += 1;
            const { successEvent, completeEvent } = createEvent(uploadingMethod, response);
            eventManager.emit(KEY_SUCCESS, successEvent);
            eventManager.emit(KEY_COMPLETE, completeEvent);
            return response;
          },
          error => {
            updateFileStatus(file, 3, undefinedValue, error);
            failCount.v += 1;
            const { errorEvent, completeEvent } = createEvent(uploadingMethod, undefinedValue, error);
            eventManager.emit(KEY_ERROR, errorEvent);
            eventManager.emit(KEY_COMPLETE, completeEvent);
            return error;
          }
        )
        .finally(() => {
          removeMethod(uploadingMethod);
        });
    });
    return promiseFinally(PromiseCls.all(uploadPromises), () => {
      uploading.v = falseValue;
    });
  };

  const upload = async (...positions: Array<AlovaFileItem | number>) => {
    const filesToUpload = getTargetFiles(positions);
    forEach(filesToUpload, file => {
      file.status = 1;
    });

    const filesData: UploadingFileData[] = mapItem(filesToUpload, ({ file }) => ({
      file,
      name: file.name
    }));

    uploading.v = trueValue;
    return (
      mode === 'batch' ? createBatchUploadHandler(filesToUpload, filesData) : createEachUploadHandler(filesToUpload)
    ) as Promise<M extends 'batch' ? AG['Responded'] | Error : Array<AG['Responded'] | Error>>;
  };

  return exposeProvider({
    fileList,
    uploading,
    file,
    progress: totalProgress,
    successCount,
    failCount,
    error,
    appendFiles,
    removeFiles,
    upload,
    abort,
    onSuccess: (handler: (event: AlovaSuccessEvent<AG, any[]>) => void) => {
      eventManager.on(KEY_SUCCESS, handler);
    },
    onError: (handler: (event: AlovaErrorEvent<AG, any[]>) => void) => {
      eventManager.on(KEY_ERROR, handler);
    },
    onComplete: (handler: (event: AlovaCompleteEvent<AG, any[]>) => void) => {
      eventManager.on(KEY_COMPLETE, handler);
    }
  });
}

/**
 * Utility function to select files
 * @param options File selection configuration options
 * @param options.multiple Whether to allow multiple file selection
 * @returns Promise<RawFile[]> Returns a Promise containing information about the selected files
 *
 * RawFile contains the following fields:
 * - file: The original file object
 * - src: The URL of the file
 * - name: The file name
 * - mimeType: The file type
 */
useUploader.selectFile = ({ multiple, accept }: FileAppendOptions = {}) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = !!multiple;
  if (accept) {
    input.accept = accept;
  }
  input.click();
  return newInstance(Promise<AlovaRawFile[]>, resolve => {
    input.addEventListener('change', () => {
      const rawFiles: AlovaRawFile[] = mapItem(Array.from(input.files || []), file => ({
        file,
        name: file.name,
        mimeType: file.type
      }));
      resolve(rawFiles);
    });
  });
};

const defaultMimeType = 'text/plain';
useUploader.converters = <FileConverter[]>[
  {
    name: 'HTMLCanvasElement',
    is: ({ file }: AlovaRawFile) => instanceOf(file, HTMLCanvasElement),
    async convert({ file, mimeType, name }: AlovaRawFile<HTMLCanvasElement>) {
      const blob = await newInstance(PromiseCls<Blob | null>, resolve => file?.toBlob(resolve));
      if (blob) {
        return newInstance(File, [blob], name || 'image.png', {
          type: mimeType || blob.type
        });
      }
    }
  },
  {
    name: 'base64',
    is: ({ file }: AlovaRawFile) => isString(file),
    convert({ file = '', mimeType, name }: AlovaRawFile<string>) {
      assert(/data:.+;base64,/.test(file), 'Invalid base64 string');
      // Convert Base64 to File
      const arr = file.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1];
      const bstr = atob(arr[1]);
      const u8arr = new Uint8Array(len(bstr));
      forEach(Array.from(bstr), (char, n) => {
        u8arr[n] = char.charCodeAt(0);
      });
      return newInstance(File, [u8arr], name || 'file', {
        type: mimeType || mime || defaultMimeType
      });
    }
  },
  {
    name: 'File',
    is: ({ file }: AlovaRawFile) => instanceOf(file, File),
    convert({ file }: AlovaRawFile<File>) {
      return file!;
    }
  },
  {
    name: 'Blob',
    is: ({ file }: AlovaRawFile) => instanceOf(file, Blob),
    convert({ file, name, mimeType }: AlovaRawFile<Blob>) {
      return newInstance(File, [file!], name || 'file', {
        type: mimeType || file!.type || defaultMimeType
      });
    }
  },
  {
    name: 'ArrayBuffer',
    is: ({ file }: AlovaRawFile) => instanceOf(file, ArrayBuffer),
    convert({ file, name, mimeType }: AlovaRawFile<ArrayBuffer>) {
      return newInstance(File, [newInstance(Blob, [file!])], name || 'file', {
        type: mimeType || defaultMimeType
      });
    }
  }
];

export default useUploader;
