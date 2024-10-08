import { AlovaRequestAdapter } from '.';

declare namespace FetchTypes {
  type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;

  /**
   * adapterFetch请求适配器
   */
  type FetchRequestAdapter = AlovaRequestAdapter<FetchRequestInit, Response, Headers>;
}

declare function adapterFetch(): FetchTypes.FetchRequestAdapter;
export = FetchTypes;
