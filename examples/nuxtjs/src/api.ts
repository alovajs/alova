import { createAlova } from 'alova';
import VueHook from 'alova/vue';
import { createAlovaMockAdapter, defineMock } from '@alova/mock';
import GlobalFetch from 'alova/fetch';
import { xhrRequestAdapter } from '@alova/adapter-xhr';

// mock data
const mockData = defineMock({
  '/get-list': ({ query }) => {
    return ['apple', 'banana', 'orange', 'purple', query.id];
  },
});

// create a alova instance
const alovaInst = createAlova({
  baseURL: 'http://example.com',
  statesHook: VueHook,
  requestAdapter: createAlovaMockAdapter([mockData], { delay: 500 }),
  // requestAdapter: GlobalFetch(),
  responded: (response: Response) => response.json(),
  // requestAdapter: xhrRequestAdapter(),
  // responded: response => response.data
});

export const getData = (id: number) => alovaInst.Get('/get-list', {
  params: { id },
  // localCache: null
});
