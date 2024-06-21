import { instanceOf, newInstance } from '@alova/shared/function';
import { undefinedValue } from '@alova/shared/vars';
import { DataSerializer } from '~/typings/clienthook';

export default {
  forward: data => (instanceOf(data, Date) ? data.getTime() : undefinedValue),
  backward: ts => newInstance(Date, ts)
} as DataSerializer;
