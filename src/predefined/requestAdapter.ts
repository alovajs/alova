import { Data } from '../Alova';

export default function requestAdapter(source: string, data: Data, config: NonNullable<Parameters<typeof fetch>[1]>) {
  return fetch(source, {
    ...config,
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}