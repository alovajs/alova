import {
  JSONStringify,
  ObjectCls,
  clearTimeoutTimer,
  falseValue,
  isSpecialRequestBody,
  isString,
  newInstance,
  promiseReject,
  setTimeoutFn,
  trueValue,
  undefinedValue
} from '@alova/shared';
import { AlovaRequestAdapter } from '~/typings';

type FetchRequestInit = Omit<RequestInit, 'body' | 'headers' | 'method'>;
const isBodyData = (data: any): data is BodyInit => isString(data) || isSpecialRequestBody(data);
export default function adapterFetch(): AlovaRequestAdapter<FetchRequestInit, Response, Headers> {
  return (elements, method) => {
    const adapterConfig = method.config;
    const timeout = adapterConfig.timeout || 0;
    const ctrl = new AbortController();
    const { data, headers } = elements;
    const isContentTypeSet = /content-type/i.test(ObjectCls.keys(headers).join());
    const isDataFormData = data && data.toString() === '[object FormData]';

    // When the content type is not set and the data is not a form data object, the content type is set to application/json by default.
    if (!isContentTypeSet && !isDataFormData) {
      headers['Content-Type'] = 'application/json;charset=UTF-8';
    }
    const fetchPromise = fetch(elements.url, {
      ...adapterConfig,
      method: elements.type,
      signal: ctrl.signal,
      body: isBodyData(data) ? data : JSONStringify(data)
    });

    // If the interruption time is set, the request will be interrupted after the specified time.
    let abortTimer: NodeJS.Timeout | number;
    let isTimeout = falseValue;
    if (timeout > 0) {
      abortTimer = setTimeoutFn(() => {
        isTimeout = trueValue;
        ctrl.abort();
      }, timeout);
    }

    return {
      response: () =>
        fetchPromise.then(
          response => {
            // Clear interrupt processing after successful request
            clearTimeoutTimer(abortTimer);

            // Response's readable can only be read once and needs to be cloned before it can be reused.
            return response.clone();
          },
          err => promiseReject(isTimeout ? newInstance(Error, 'fetchError: network timeout') : err)
        ),

      // The then in the Headers function needs to catch exceptions, otherwise the correct error object will not be obtained internally.
      headers: () =>
        fetchPromise.then(
          ({ headers: responseHeaders }) => responseHeaders,
          () => ({}) as Headers
        ),
      // Due to limitations of the node fetch library, this code cannot be unit tested, but it has passed the test in the browser.
      /* c8 ignore start */
      onDownload: async (cb: (loaded: number, total: number) => void) => {
        let isAborted = falseValue;
        const response = await fetchPromise.catch(() => {
          isAborted = trueValue;
        });
        if (!response) return;

        const { headers: responseHeaders, body } = response.clone();
        const reader = body ? body.getReader() : undefinedValue;
        const total = Number(responseHeaders.get('Content-Length') || responseHeaders.get('content-length') || 0);
        if (total <= 0) {
          return;
        }
        let loaded = 0;
        if (reader) {
          const pump = (): Promise<void> =>
            reader.read().then(({ done, value = new Uint8Array() }) => {
              if (done || isAborted) {
                isAborted && cb(total, 0);
              } else {
                loaded += value.byteLength;
                cb(total, loaded);
                return pump();
              }
            });
          pump();
        }
      },
      onUpload() {
        // eslint-disable-next-line no-console
        console.error(
          "fetch API does'nt support uploading progress. please consider to change `@alova/adapter-xhr` or `@alova/adapter-axios`"
        );
      },
      /* c8 ignore stop */
      abort: () => {
        ctrl.abort();
        clearTimeoutTimer(abortTimer);
      }
    };
  };
}
