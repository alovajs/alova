import { createAlovaMockAdapter, defineMock } from '@alova/mock';
import { createAlova } from 'alova';
import { VueOptionsHook } from '../src';

export const mockData = defineMock({
  '/unit-test': ({ query }) => ({
    path: '/unit-test',
    method: 'GET',
    params: query
  }),
  '/unit-test-error': () => {
    throw new Error('api error');
  }
});

// create a alova instance
export const alovaInst = createAlova({
  baseURL: 'http://example.com',
  statesHook: VueOptionsHook,
  cacheFor: null,
  requestAdapter: createAlovaMockAdapter([mockData], {
    delay: 50,
    onMockResponse(response) {
      return {
        headers: {},
        response: response.body
      };
    },
    mockRequestLogger: false
  })
});
