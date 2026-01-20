import { AlovaRequestAdapter } from '.';

export type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;

/**
 * fetch request adapter
 */
export type FetchRequestAdapter = AlovaRequestAdapter<FetchRequestInit, Response, Headers>;

export interface AdapterCreateOptions {
  customFetch?: typeof fetch;
}

declare function adapterFetch(options?: AdapterCreateOptions): FetchRequestAdapter;
export default adapterFetch;
