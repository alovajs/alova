import exportedAdapter from '@/exportedAdapter';
import ReactHook from 'alova/react';
import { AdapterTaroOptions } from '~/typings';

export { default as taroMockResponse } from './mockResponse';
export { default as taroRequestAdapter } from './requestAdapter';
export { default as taroStorageAdapter } from './storageAdapter';

export default function adapterReact(options: AdapterTaroOptions = {}) {
  return exportedAdapter(ReactHook, options);
}
