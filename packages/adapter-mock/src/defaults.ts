import { isSpecialRequestBody } from '@alova/shared';
import { MockResponse } from '~/typings';

/**
 * The default response data interceptor and returns Response data
 */
export const defaultMockResponse: MockResponse<any, any, any> = ({
  status = 200,
  responseHeaders,
  statusText = 'ok',
  body
}) => ({
  response: new Response(isSpecialRequestBody(body) ? body : JSON.stringify(body), {
    status,
    statusText
  }),
  headers: new Headers(responseHeaders)
});

/**
 * Return the error message itself
 * @param error error message
 * @returns itself
 */
export const defaultMockError = (error: any) => error;
