import { alova } from '.';

export const getRetryData = (params: any) => alova.Get<string[]>('/fruits', { params, cacheFor: null });

export const getPSCData = () => alova.Get<string[]>('/fruits');

export const captcha = (code: string, key: string) => alova.Post<'SUCCESS'>('/captcha/send', { code, key });
