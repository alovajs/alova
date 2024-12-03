import { createAlova } from 'alova';
import SvelteHook from 'alova/svelte';
import GlobalFetch from 'alova/GlobalFetch';
import { createAlovaMockAdapter, defineMock } from '@alova/mock';

// mock data
const mockData = defineMock({
  '/get-list': ['apple', 'banana', 'orange'],
});

// create a alova instance
export const alovaInst = createAlova({
  baseURL: 'https://dummyjson.com/',
  statesHook: SvelteHook,
  // requestAdapter: GlobalFetch(),
  requestAdapter: createAlovaMockAdapter([mockData], { delay: 1500 }),
  responsed: (response: Response) => response.json(),
});

export const getData = () => alovaInst.Get<string[]>('/get-list', {
  // localCache: null,
  // transformData: ({ products }: any) => products
});
