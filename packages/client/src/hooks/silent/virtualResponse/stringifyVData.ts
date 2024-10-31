import { trueValue, undefinedValue } from '@alova/shared';
import { vDataCollectUnified } from './helper';
import { symbolVDataId } from './variables';

/**
 * 虚拟数据字符串化，如果参数不是虚拟数据则返回原数据
 * @param target 虚拟数据
 * @param returnOriginalIfNotVData 如果不是虚拟数据则返回原值
 * @returns 虚拟数据id或原数据
 */
const stringifyVData = (target: any, returnOriginalIfNotVData = trueValue) => {
  vDataCollectUnified(target);
  const vDataIdRaw = target?.[symbolVDataId];
  const vDataId = vDataIdRaw ? `[vd:${vDataIdRaw}]` : undefinedValue;
  return vDataId || (returnOriginalIfNotVData ? target : undefinedValue);
};
export default stringifyVData;

/**
 * 创建虚拟数据id收集的getter函数
 * @param valueReturnFn 返回值函数
 * @returns getter函数
 */
export function stringifyWithThis(this: any) {
  return stringifyVData(this);
}
