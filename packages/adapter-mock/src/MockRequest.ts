import {
  falseValue,
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
import { parseUrl } from './helper';

type MockRequestInitWithMock<RequestConfig, Response, ResponseHeader> = MockRequestInit<
  RequestConfig,
  Response,
  ResponseHeader
> & {
  mock: Mock;
};
export default function MockRequest<RequestConfig, Response, ResponseHeader>(
  {
    // 此enable为总开关
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
  return (
    elements: RequestElements,
    method: Method<AlovaGenerics<any, any, RequestConfig, Response, ResponseHeader>>
  ) => {
    // 获取当前请求的模拟数据集合，如果enable为false，则不返回模拟数据
    mock = (enable && mock) || {};

    const { url, data, type, headers: requestHeaders } = elements;
    let pathname = method.url;
    let query = method.config.params || {};
    if (matchMode === 'pathname') {
      const parsedUrl = parseUrl(url);
      pathname = parsedUrl.pathname;
      query = parsedUrl.query;
    }
    const params: Record<string, string> = {};
    const pathnameSplited = pathname.split('/');
    const foundMockDataKeys = Object.keys(mock).filter(key => {
      // 如果key的前面是-，表示忽略此模拟数据，此时也返回false
      if (key.startsWith('-')) {
        return falseValue;
      }

      // 匹配请求方法
      let methodType = 'GET';
      key = key.replace(/^\[(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE|CONNECT)\]/i, (_, $1) => {
        methodType = $1.toUpperCase();
        return '';
      });

      // 请求方法不匹配，返回false
      if (methodType !== type.toUpperCase()) {
        return falseValue;
      }

      const keySplited = key.split('/');
      if (keySplited.length !== pathnameSplited.length) {
        return falseValue;
      }

      // 通过相同下标匹配来判断是否匹配该路径
      // 如果遇到通配符则直接通过
      for (const i in keySplited) {
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

    // 如果匹配了多个，则优先使用没有通配符的，如果都有通配符则使用第一个匹配到的
    let finalKey = foundMockDataKeys.find(key => !/\{.*\}/.test(key));
    finalKey = finalKey || foundMockDataKeys.shift();
    const mockDataRaw = finalKey ? mock[finalKey] : undefinedValue;

    // 如果没有匹配到模拟数据，则表示要发起请求使用httpAdapter来发送请求
    if (mockDataRaw === undefinedValue) {
      if (httpAdapter) {
        isFn(mockRequestLogger) &&
          mockRequestLogger({
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
      // response支持返回promise对象
      try {
        const res = isFn(mockDataRaw)
          ? mockDataRaw({
              query,
              params,
              data: isString(data) || !data ? {} : data,
              headers: requestHeaders
            })
          : mockDataRaw;

        // 这段代码表示，将内部reject赋值到外部，如果超时了则立即触发reject，或者等待res（如果res为promise）resolve
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

        // 如果没有返回值则认为404
        if (response === undefinedValue) {
          status = 404;
          statusText = 'api not found';
        } else if (response && isNumber(response.status) && isString(response.statusText)) {
          // 返回了自定义状态码和状态文本，将它作为响应信息
          status = response.status;
          statusText = response.statusText;
          responseHeaders = response.responseHeaders || responseHeaders;
          body = response.body;
        } else {
          // 否则，直接将response作为响应数据
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
          // 打印模拟数据请求信息
          isFn(mockRequestLogger) &&
            mockRequestLogger({
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

    // 返回响应数据
    return {
      response: () =>
        resonpsePromise.then(({ response }) =>
          response && response.toString() === '[object Response]' ? (response as any).clone() : response
        ),
      headers: () => resonpsePromise.then(({ headers }) => headers),
      abort: () => {
        clearTimeout(timer);
        reject(new Error('The user abort request'));
      }
    };
  };
}
