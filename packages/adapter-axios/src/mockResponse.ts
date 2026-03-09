import { undefinedValue } from '@alova/shared';
import { AxiosError, AxiosHeaders, AxiosResponseHeaders } from 'axios';
import { AxiosMockError, AxiosMockResponse } from '~/typings';

const mockResponseHandler: AxiosMockResponse = ({ status, statusText, body }, _, currentMethod) => {
  const responseHeaders = {};
  const { config } = currentMethod;
  const axiosConfig = {
    baseURL: currentMethod.baseURL,
    url: currentMethod.url,
    data: currentMethod.data,
    ...config,
    headers: new AxiosHeaders(config.headers)
  };
  const axiosResponse = {
    data: body,
    status,
    statusText,
    headers: responseHeaders,
    config: axiosConfig
  };

  // 状态大于等于400时抛出错误
  if (status >= 400) {
    throw new AxiosError(statusText, 'ERR_BAD_REQUEST', axiosConfig, undefinedValue, axiosResponse);
  }
  return {
    response: axiosResponse,
    headers: responseHeaders as AxiosResponseHeaders
  };
};

const mockErrorHandler: AxiosMockError = (error, currentMethod) => {
  const { config } = currentMethod;
  return new AxiosError(error.message, 'ERR_NETWORK', {
    baseURL: currentMethod.baseURL,
    url: currentMethod.url,
    data: currentMethod.data,
    ...config,
    headers: new AxiosHeaders(config.headers)
  });
};

export default {
  onMockResponse: mockResponseHandler,
  onMockError: mockErrorHandler
};
