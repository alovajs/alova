import { AlovaCompleteEvent, AlovaEventBase, AlovaSuccessEvent } from '@/event';
import { AlovaGenerics } from 'alova';
import { FileItem, RawFile } from '~/typings/clienthook/hooks/useUploader';

export class AlovaFileEvent {
  files: FileItem[];
  rawFiles: RawFile[];
  allRawFiles: RawFile[];

  constructor(files: FileItem[], rawFiles: RawFile[], allRawFiles: RawFile[]) {
    this.files = files;
    this.rawFiles = rawFiles;
    this.allRawFiles = allRawFiles;
  }
}

export class AlovaFileErrorEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaEventBase<AG, Args> {
  error: Error;
  files: FileItem[];
  rawFiles: RawFile[];
  allRawFiles: RawFile[];

  constructor(
    base: AlovaEventBase<AG, Args>,
    error: Error,
    files: FileItem[],
    rawFiles: RawFile[],
    allRawFiles: RawFile[]
  ) {
    super(base.method, base.args);
    this.error = error;
    this.files = files;
    this.rawFiles = rawFiles;
    this.allRawFiles = allRawFiles;
  }
}

export class AlovaFileExceededEvent extends AlovaFileEvent {
  exceeded: number;
  limit: number;

  constructor(files: FileItem[], rawFiles: RawFile[], allRawFiles: RawFile[], exceeded: number, limit: number) {
    super(files, rawFiles, allRawFiles);
    this.exceeded = exceeded;
    this.limit = limit;
  }
}

export class AlovaFileMismatchEvent extends AlovaFileEvent {
  mismatchFiles: RawFile[];

  constructor(files: FileItem[], rawFiles: RawFile[], allRawFiles: RawFile[], mismatchFiles: RawFile[]) {
    super(files, rawFiles, allRawFiles);
    this.mismatchFiles = mismatchFiles;
  }
}

export class AlovaFileSuccessEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaSuccessEvent<AG, Args> {
  file: FileItem;

  constructor(base: AlovaEventBase<AG, Args>, data: AG['Responded'], fromCache: boolean, file: FileItem) {
    super(base, data, fromCache);
    this.file = file;
  }
}

export class AlovaFileCompleteEvent<AG extends AlovaGenerics, Args extends any[]> extends AlovaCompleteEvent<AG, Args> {
  file: FileItem;

  constructor(
    base: AlovaEventBase<AG, Args>,
    status: 'success' | 'error',
    data: AG['Responded'],
    fromCache: boolean,
    error: any,
    file: FileItem
  ) {
    super(base, status, data, fromCache, error);
    this.file = file;
  }
}
