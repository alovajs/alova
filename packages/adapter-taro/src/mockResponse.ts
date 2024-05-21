import { MockResponse } from '@alova/mock';
import { TaroConfig } from '~/typings';

type TaroResponse =
  | Taro.uploadFile.SuccessCallbackResult
  | Taro.downloadFile.FileSuccessCallbackResult
  | Taro.request.SuccessCallbackResult<any>;
const mockResponseHandler: MockResponse<TaroConfig, TaroResponse, Taro.request.SuccessCallbackResult<any>['header']> = (
  { status, statusText, body },
  _,
  currentMethod
) => {
  const { requestType } = currentMethod.config;
  const responseHeaders = {};
  if (requestType === 'upload') {
    return {
      response: {
        data: body,
        statusCode: status,
        errMsg: statusText,
        header: responseHeaders
      },
      headers: responseHeaders
    };
  }
  if (requestType === 'download') {
    const isSuccess = status === 200;
    return {
      response: {
        filePath: currentMethod.config.filePath || '',
        tempFilePath: isSuccess ? (body as any) : '',
        statusCode: status,
        errMsg: statusText,
        header: responseHeaders
      },
      headers: responseHeaders
    };
  }

  return {
    response: {
      data: body,
      statusCode: status,
      header: responseHeaders,
      errMsg: statusText,
      cookies: []
    },
    headers: responseHeaders
  };
};
export default mockResponseHandler;
