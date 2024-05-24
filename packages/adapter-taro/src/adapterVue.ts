import exportedAdapter from '@/exportedAdapter';
import VueHook from 'alova/vue';
import { AdapterTaroOptions } from '~/typings';

export { default as taroStorageAdapter } from './l2CacheAdapter';
export { default as taroMockResponse } from './mockResponse';
export { default as taroRequestAdapter } from './requestAdapter';

export default function adapterVue(options: AdapterTaroOptions = {}) {
  return exportedAdapter(VueHook, options);
}
