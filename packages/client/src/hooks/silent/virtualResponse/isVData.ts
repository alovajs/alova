import { falseValue, regexpTest } from '@alova/shared/vars';
import stringifyVData from './stringifyVData';
import { regVDataId } from './variables';

/**
 * 判断目标数据是否为虚拟数据
 * @param target 目标数据
 * @returns 是否为虚拟数据
 */
export default (target: any) => !!stringifyVData(target, falseValue) || regexpTest(regVDataId, target);
