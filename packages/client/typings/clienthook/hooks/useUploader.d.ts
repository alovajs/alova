import { AlovaGenerics, Method } from 'alova';
import { CompleteHandler, ErrorHandler, ExportedComputed, ExportedState, SuccessHandler } from '../general';

export type Mode = 'each' | 'batch';
export interface UploadHookConfig<AG extends AlovaGenerics, M extends Mode> {
  /**
   * Limit the number of upload files
   */
  limit?: number;
  /**
   * Whether to generate temporary image links for preview before upload completed.
   * @default false
   */
  localLink?: boolean;
  /**
   * Set a function to replace src field in fileList items with server file URL when upload succeeds
   * @param data - Response data
   * @param index - File index in fileList
   * @returns Server file URL
   */
  replaceSrc?: (data: AG['Responded'], index: number) => string;
  /**
   * Upload mode
   * @remarks
   * - 'each': Upload each file separately
   * - 'batch': Upload all files in one request
   * @default 'each'
   */
  mode?: M;
}

/**
 * Represents a file item in the upload process.
 */
interface AlovaFileItem {
  /**
   * Temporary path or the file path after successful upload. it is useful for previewing images.
   */
  src?: string;
  /**
   * The File object.
   */
  file: File;
  /**
   * The status of the file upload.
   * - 0: Not uploaded yet.
   * - 1: Uploading.
   * - 2: Upload completed.
   * - 3: Upload error.
   */
  status: 0 | 1 | 2 | 3;
  /**
   * The error object. It should be assigned when an upload error occurs.
   */
  error?: Error;
  /**
   * Information about the upload progress.
   */
  progress: {
    /**
     * The size that has been uploaded.
     */
    uploaded: number;
    /**
     * The total size of the file.
     */
    total: number;
  };
}

/**
 * Represents the progress information during the file upload process.
 */
interface Progress {
  /**
   * The total size that has been uploaded, which is the sum of multiple files.
   */
  uploaded: number;
  /**
   * The total size of all files to be uploaded, which is the sum of multiple files.
   */
  total: number;
}

export interface AlovaUploaderFileType {
  file: File;
  base64: string;
  blob: Blob;
  arrayBuffer: ArrayBuffer;
  canvas: HTMLCanvasElement;
}

export interface AlovaRawFile<F = AlovaUploaderFileType[keyof AlovaUploaderFileType]> {
  /**
   * A file object, base64 string, Blob object, ArrayBuffer, or HTMLCanvasElement.
   * It can be omitted when displaying the uploaded file.
   */
  file: F;
  /**
   * The preview URL of the file. If provided, it will not be overwritten even if `localLink` is set to `true`.
   */
  src?: string;
  /**
   * The name of the file. It is required when `file` is not a File object and is used when creating a new File object.
   */
  name?: string;
  /**
   * The MIME type of the file when converting it to a File object.
   * It is recommended to provide this when `file` is not a File object.
   */
  mimeType?: string;
}

interface FileAppendOptions {
  /**
   * The position in the fileList to start appending.
   */
  start?: number;

  /**
   * whether to allow multiple file selection.
   * it will effect in select file dialog
   * @default false;
   */
  multiple?: boolean;

  /**
   * The types of uploading files.
   * it will effect in select file dialog
   * @see https://developer.mozilla.org/docs/Web/HTML/Reference/Elements/input/file#accept
   */
  accept?: string;
}

export interface UploadExposure<AG extends AlovaGenerics, Args extends any[] = any[], M extends Mode = 'each'> {
  /**
   * File data list. Each item contains the file name, file path, upload status, and upload progress.
   * For the specific format, @see {AlovaFileItem}
   */
  fileList: ExportedState<AlovaFileItem[], AG['StatesExport']>;
  /**
   * The first file data item. It can be implemented using a computed property and is generally used for uploading a single file.
   */
  file: ExportedComputed<AlovaFileItem | undefined, AG['StatesExport']>;
  /**
   * Indicates whether the upload is in progress.
   */
  uploading: ExportedState<boolean, AG['StatesExport']>;
  /**
   * The overall upload progress.
   */
  progress: ExportedComputed<Progress, AG['StatesExport']>;
  /**
   * error message
   */
  error: ExportedComputed<Error | undefined, AG['StatesExport']>;
  /**
   * The number of files that have been successfully uploaded.
   */
  successCount: number;
  /**
   * The number of files that failed to upload.
   */
  failCount: number;

  /**
   * Appends files to the upload list. After appending, the 'file' items in the list will be automatically converted to File objects.
   * At this time, the 'name' property must have a value.
   *
   * @param files - an object for single file, or an array for multiple files, if files are not need, it can be passed options params.
   * @param options - file append options.
   * @returns The number of successfully appended files. Append may fail due to quantity or format restrictions.
   */
  appendFiles(file?: AlovaRawFile | AlovaRawFile[], options?: FileAppendOptions): Promise<number>;
  appendFiles(options?: FileAppendOptions): Promise<number>;
  /**
   * Removes files from the upload list. if no parameters are given, it will remove all files.
   * @param positions - The file items or indexes in `fileList`.
   * @returns The number of successfully removed files.
   */
  removeFiles: (...positions: Array<AlovaFileItem | number>) => number;
  /**
   * Executes the upload action.
   * - If no parameters are passed, it will automatically re-initiate upload requests for all items in the fileList, whose 'file' property has a value and whose 'status' is 0 (not uploaded) or 3 (upload failed).
   * - If parameter positions are passed, it will upload the specific items in fileList, filter out the uploadable items according to the above conditions, and initiate upload requests. In this case, if there are items that do not meet the conditions, an error should be thrown instead of being ignored.
   *
   * After initiating the upload action:
   * Multiple files will be uploaded in parallel. That is, the array of files that meet the upload conditions will be traversed,
   * and the first callback function of useUploader will be called in sequence to obtain the Method instance and send requests.
   * @param positions - The file items or indexes in `fileList`.
   * @returns upload response
   */
  upload: (
    ...positions: Array<AlovaFileItem | number>
  ) => Promise<M extends 'batch' ? AG['Responded'] | Error : Array<AG['Responded'] | Error>>;
  /**
   * abort the upload operation.
   * @param indexes - The indexes of the upload request to abort. If no indexes are provided, all ongoing uploads will be aborted.
   */
  abort: (...positions: Array<AlovaFileItem | number>) => void;
  /**
   * Event handler for when each file is uploaded successfully.
   * @param handler - The callback function to handle the AlovaFileSuccessEvent.
   */
  onSuccess(handler: SuccessHandler<AG, Args>): UploadExposure<AG, Args, M>;
  /**
   * Event handler for when each file fails to upload.
   * @param handler - The callback function to handle the AlovaFileErrorEvent.
   */
  onError(handler: ErrorHandler<AG, Args>): UploadExposure<AG, Args, M>;
  /**
   * Event handler for when each file upload is completed.
   * @param handler - The callback function to handle the AlovaCompleteEvent.
   */
  onComplete(handler: CompleteHandler<AG, Args>): UploadExposure<AG, Args, M>;
}

interface UploadingFileData {
  /**
   * single file object
   */
  file: File;
  /**
   * file name
   */
  name: string;
}
export declare function useUploader<AG extends AlovaGenerics, Args extends any[] = any[], M extends Mode = 'each'>(
  handler: (fileData: M extends 'each' ? UploadingFileData : UploadingFileData[]) => Method<AG>,
  config?: UploadHookConfig<AG, M>
): UploadExposure<AG, Args>;

export interface FileConverter {
  name: string;
  is(file: any): any;
  convert(file: any): any;
}
export declare namespace useUploader {
  function selectFile(options: FileAppendOptions): AlovaRawFile[];
  const converters: FileConverter[];
}
