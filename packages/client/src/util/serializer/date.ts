import { instanceOf, newInstance } from '@/helper';
import { undefinedValue } from '@/helper/variables';
import { DataSerializer } from '~/typings/general';

export default {
  forward: data => (instanceOf(data, Date) ? data.getTime() : undefinedValue),
  backward: ts => newInstance(Date, ts)
} as DataSerializer;
