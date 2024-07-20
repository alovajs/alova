import { alova } from '.';

export const getRetryData = (params: any) => alova.Get<string[]>('/fruits', { params, cacheFor: null });

export const getPSCData = () => alova.Get<string[]>('/fruits');
