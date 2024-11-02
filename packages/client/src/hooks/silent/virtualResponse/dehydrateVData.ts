import { instanceOf, isArray, isObject, nullValue, trueValue, undefinedValue, walkObject } from '@alova/shared';
import Null from './Null';
import Undefined from './Undefined';
import { vDataCollectUnified } from './helper';
import { symbolOriginal, symbolVDataId } from './variables';

/**
 * Get original value of variable with dummy data
 * This function will also perform vData collection
 * @param target target value
 * @param deepDehydrate Whether the depth of dehydration value
 * @returns target value with primitive type
 */
export const dehydrateVDataUnified = <T>(target: T, deepDehydrate = trueValue): T => {
  const dehydrateItem = (value: any) => {
    vDataCollectUnified(value);
    if (value?.[symbolVDataId]) {
      if (instanceOf(value, Undefined)) {
        value = undefinedValue;
      } else if (instanceOf(value, Null)) {
        value = nullValue;
      } else if (instanceOf(value, Number) || instanceOf(value, String) || instanceOf(value, Boolean)) {
        value = (value as any)[symbolOriginal];
      }
    }
    return value;
  };

  const newTarget = dehydrateItem(target);
  // If it is an object or array, deep traversal is required to obtain the virtual data value.
  if (deepDehydrate && (isObject(newTarget) || isArray(newTarget))) {
    walkObject(newTarget, value => dehydrateItem(value));
  }
  return newTarget;
};

/**
 * The version above where deepDehydrate is true
 */
export default <T>(target: T): T => dehydrateVDataUnified(target);
