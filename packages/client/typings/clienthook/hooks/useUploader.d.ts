import { AlovaGenerics, Method } from 'alova';
import { AlovaCompleteEvent, AlovaErrorEvent, AlovaSuccessEvent } from '../general';

export interface UploadHookConfig<AG extends AlovaGenerics> {
  /**
   * Limit the number of upload files
   */
  limit?: number;
  /**
   * Accepted file formats that will be auto converted, e.g. ['png', 'jpg', 'pdf']
   */
  accept?: string[];
  /**
   * Whether to generate temporary image links for preview before upload completes
   * @default false
   */
  imageTempLink?: boolean;
  /**
   * Set a function to replace src field in fileList items with server file URL when upload succeeds
   * @param data - Response data
   * @param index - File index in fileList
   * @returns Server file URL
   */
  replaceSrcFromResponse?: (data: AG['Responded'], index: number) => string;
  /**
   * Upload mode
   * @remarks
   * - 'each': Upload each file separately
   * - 'batch': Upload all files in one request
   * @default 'each'
   */
  mode?: 'each' | 'batch';
}

/**
 * Represents a file item in the upload process.
 */
interface FileItem {
  /**
   * Temporary path or the file path after successful upload. It's not for images.
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
    loaded: number;
    /**
     * The total size of the file.
     */
    total: number;
  };
}

/**
 * Represents the progress information during the file upload process.
 */
interface ProgressInfo {
  /**
   * The total size that has been uploaded, which is the sum of multiple files.
   */
  loaded: number;
  /**
   * The total size of all files to be uploaded, which is the sum of multiple files.
   */
  total: number;
  /**
   * The total number of files currently being uploaded.
   */
  count: number;
  /**
   * The number of files that have been successfully uploaded.
   */
  successCount: number;
  /**
   * The number of files that failed to upload.
   */
  failCount: number;
}

interface RawFile {
  /**
   * A file object, base64 string, Blob object, ArrayBuffer, or HTMLCanvasElement.
   * It can be omitted when displaying the uploaded file.
   */
  file?: File | string | Blob | ArrayBuffer | HTMLCanvasElement;
  /**
   * The preview URL of the file. If provided, it will not be overwritten even if `imageTempLink` is set to `true`.
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
  /**
   * The upload status of the file.
   * - 0: Not uploaded yet.
   * - 1: Uploading.
   * - 2: Upload completed.
   * - 3: Upload error.
   * @default 0
   */
  status?: 0 | 1 | 2 | 3;
}

interface AlovaFileEvent {
  files: FileItem[];
  rawFiles: RawFile[];
  allRawFiles: RawFile[];
}

interface AlovaFileExceededEvent extends AlovaFileEvent {
  exceeded: number;
  limit: number;
}

interface AlovaFileMismatchEvent extends AlovaFileEvent {
  mismatchFiles: RawFile[];
}

interface AlovaFileSuccessEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends AlovaSuccessEvent<AG, Args> {
  file: FileItem;
}

interface AlovaFileErrorEvent<AG extends AlovaGenerics, Args extends any[] = any[]> extends AlovaErrorEvent<AG, Args> {
  file: FileItem;
}

interface AlovaFileCompleteEvent<AG extends AlovaGenerics, Args extends any[] = any[]>
  extends AlovaCompleteEvent<AG, Args> {
  file: FileItem;
}

type AppendFiles = (
  /**
   * Pass an object for a single file, or an array for multiple files
   * if not provide, it will open an input file dialog to select files.
   */
  files?: RawFile | RawFile[],
  /**
   * The position in the fileList to start appending.
   */
  start?: number
) => number;
export interface UploadExposure<AG extends AlovaGenerics, Args extends any[] = any[]> {
  /**
   * File data list. Each item contains the file name, file path, upload status, and upload progress.
   * For the specific format, @see {FileItem}
   */
  fileList: FileItem[];
  /**
   * The first file data item. It can be implemented using a computed property and is generally used for uploading a single file.
   */
  file: FileItem;
  /**
   * Indicates whether the upload is in progress.
   */
  loading: boolean;
  /**
   * The overall upload progress.
   */
  progress: ProgressInfo;

  /**
   * Appends files to the upload list. After appending, the 'file' items in the list will be automatically converted to File objects.
   * At this time, the 'name' property must have a value.
   *
   * @param files - A single file object or an array of multiple file objects.
   * @param start - The position in the fileList where the files will be appended. Optional.
   * @returns The number of successfully appended files. Append may fail due to quantity or format restrictions.
   */
  appendFiles: AppendFiles;

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
  upload: (...indexes: number[]) => void;
  /**
   * Event handler for when files are appended.
   * @param handler - The callback function to handle the AlovaFileEvent.
   */
  onFilesAppend: (handler: (event: AlovaFileEvent) => void) => void;
  /**
   * Event handler for when the file quantity limit is exceeded.
   * @param handler - The callback function to handle the AlovaFileExceededEvent.
   */
  onExceed: (handler: (event: AlovaFileExceededEvent) => void) => void;
  /**
   * Event handler for when the file format does not match.
   * @param handler - The callback function to handle the AlovaFileMismatchEvent.
   */
  onFormatMismatch: (handler: (event: AlovaFileMismatchEvent) => void) => void;
  /**
   * Event handler for when each file is uploaded successfully.
   * @param handler - The callback function to handle the AlovaFileSuccessEvent.
   */
  onSuccess: (handler: (event: AlovaFileSuccessEvent<AG, Args>) => void) => void;
  /**
   * Event handler for when each file fails to upload.
   * @param handler - The callback function to handle the AlovaFileErrorEvent.
   */
  onError: (handler: (event: AlovaFileErrorEvent<AG, Args>) => void) => void;
  /**
   * Event handler for when each file upload is completed.
   * @param handler - The callback function to handle the AlovaFileCompleteEvent.
   */
  onComplete: (handler: (event: AlovaFileCompleteEvent<AG, Args>) => void) => void;
}

interface UploadingFileData {
  /**
   * File object, only
   */
  file: File;
  name: string;
  files: File[];
}
export declare function useUploader<AG extends AlovaGenerics, Args extends any[] = any[]>(
  handler: (fileData: UploadingFileData) => Method<AG>,
  config?: UploadHookConfig<AG>
): UploadExposure<AG, Args>;
