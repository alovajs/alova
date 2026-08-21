import l2CacheAdapter from '@/l2CacheAdapter';
import requestAdapter from '@/requestAdapter';
import { AdapterTaroOptions } from '~/typings';
import { setupHooks } from './hooks';

/**
 * 统一的taro参数配置
 * @param statesHook 状态hook
 * @param param1 options参数集合
 * @returns alova参数
 */
export default function exportedAdapter<StatesHook>(statesHook: StatesHook, { mockRequest }: AdapterTaroOptions) {
  // Inject platform-specific hook configs (useSSE EventSource, useUploader file
  // selection/conversion, useAutoRequest network/focus/visibility listeners).
  setupHooks();
  return {
    statesHook,
    requestAdapter: mockRequest || requestAdapter,
    l2Cache: l2CacheAdapter
  };
}
