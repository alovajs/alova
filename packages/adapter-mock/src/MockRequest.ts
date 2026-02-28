import {
  falseValue,
  globalToString,
  isFn,
  isNumber,
  isString,
  newInstance,
  promiseReject,
  promiseResolve,
  trueValue,
  undefinedValue,
  usePromise
} from '@alova/shared';
import type { AlovaGenerics, Method, RequestElements } from 'alova';
import { Mock, MockRequestInit } from '~/typings';
import consoleRequestInfo from './consoleRequestInfo';
import { defaultMockError, defaultMockResponse } from './defaults';
import { parseUrl, parseQueryString } from './helper';

type MockRequestInitWithMock<RequestConfig, Response, ResponseHeader> = MockRequestInit<
  RequestConfig,
  Response,
  ResponseHeader
> & {
  mock: Mock;
};
export default function MockRequest<RequestConfig, Response, ResponseHeader>(
  {
    // This enable is the main switch
    enable = trueValue,
    delay = 2000,
    httpAdapter,
    mockRequestLogger = consoleRequestInfo,
    mock,
    onMockResponse = defaultMockResponse,
    onMockError = defaultMockError,
    matchMode = 'pathname'
  }: MockRequestInitWithMock<RequestConfig, Response, ResponseHeader> = { mock: {} }
) {
  // Normalize the logger: true uses default consoleRequestInfo, false or undefined disables logging
  const resolvedMockRequestLogger = mockRequestLogger === trueValue ? consoleRequestInfo : mockRequestLogger;

  return (
    elements: RequestElements,
    method: Method<AlovaGenerics<any, any, RequestConfig, Response, ResponseHeader>>
  ) => {
    // Get the simulation data collection of the current request. If enable is false, no simulation data will be returned.
    mock = (enable && mock) || {};

    const { url, data, type, headers: requestHeaders } = elements;
    let pathname = method.url;
    const paramsConfig = method.config.params;
    let query = isString(paramsConfig) ? parseQueryString(paramsConfig) : paramsConfig || {};
    if (matchMode === 'pathname') {
      const parsedUrl = parseUrl(url);
      pathname = parsedUrl.pathname;
      query = parsedUrl.query;
    }
    const params: Record<string, string> = {};
    const pathnameSplited = pathname.split('/');
    const foundMockDataKeys = Object.keys(mock).filter(key => {
      // If the key is preceded by , it means that this simulation data is ignored, and false is also returned at this time.
      if (key.startsWith('-')) {
        return falseValue;
      }

      // Match request method
      let methodType = 'GET';
      key = key.replace(/^\[(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE|CONNECT)\]/i, (_, $1) => {
        methodType = $1.toUpperCase();
        return '';
      });

      // The request method does not match and returns false.
      if (methodType !== type.toUpperCase()) {
        return falseValue;
      }

      const keySplited = key.split('/');
      if (keySplited.length !== pathnameSplited.length) {
        return falseValue;
      }

      // Determine whether the path matches by matching with the same subscript
      // If a wildcard is encountered, pass it directly
      for (let i = 0; i < keySplited.length; i += 1) {
        const keySplitedItem = keySplited[i];
        const matchedParamKey = (keySplitedItem.match(/^\{(.*)\}$/) || ['', ''])[1];
        if (!matchedParamKey) {
          if (keySplitedItem !== pathnameSplited[i]) {
            return falseValue;
          }
        } else {
          params[matchedParamKey] = pathnameSplited[i];
        }
      }
      return trueValue;
    });

    // If there are multiple matches, the one without wildcards will be used first. If there are both wildcards, the first matched one will be used.
    let finalKey = foundMockDataKeys.find(key => !/\{.*\}/.test(key));
    finalKey = finalKey || foundMockDataKeys.shift();
    const mockDataRaw = finalKey ? mock[finalKey] : undefinedValue;

    // If no simulated data is matched, it means that a request is to be initiated and the http adapter is used to send the request.
    if (mockDataRaw === undefinedValue) {
      if (httpAdapter) {
        isFn(resolvedMockRequestLogger) &&
          resolvedMockRequestLogger({
            isMock: falseValue,
            url,
            method: type,
            params,
            headers: requestHeaders,
            query,
            data: {},
            responseHeaders: {}
          });
        return httpAdapter(elements, method);
      }
      throw new Error(`cannot find the httpAdapter.\n[url]${url}`);
    }

    const promiseResolver = usePromise();
    const { resolve } = promiseResolver;
    let { promise: resonpsePromise, reject } = promiseResolver;
    const timeout = method.config.timeout || 0;
    if (timeout > 0) {
      setTimeout(() => {
        reject(new Error('request timeout'));
      }, timeout);
    }

    const timer = setTimeout(() => {
      // Response supports returning promise objects
      try {
        const res = isFn(mockDataRaw)
          ? mockDataRaw({
              query,
              params,
              data: isString(data)
                ? (() => {
                    try {
                      return JSON.parse(data);
                    } catch {
                      return data;
                    }
                  })()
                : data || {},
              headers: requestHeaders
            })
          : mockDataRaw;

        // This code means that the internal reject is assigned to the outside, and if the timeout occurs, the reject is triggered immediately, or waits for res (if res is a promise) to resolve
        resolve(
          newInstance(Promise<any>, (resolveInner, rejectInner) => {
            reject = rejectInner;
            promiseResolve(res).then(resolveInner).catch(rejectInner);
          })
        );
      } catch (error) {
        reject(error);
      }
    }, delay);

    resonpsePromise = resonpsePromise
      .then((response: any) => {
        let status = 200;
        let statusText = 'ok';
        let responseHeaders = {};
        let body = undefinedValue;

        // If there is no return value, it is considered 404
        if (response === undefinedValue) {
          status = 404;
          statusText = 'api not found';
        } else if (response && isNumber(response.status) && isString(response.statusText)) {
          // Returned a custom status code and status text as the response message
          status = response.status;
          statusText = response.statusText;
          responseHeaders = response.responseHeaders || responseHeaders;
          body = response.body;
        } else {
          // Otherwise, use response directly as response data
          body = response;
        }

        return newInstance(Promise, (resolve, reject) => {
          try {
            const res = onMockResponse(
              { status, statusText, responseHeaders, body },
              {
                headers: requestHeaders,
                query,
                params,
                data: (data as any) || {}
              },
              method
            );
            resolve(res);
          } catch (error) {
            reject(error);
          }
        }).then(response => {
          // Print simulation data request information
          isFn(resolvedMockRequestLogger) &&
            resolvedMockRequestLogger({
              isMock: trueValue,
              url,
              method: type,
              params,
              headers: requestHeaders,
              query,
              data: (data as any) || {},
              responseHeaders,
              response: body
            });
          return response;
        });
      })
      .catch(error => promiseReject(onMockError(error, method)));

    // Return response data
    return {
      response: () =>
        resonpsePromise.then(({ response }) =>
          response && globalToString(response) === '[object Response]' ? (response as any).clone() : response
        ),
      headers: () => resonpsePromise.then(({ headers }) => headers),
      abort: () => {
        clearTimeout(timer);
        reject(new Error('The user abort request'));
      }
    };
  };
}
