import { AlovaGenerics, AlovaRequestAdapter, Method } from 'alova';
import adapterFetch from 'alova/fetch';

type FetchRequestInit =
  ReturnType<typeof adapterFetch> extends AlovaRequestAdapter<infer RequestConfig, any, any> ? RequestConfig : never;

export interface MockServerRequest {
  headers: Record<string, any>;
  query: Record<string, any>;
  params: Record<string, any>;
  data: any;
}

export interface ResponseHeaders {
  [x: string]: any;
}
export interface LoggerMockRequestResponse extends MockServerRequest {
  isMock: boolean;
  url: string;
  method: string;
  responseHeaders: ResponseHeaders;
  response?: any;
}
export interface MockRequestLoggerAdapter {
  (loggerData: LoggerMockRequestResponse): void;
}
/**
 * Simulate response function
 */
export interface MockResponse<RequestConfig, Response, ResponseHeader> {
  (
    response: {
      status: number;
      statusText: string;
      responseHeaders: ResponseHeaders;
      body: any;
    },
    request: MockServerRequest,
    currentMethod: Method<AlovaGenerics<any, any, RequestConfig, Response, ResponseHeader>>
  ): {
    response: Response;
    headers: ResponseHeader;
  };
}
export interface MockError {
  (error: Error, currentMethod: Method): any;
}
export interface MockRequestInit<RequestConfig, Response, ResponseHeader> {
  /**
   * Whether to enable simulated data
   * @default true
   */
  enable?: boolean;
  /**
   * Analog response delay time, in milliseconds
   * @default 2000
   */
  delay?: number;
  /**
   * This request adapter request will be used when the mock interface is not matched
   */
  httpAdapter?: AlovaRequestAdapter<RequestConfig, Response, ResponseHeader>;

  /**
   * Whether to print simulation request information to facilitate debugging
   */
  mockRequestLogger?: boolean | MockRequestLoggerAdapter;
  onMockResponse?: MockResponse<RequestConfig, Response, ResponseHeader>;
  onMockError?: MockError;

  /**
   * match pattern
   * When the value is pathname, it will match the pathname of the url.
   * When the value is methodurl, it will match the url in method.
   * @default 'pathname'
   */
  matchMode?: 'pathname' | 'methodurl';
}

export interface StatusResponse {
  status: number;
  statusText: string;
  responseHeaders?: ResponseHeaders;
  body?: any;
}
export type MockFunction = (request: MockServerRequest) => StatusResponse | any;
export type Mock = Record<string, MockFunction | string | number | null | Record<string, any> | any[]>;

export interface MockWrapper {
  enable: boolean;
  data: Mock;
}

export declare function createAlovaMockAdapter<
  RequestConfig = FetchRequestInit,
  RE = Response,
  ResponseHeader = Headers
>(
  mockWrapper: MockWrapper[],
  options?: MockRequestInit<RequestConfig, RE, ResponseHeader>
): AlovaRequestAdapter<RequestConfig, RE, ResponseHeader>;

export declare function defineMock(mock: Mock, enable?: boolean): MockWrapper;
