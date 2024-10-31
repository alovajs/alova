import { ObjectCls, nullValue, valueObject } from '@alova/shared';
import { STR_VALUE_OF } from '../globalVariables';
import { stringifyWithThis } from './stringifyVData';

interface NullConstructor {
  new (vDataId?: string): NullInterface;
}
interface NullInterface {
  [x: symbol | string]: any;
}

/**
 * Null wrapper class implementation
 */
const Null = function Null(this: NullInterface) {} as unknown as NullConstructor;
Null.prototype = ObjectCls.create(nullValue, {
  [STR_VALUE_OF]: valueObject(stringifyWithThis)
});

export default Null;
