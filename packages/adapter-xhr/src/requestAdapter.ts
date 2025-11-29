import { data2QueryString, parseResponseHeaders } from '@/helper';
import {
  falseValue,
  includes,
  isPlainObject,
  isSpecialRequestBody,
  isString,
  newInstance,
  noop,
  nullValue,
  ObjectCls,
  trueValue,
  undefinedValue
} from '@alova/shared';
import type { ProgressUpdater } from 'alova';
import { AlovaXHRAdapter, AlovaXHRAdapterOptions, AlovaXHRResponse } from '~/typings';

const err = (msg: string) => newInstance(Error, msg);
const isBodyData = (data: any): data is XMLHttpRequestBodyInit => isString(data) || isSpecialRequestBody(data);
/**
 * XMLHttpRequest request adapter
 */
export default function requestAdapter({ onCreate = noop }: AlovaXHRAdapterOptions = {}) {
  const adapter: AlovaXHRAdapter = ({ type, url, data = null, headers }, method) => {
    const { config } = method;
    const { auth, withCredentials, mimeType, responseType } = config;
    let downloadHandler: ProgressUpdater = noop;
    let uploadHandler: ProgressUpdater = noop;

    let xhr: XMLHttpRequest;
    const responsePromise = new Promise<AlovaXHRResponse>((resolve, reject) => {
      try {
        xhr = new XMLHttpRequest();
        xhr.open(type, url, trueValue, auth?.username, auth?.password);

        // fix #501
        if (responseType && responseType !== 'json') {
          xhr.responseType = responseType;
        }

        xhr.timeout = config.timeout || 0;

        if (withCredentials === trueValue) {
          xhr.withCredentials = withCredentials;
        }

        // Set mime type
        if (mimeType) {
          xhr.overrideMimeType(mimeType);
        }

        // Set request header
        let isContentTypeFormUrlEncoded = falseValue;
        const isContentTypeSet = /content-type/i.test(ObjectCls.keys(headers).join());
        const isFormData = data && data.toString() === '[object FormData]';

        // Content-Type defaults to application/json when not specified; charset=UTF-8
        if (!isContentTypeSet && !isFormData) {
          headers['Content-Type'] = 'application/json; charset=UTF-8';
        }

        const ignoringHeaderValues = ['', undefinedValue, nullValue, falseValue];
        Object.keys(headers).forEach(headerName => {
          if (/content-type/i.test(headerName)) {
            isContentTypeFormUrlEncoded = /application\/x-www-form-urlencoded/i.test(headers[headerName]);
          }
          if (!includes(ignoringHeaderValues, headers[headerName])) {
            xhr.setRequestHeader(headerName, headers[headerName]);
          }
        });

        // Listen for download events
        xhr.addEventListener('progress', event => {
          downloadHandler(event.loaded, event.total);
        });

        // Listen for upload events
        xhr.upload.addEventListener('progress', event => {
          uploadHandler(event.loaded, event.total);
        });

        // Request success event
        xhr.addEventListener('load', () => {
          let responseData =
            !responseType || responseType === 'text' || responseType === 'json' ? xhr.responseText : xhr.response;

          // try to parse data as json
          // if fails, use raw response
          if (!responseType || responseType === 'json') {
            try {
              responseData = JSON.parse(responseData);
            } catch {}
          }

          resolve({
            status: xhr.status,
            statusText: xhr.statusText,
            data: responseData,
            headers: parseResponseHeaders(xhr.getAllResponseHeaders())
          });
        });

        // request error event
        xhr.addEventListener('error', () => {
          reject(err('Network Error'));
        });
        // Request timeout event
        xhr.addEventListener('timeout', () => {
          reject(err('Network Timeout'));
        });
        // interrupt event
        xhr.addEventListener('abort', () => {
          reject(err('The user aborted a request.'));
        });

        // If the content type in the request header is application/x www form urlencoded, convert the body data into query string
        let dataSend: any = data;
        if (isContentTypeFormUrlEncoded && isPlainObject(dataSend)) {
          dataSend = data2QueryString(dataSend);
        }
        // It is null when making a Get request, and there is no need to enter processing at this time.
        if (dataSend !== nullValue) {
          dataSend = isBodyData(dataSend) ? dataSend : JSON.stringify(dataSend);
        }

        // export xhr in `onCreate`
        onCreate(xhr);
        xhr.send(dataSend);
      } catch (error) {
        reject(error);
      }
    });

    return {
      response: () => responsePromise,
      headers: () => responsePromise.then(res => res.headers),
      abort: () => {
        xhr.abort();
      },
      onDownload: handler => {
        downloadHandler = handler;
      },
      onUpload: handler => {
        uploadHandler = handler;
      }
    };
  };
  return adapter;
}
