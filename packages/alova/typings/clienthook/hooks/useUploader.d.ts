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
  /**
   * The number of files that have been successfully uploaded.
   */
  successCount: number;
  /**
   * The number of files that failed to upload.
   */
  failCount: number;
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
  file?: F;
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
   * Pass an object for a single file, or an array for multiple files
   * if not provide, it will open an input file dialog to select files.
   */
  file?: AlovaRawFile | AlovaRawFile[];
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
   * Appends files to the upload list. After appending, the 'file' items in the list will be automatically converted to File objects.
   * At this time, the 'name' property must have a value.
   *
   * @param files - A single file object or an array of multiple file objects.
   * @param start - The position in the fileList where the files will be appended. Optional.
   * @returns The number of successfully appended files. Append may fail due to quantity or format restrictions.
   */
  appendFiles: (options?: FileAppendOptions) => number;

  /**
   * Executes the upload operation.
   * If no parameters are passed, it will automatically re-initiate upload requests for all items in the fileList
   * whose 'file' property has a value and whose 'status' is 0 (not uploaded) or 3 (upload failed).
   * If parameter indexes are passed, it will create a new array with the corresponding items in the fileList,
   * filter out the uploadable items according to the above conditions, and initiate upload requests.
   * In this case, if there are items that do not meet the conditions, an error should be thrown instead of being ignored.
   *
   * After initiating the upload operation:
   * Multiple files will be uploaded in parallel. That is, the array of files that meet the upload conditions will be traversed,
   * and the first callback function of useUploader will be called in sequence to obtain the Method object and send requests.
   * Internally, it can be implemented using useRequest because many properties in the fileList can be provided by useRequest.
   */
  upload: (...indexes: number[]) => Promise<M extends 'batch' ? AG['Responded'] : AG['Responded'][]>;
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
