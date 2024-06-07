import { uuid } from '@/util/helper';
import { isPlainObject, newInstance, walkObject } from '@alova/shared/function';
import { ObjectCls, defineProperty, isArray, nullValue, undefinedValue } from '@alova/shared/vars';
import { STR_VALUE_OF } from '../globalVariables';
import Null from './Null';
import Undefined from './Undefined';
import { stringifyWithThis } from './stringifyVData';
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
  if (isPlainObject(virtualResponse) || isArray(virtualResponse)) {
    walkObject(virtualResponse, value => transform2VData(value));
  }
  return virtualResponse;
};
