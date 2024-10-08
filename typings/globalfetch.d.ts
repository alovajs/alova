import { AlovaRequestAdapter } from '.';

export type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;

/**
 * GlobalFetch请求适配器
 */
export type GlobalFetchRequestAdapter = AlovaRequestAdapter<any, any, FetchRequestInit, Response, Headers>;

declare function GlobalFetch(): GlobalFetchRequestAdapter;
export default GlobalFetch;
