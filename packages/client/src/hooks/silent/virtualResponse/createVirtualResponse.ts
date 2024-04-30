import { defineProperty, isArray, isPlainOrCustomObject, newInstance, uuid, walkObject } from '@/helper';
import { nullValue, ObjectCls, STR_VALUE_OF, undefinedValue } from '@/helper/variables';
import Null from './Null';
import { stringifyWithThis } from './stringifyVData';
import Undefined from './Undefined';
import { symbolOriginal, symbolVDataId } from './variables';

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
  if (isPlainOrCustomObject(virtualResponse) || isArray(virtualResponse)) {
    walkObject(virtualResponse, value => transform2VData(value));
  }
  return virtualResponse;
};
