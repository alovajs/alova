import { ObjectCls, nullValue, valueObject } from '@alova/shared';
import { STR_VALUE_OF } from '../globalVariables';
import { stringifyWithThis } from './stringifyVData';

interface UndefinedConstructor {
  new (vDataId?: string): UndefinedInterface;
}
interface UndefinedInterface {
  [x: string | symbol]: any;
}

/**
 * Undefined wrapper class implementation
 */
const Undefined = function Undefined(this: UndefinedInterface) {} as unknown as UndefinedConstructor;
Undefined.prototype = ObjectCls.create(nullValue, {
  [STR_VALUE_OF]: valueObject(stringifyWithThis)
});

export default Undefined;
