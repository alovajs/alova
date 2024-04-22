import { MockResponse } from '@alova/mock';
import { AlovaRequestAdapter } from 'alova';

/**
 * xhr请求配置参数
 */
interface AlovaXHRRequestConfig {
  /**
   * 设置响应数据类型。
   *
   * 可以设置更改响应类型。 值为：“arraybuffer”、“blob”、“document”、“json”和“text”。
   * 设置1：如果当前全局对象不是 Window 对象，则忽略设置为“文档”。
   * 设置2：如果状态正在加载或完成，则抛出“InvalidStateError”DOMException。
   * 设置3：如果设置了同步标志且当前全局对象是 Window 对象，则抛出“InvalidAccessError”DOMException。
   * @default "json"
   */
  responseType?: XMLHttpRequestResponseType;

  /**
   * 当凭证要包含在跨源请求中时为true。 当它们被排除在跨源请求中以及当 cookie 在其响应中被忽略时为 false。 默认为false。
   * 如果状态未发送或未打开，或者设置了send() 标志，则抛出“InvalidStateError”DOMException。
   * @default false
   */
  withCredentials?: boolean;

  /**
   * 设置响应数据的mimeType
   */
  mimeType?: string;

  /**
   * `auth` 表示应该使用 HTTP Basic 身份验证，并提供凭据。
   * 这将设置一个 `Authorization` 标头，覆盖任何现有的
   * 使用 `headers` 设置的 `Authorization` 自定义标头。
   * 请注意，只有 HTTP Basic 身份验证可以通过此参数进行配置。
   * 对于 Bearer 令牌等，请改用 `Authorization` 自定义标头。
   */
  auth?: {
    username: string;
    password: string;
  };
}

/**
 * 响应头信息
 */
interface AlovaXHRResponseHeaders {
  [x: string]: any;
}

/**
 * 响应数据结构
 */
interface AlovaXHRResponse<T = any> {
  status: number;
  statusText: string;
  data: T;
  headers: AlovaXHRResponseHeaders;
}

/**
 * XMLHttpRequest请求适配器类型
 */
type AlovaXHRAdapter = AlovaRequestAdapter<any, any, AlovaXHRRequestConfig, AlovaXHRResponse, AlovaXHRResponseHeaders>;

/**
 * XMLHttpRequest请求适配器
 */
export declare function xhrRequestAdapter(): AlovaXHRAdapter;

/**
 * 模拟响应适配器，它用于@alova/mock中，让模拟请求时也能返回xhr响应数据兼容的格式
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
