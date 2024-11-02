import { AlovaRequestAdapter } from '.';

declare namespace FetchTypes {
  type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;

  /**
   * fetch request adapter
   */
  type FetchRequestAdapter = AlovaRequestAdapter<FetchRequestInit, Response, Headers>;
}

declare function adapterFetch(): FetchTypes.FetchRequestAdapter;
export = FetchTypes;
