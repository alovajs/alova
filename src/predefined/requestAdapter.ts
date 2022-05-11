export default function requestAdapter(
  source: string,
  data: Record<string, any> | FormData,
  config: Record<string, any>
) {
  return fetch(source, {
    ...config,
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
}