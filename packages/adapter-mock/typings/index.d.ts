import { AlovaGenerics, AlovaRequestAdapter, Method } from 'alova';
import { FetchRequestInit } from 'alova/GlobalFetch';

export interface MockServerRequest {
  headers: Record<string, any>;
  query: Record<string, any>;
  params: Record<string, any>;
  data: Record<string, any>;
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
 * 模拟响应函数
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
    currentMethod: Method<AlovaGenerics<any, any, any, any, any, any, RequestConfig, Response, ResponseHeader>>
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
   * 是否启用模拟数据
   * @default true
   */
  enable?: boolean;
  /**
   * 模拟响应延迟时间，单位毫秒
   * @default 2000
   */
  delay?: number;
  /**
   * 当未匹配模拟接口时将使用此请求适配器请求
   */
  httpAdapter?: AlovaRequestAdapter<RequestConfig, Response, ResponseHeader>;

  /**
   * 是否打印模拟请求信息，便于调试
   */
  mockRequestLogger?: boolean | MockRequestLoggerAdapter;
  onMockResponse?: MockResponse<RequestConfig, Response, ResponseHeader>;
  onMockError?: MockError;

  /**
   * 匹配模式
   * 值为pathname时将匹配url的pathname
   * 值为methodurl时将匹配method中的url
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
export type Mock = Record<string, MockFunction | string | number | Record<string, any> | any[]>;

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
