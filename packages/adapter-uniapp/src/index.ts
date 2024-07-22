import { AdapterUniappOptions } from '~/typings';
import l2CacheAdapter from './l2CacheAdapter';
import requestAdapter from './requestAdapter';
import statesHook from './statesHook';

export { default as uniappL2CacheAdapter } from './l2CacheAdapter';
export { default as uniappMockResponse } from './mockResponse';
export { default as uniappRequestAdapter } from './requestAdapter';

export default function AdapterUniapp({ mockRequest }: AdapterUniappOptions = {}) {
  return {
    statesHook,
    requestAdapter: mockRequest || requestAdapter,
    l2Cache: l2CacheAdapter
  };
}
