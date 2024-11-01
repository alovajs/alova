import { trueValue } from '@alova/shared';
import stringifyVData from './stringifyVData';

/**
 * Determine whether two values are equal in a way that is compatible with virtual data
 * @param prevValue Antecedent value
 * @param nextValue consequent value
 * @returns Are they equal?
 */
export default (prevValue: any, nextValue: any) => {
  // If equal, return directly
  if (prevValue === nextValue) {
    return trueValue;
  }
  return stringifyVData(prevValue) === stringifyVData(nextValue);
};
