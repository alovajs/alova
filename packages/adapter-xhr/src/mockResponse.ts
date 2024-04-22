import { MockResponse } from '@alova/mock';
import { AlovaXHRRequestConfig, AlovaXHRResponse, AlovaXHRResponseHeaders } from '../typings';

const mockResponseHandler: MockResponse<AlovaXHRRequestConfig, AlovaXHRResponse, AlovaXHRResponseHeaders> = ({
  status,
  statusText,
  body,
  responseHeaders
}) => ({
  response: {
    data: body,
    status,
    statusText,
    headers: responseHeaders
  },
  headers: responseHeaders
});
export default mockResponseHandler;
