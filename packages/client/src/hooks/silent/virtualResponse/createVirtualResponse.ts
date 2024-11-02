import {
  ObjectCls,
  defineProperty,
  isArray,
  isPlainObject,
  newInstance,
  nullValue,
  undefinedValue,
  uuid,
  walkObject
} from '@alova/shared';
import { STR_VALUE_OF } from '../globalVariables';
import Null from './Null';
import Undefined from './Undefined';
import { stringifyWithThis } from './stringifyVData';
import { symbolOriginal, symbolVDataId } from './variables';

/**
 * Create dummy response data
 * @returns Virtual response data proxy instance
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
