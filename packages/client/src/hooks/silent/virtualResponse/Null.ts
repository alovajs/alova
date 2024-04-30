import { valueObject } from '@/helper';
import { nullValue, ObjectCls, STR_VALUE_OF } from '@/helper/variables';
import { stringifyWithThis } from './stringifyVData';

interface NullConstructor {
  new (vDataId?: string): NullInterface;
}
interface NullInterface {
  [x: symbol | string]: any;
}

/**
 * Null包装类实现
 */
const Null = function (this: NullInterface) {} as unknown as NullConstructor;
Null.prototype = ObjectCls.create(nullValue, {
  [STR_VALUE_OF]: valueObject(stringifyWithThis)
});

export default Null;
