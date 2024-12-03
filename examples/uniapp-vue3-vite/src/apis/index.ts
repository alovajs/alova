import { createAlova } from 'alova'
import AdapterUniapp from '@alova/adapter-uniapp';
import mockAdapter from './mock';

export const alovaInst = createAlova({
  baseURL: 'https://betashopapi.lianlitech.cn/index.php?s=/admin',
  // baseURL: 'https://betashopapi.lianlitech.cn',
  timeout: 5000,
  ...AdapterUniapp({
    mockRequest: mockAdapter
  }),
  beforeRequest(method) {
    method.config.headers['Access-Token'] = '8e7de8e935e3a2fff52a2b9be805b058'
  },
  responded: {
    onSuccess(response) {
      const data = (response as UniNamespace.RequestSuccessCallbackResult).data as any
      if (data.status !== 200) {
        throw new Error(data.message)
      }
      return data.data;
    }
  }
});

export const userinfo = () => alovaInst.Get('/passport/userinfo', {
  transform(data, headers) {
    console.log('transformData', data, headers);
    return data;
  }
});

export const detail = () => alovaInst.Get<{ id: number }>('/detail');


export const detail2 = () => alovaInst.Post<{ id: number }>('/detail', {}, {
  responseType: 'arrayBuffer'
});