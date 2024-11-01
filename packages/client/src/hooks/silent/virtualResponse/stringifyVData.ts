import { trueValue, undefinedValue } from '@alova/shared';
import { vDataCollectUnified } from './helper';
import { symbolVDataId } from './variables';

/**
 * Dummy data is stringified. If the parameter is not dummy data, the original data is returned.
 * @param target dummy data
 * @param returnOriginalIfNotVData If it is not virtual data, return the original value.
 * @returns Virtual data id or original data
 */
const stringifyVData = (target: any, returnOriginalIfNotVData = trueValue) => {
  vDataCollectUnified(target);
  const vDataIdRaw = target?.[symbolVDataId];
  const vDataId = vDataIdRaw ? `[vd:${vDataIdRaw}]` : undefinedValue;
  return vDataId || (returnOriginalIfNotVData ? target : undefinedValue);
};
export default stringifyVData;

/**
 * Create a getter function for virtual data id collection
 * @param valueReturnFn return value function
 * @returns getter function
 */
export function stringifyWithThis(this: any) {
  return stringifyVData(this);
}
