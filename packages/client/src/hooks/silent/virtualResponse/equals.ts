import { trueValue } from '@alova/shared';
import stringifyVData from './stringifyVData';

/**
 * 以兼容虚拟数据的方式判断两个值是否相等
 * @param prevValue 前项值
 * @param nextValue 后项值
 * @returns 是否相等
 */
export default (prevValue: any, nextValue: any) => {
  // 如果相等则直接返回
  if (prevValue === nextValue) {
    return trueValue;
  }
  return stringifyVData(prevValue) === stringifyVData(nextValue);
};
