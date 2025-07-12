import { AlovaRequestAdapter } from '.';

declare namespace GlobalFetch {
  type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;

  /**
   * GlobalFetch请求适配器
   */
  type GlobalFetchRequestAdapter = AlovaRequestAdapter<any, any, FetchRequestInit, Response, Headers>;
}

declare function GlobalFetch(): GlobalFetch.GlobalFetchRequestAdapter;
export = GlobalFetch;
