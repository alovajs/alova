import { MockResponse } from '@alova/mock';
import { AlovaRequestAdapter } from 'alova';

/**
 * xhr request configuration parameters
 */
export interface AlovaXHRRequestConfig {
  /**
   * Set the response data type.
   *
   * Change response type can be set. values are: "arraybuffer", "blob", "document", "json", and "text".
   * Setting 1: If the current global object is not a Window object, the setting to "Document" is ignored.
   * Setup 2: Throw an "InvalidStateError" DOMException if the state is loading or completing.
   * Setting 3: If the synchronization flag is set and the current global object is a Window object, an "InvalidAccessError" DOMException is thrown.
   * @default "json"
   */
  responseType?: XMLHttpRequestResponseType;

  /**
   * True when credentials are to be included in cross-origin requests. False when they are excluded from cross-origin requests and when cookies are ignored in their responses. The default is false.
   * If the state has not been sent or opened, or the send() flag is set, an "InvalidStateError" DOMException is thrown.
   * @default false
   */
  withCredentials?: boolean;

  /**
   * Set the mimeType of the response data
   */
  mimeType?: string;

  /**
   * `auth` indicates that HTTP Basic authentication should be used, providing credentials.
   * This will set an `Authorization` header, overwriting any existing
   * Use `Authorization` custom headers set by `headers`.
   * Note that only HTTP Basic authentication can be configured with this parameter.
   * For Bearer tokens etc., use the `Authorization` custom header instead.
   */
  auth?: {
    username: string;
    password: string;
  };
}

/**
 * Response header information
 */
export interface AlovaXHRResponseHeaders {
  [x: string]: any;
}

/**
 * response data structure
 */
export interface AlovaXHRResponse<T = any> {
  status: number;
  statusText: string;
  data: T;
  headers: AlovaXHRResponseHeaders;
}

/**
 * XMLHttpRequest request adapter type
 */
export type AlovaXHRAdapter = AlovaRequestAdapter<AlovaXHRRequestConfig, AlovaXHRResponse, AlovaXHRResponseHeaders>;

/**
 * XMLHttpRequest request adapter options
 */
export interface AlovaXHRAdapterOptions {
  onCreate?: (xhr: XMLHttpRequest) => void;
}

/**
 * XMLHttpRequest request adapter
 */
export declare function xhrRequestAdapter(options: AlovaXHRAdapterOptions): AlovaXHRAdapter;

/**
 * Mock response adapter, which is used in @alova/mock to allow xhr response data to be returned in a format compatible with mock requests.
 * @example
 * ```js
 * import { xhrRequestAdapter, xhrMockResponse } from '@alova/adapter-xhr';
 *
 * const mockRequestAdapter = createAlovaMockAdapter([mocks], {
 *		delay: 1000,
 *    httpAdapter: xhrRequestAdapter(),
 * 		onMockResponse: xhrMockResponse
 * });
 *	const alovaInst = createAlova({
 *		baseURL: 'http://xxx',
 *		requestAdapter: process.env.NODE_ENV === 'development'
 *			? mockRequestAdapter
 *			: xhrRequestAdapter(),
 *	});
 * ```
 */
export declare const xhrMockResponse: MockResponse<AlovaXHRRequestConfig, AlovaXHRResponse, AlovaXHRResponseHeaders>;
