import { Data } from '../Alova';

export default function requestAdapter(source: string, data: Data, config: Record<string, any>) {
  return fetch(source, {
    ...config,
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}