import { AlovaRequestAdapter } from '.';

declare namespace FetchTypes {
  type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;

  /**
   * fetch request adapter
   */
  type FetchRequestAdapter = AlovaRequestAdapter<FetchRequestInit, Response, Headers>;

  interface AdapterCreateOptions {
    customFetch?: typeof fetch;
  }
}

declare function adapterFetch(options?: FetchTypes.AdapterCreateOptions): FetchTypes.FetchRequestAdapter;
export = FetchTypes;
