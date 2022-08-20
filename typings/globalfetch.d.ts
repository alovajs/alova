import { AlovaRequestAdapterConfig, ProgressUpdater } from '.';

// 预定义的fetch配置
type GlobalFetch = (defaultRequestInit?: RequestInit) => (adapterConfig: AlovaRequestAdapterConfig<unknown, unknown, RequestInit, Headers>) => {
  response: () => Promise<Response>;
  headers: () => Promise<Headers>;
  onDownload: (handler: ProgressUpdater) => void;
  abort: () => void;
};

declare const globalFetch: GlobalFetch;
export default globalFetch;