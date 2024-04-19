import { AlovaRequestAdapter, Method } from 'alova';
import { FetchRequestInit } from 'alova/GlobalFetch';

interface MockServerRequest {
  headers: Record<string, any>;
  query: Record<string, any>;
  params: Record<string, any>;
  data: Record<string, any>;
}

interface ResponseHeaders {
  [x: string]: any;
}
interface LoggerMockRequestResponse extends MockServerRequest {
  isMock: boolean;
  url: string;
  method: string;
  responseHeaders: ResponseHeaders;
  response?: any;
}
interface MockRequestLoggerAdapter {
  (loggerData: LoggerMockRequestResponse): void;
}
/**
 * 模拟响应函数
 */
interface MockResponse<RC, RE, RH> {
  (
    response: {
      status: number;
      statusText: string;
      responseHeaders: ResponseHeaders;
      body: any;
    },
    request: MockServerRequest,
    currentMethod: Method<any, any, any, any, RC, RE, RH>
  ): {
    response: RE;
    headers: RH;
  };
}
interface MockError {
  (error: Error, currentMethod: Method): any;
}
interface MockRequestInit<R, T, RC, RE, RH> {
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
  httpAdapter?: AlovaRequestAdapter<R, T, RC, RE, RH>;

  /**
   * 是否打印模拟请求信息，便于调试
   */
  mockRequestLogger?: boolean | MockRequestLoggerAdapter;
  onMockResponse?: MockResponse<RC, RE, RH>;
  onMockError?: MockError;

  /**
   * 匹配模式
   * 值为pathname时将匹配url的pathname
   * 值为methodurl时将匹配method中的url
   * @default 'pathname'
   */
  matchMode?: 'pathname' | 'methodurl';
}

interface StatusResponse {
  status: number;
  statusText: string;
  responseHeaders?: ResponseHeaders;
  body?: any;
}
type MockFunction = (request: MockServerRequest) => StatusResponse | any;
type Mock = Record<string, MockFunction | string | number | Record<string, any> | any[]>;

interface MockWrapper {
  enable: boolean;
  data: Mock;
}

export declare function createAlovaMockAdapter<RC = FetchRequestInit, RE = Response, RH = Headers>(
  mockWrapper: MockWrapper[],
  options?: MockRequestInit<any, any, RC, RE, RH>
): AlovaRequestAdapter<any, any, RC, RE, RH>;

export declare function defineMock(mock: Mock, enable?: boolean): MockWrapper;
