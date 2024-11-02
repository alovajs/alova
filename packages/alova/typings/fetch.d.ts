import { AlovaRequestAdapter } from '.';

export type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;

/**
 * fetch request adapter
 */
export type FetchRequestAdapter = AlovaRequestAdapter<FetchRequestInit, Response, Headers>;

declare function adapterFetch(): FetchRequestAdapter;
export default adapterFetch;
