import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import reactHook from 'alova/react';

export const alovaInst = createAlova({
  baseURL: 'https://jsonplaceholder.typicode.com',
  statesHook: reactHook,
  requestAdapter: adapterFetch(),
  responded: response => response.json()
});

export const todoDetail = (id: number) =>
  alovaInst.Get<{ userId: number; id: number; title: string; completed: boolean }>(`/todos/${id}`);
