import { createAlovaMockAdapter } from '@alova/mock';
import { createAlova } from 'alova';
import reactHook from 'alova/react';
import { createIndexedDBAdapter } from './IndexedDBAdapter';
import basics from './mock/basics';
import cache from './mock/cache';
import list from './mock/list';
import optimistic from './mock/optimistic';

export const networkStatus = {
  _value: Number(sessionStorage.getItem('network.status') || 1),
  get value() {
    return this._value;
  },
  set value(value) {
    this._value = Number(value);
    sessionStorage.setItem('network.status', value);
  }
};

// mock adapter
const mockRequestAdapter = createAlovaMockAdapter([basics, list, cache, optimistic], {
  delay: 1000,
  onMockResponse: async ({ body, responseHeaders, status = 200, statusText = 'ok' }) => {
    // mock network status
    if (networkStatus.value === 0) {
      throw new Error('network error');
    } else if (networkStatus.value === 2) {
      await new Promise(resolve => {
        const random = 3000 + Math.random() * 2000;
        setTimeout(resolve, Math.floor(random));
      });
    }

    return {
      response: new Response(
        /^\[object (Blob|FormData|ReadableStream|URLSearchParams)\]$/i.test(Object.prototype.toString.call(body))
          ? body
          : JSON.stringify(body),
        {
          status,
          statusText
        }
      ),
      headers: new Headers(responseHeaders)
    };
  }
});

// create a alova instance
export const alova = createAlova({
  baseURL: 'http://example.com',
  statesHook: reactHook,
  requestAdapter: mockRequestAdapter,
  responded: response => response.json()
});

export const alovaIndexedDB = createAlova({
  baseURL: 'http://example.com',
  statesHook: reactHook,
  requestAdapter: mockRequestAdapter,
  responded: (response, method) => (method.meta.dataType === 'blob' ? response.blob() : response.json()),
  l2Cache: createIndexedDBAdapter()
});
