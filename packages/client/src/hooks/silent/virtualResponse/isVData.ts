import { falseValue, regexpTest } from '@alova/shared';
import stringifyVData from './stringifyVData';
import { regVDataId } from './variables';

/**
 * Determine whether the target data is virtual data
 * @param target target data
 * @returns Is it virtual data?
 */
export default (target: any) => !!stringifyVData(target, falseValue) || regexpTest(regVDataId, target);
