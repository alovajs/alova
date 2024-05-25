import requestAdapter from '@/requestAdapter';
import storageAdapter from '@/storageAdapter';
import { AdapterTaroOptions } from '~/typings';

/**
 * 统一的taro参数配置
 * @param statesHook 状态hook
 * @param param1 options参数集合
 * @returns alova参数
 */
export default function exportedAdapter<StatesHook>(statesHook: StatesHook, { mockRequest }: AdapterTaroOptions) {
  return {
    statesHook,
    requestAdapter: mockRequest || requestAdapter,
    storageAdapter
  };
}
