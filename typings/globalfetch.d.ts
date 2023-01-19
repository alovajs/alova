import { Method, ProgressUpdater, RequestElements } from '.';

// 预定义的fetch配置
type GlobalFetch = () => (
  elements: RequestElements,
  method: Method<any, any, any, any, RequestInit, Response, Headers>
) => {
  response: () => Promise<Response>;
  headers: () => Promise<Headers>;
  onDownload: (handler: ProgressUpdater) => void;
  abort: () => void;
};

declare const globalFetch: GlobalFetch;
export default globalFetch;
