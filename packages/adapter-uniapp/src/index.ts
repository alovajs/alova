import { AdapterUniappOptions } from '~/typings';
import { setupHooks } from './hooks';
import l2CacheAdapter from './l2CacheAdapter';
import requestAdapter from './requestAdapter';
import statesHook from './statesHook';

export { default as uniappL2CacheAdapter } from './l2CacheAdapter';
export { default as uniappMockResponse } from './mockResponse';
export { default as uniappRequestAdapter } from './requestAdapter';
export default function AdapterUniapp({ mockRequest }: AdapterUniappOptions = {}) {
  // Inject platform-specific hook configs (useSSE EventSource, useUploader file
  // selection/conversion, useAutoRequest network/focus/visibility listeners).
  setupHooks();
  return {
    statesHook,
    requestAdapter: mockRequest || requestAdapter,
    l2Cache: l2CacheAdapter
  };
}
