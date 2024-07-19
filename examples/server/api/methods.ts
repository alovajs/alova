import { alova } from '.';

export const getRetryData = (params: any) => alova.Get<string[]>('/retryData', { params, cacheFor: null });
