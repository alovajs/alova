import { alova } from '.';

export const getRetryData = (params: any) => alova.Get('/retryData', { params, cacheFor: null });
