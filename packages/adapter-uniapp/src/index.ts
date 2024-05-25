import { AdapterUniappOptions } from '~/typings';
import requestAdapter from './requestAdapter';
import statesHook from './statesHook';
import storageAdapter from './storageAdapter';

export { default as uniappMockResponse } from './mockResponse';
export { default as uniappRequestAdapter } from './requestAdapter';
export { default as uniappStorageAdapter } from './storageAdapter';

export default function AdapterUniapp({ mockRequest }: AdapterUniappOptions = {}) {
  return {
    statesHook,
    requestAdapter: mockRequest || requestAdapter,
    storageAdapter
  };
}
