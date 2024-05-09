import { uuid } from '@/util/helper';
import { isObject, newInstance, walkObject } from '@alova/shared/function';
import { nullValue, undefinedValue, ObjectCls, isArray, defineProperty } from '@alova/shared/vars';
import Null from './Null';
import { stringifyWithThis } from './stringifyVData';
import Undefined from './Undefined';
import { symbolOriginal, symbolVDataId } from './variables';
import { STR_VALUE_OF } from '../globalVariables';

/**
 * 创建虚拟响应数据
 * @returns 虚拟响应数据代理实例
 */
export default (structure: any, vDataId = uuid()) => {
  const transform2VData = (value: any, vDataIdInner = uuid()) => {
    if (value === nullValue) {
      value = newInstance(Null);
    } else if (value === undefinedValue) {
      value = newInstance(Undefined);
    } else {
      const newValue = ObjectCls(value);
      defineProperty(newValue, STR_VALUE_OF, stringifyWithThis);
      defineProperty(newValue, symbolOriginal, value);
      value = newValue;
    }
    defineProperty(value, symbolVDataId, vDataIdInner);
    return value;
  };

  const virtualResponse = transform2VData(structure, vDataId);
  if (isObject(virtualResponse) || isArray(virtualResponse)) {
    walkObject(virtualResponse, value => transform2VData(value));
  }
  return virtualResponse;
};
