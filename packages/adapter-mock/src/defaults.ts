import { isSpecialRequestBody } from '@alova/shared/function';
import { MockResponse } from '~/typings';

/**
 * 默认的响应数据拦截器，并返回Response数据
 */
export const defaultMockResponse: MockResponse<any, any, any> = ({ status = 200, statusText = 'ok', body }) => ({
  response: new Response(isSpecialRequestBody(body) ? body : JSON.stringify(body), {
    status,
    statusText
  }),
  headers: new Headers({})
});

/**
 * 返回错误信息本身
 * @param error 错误信息
 * @returns 本身
 */
export const defaultMockError = (error: any) => error;
