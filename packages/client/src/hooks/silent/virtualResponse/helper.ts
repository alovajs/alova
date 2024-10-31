import { undefinedValue } from '@alova/shared';
import { vDataIdCollectBasket } from '../globalVariables';
import { symbolVDataId } from './variables';

/**
 * Unified vData collection function
 * It will be called in the following 4 places
 * 1. When accessing sub-properties
 * 2. When participating in calculation and triggering [Symbol.toPrimitive]
 * 3. When getting the id of vData
 * 4. When getting its original value
 *
 * @param returnValue Return value, if it is a function then call it
 * @returns collection function
 */
export const vDataCollectUnified = (target: any) => {
  const vDataId = target?.[symbolVDataId];
  vDataId && vDataIdCollectBasket && (vDataIdCollectBasket[vDataId] = undefinedValue);
};

export default vDataCollectUnified;

// export const vDataGetter = (key: string) => vDataCollectGetter((thisObj: any) => thisObj.__proto__[key].call(thisObj));
