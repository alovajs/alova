import { instanceOf, newInstance, undefinedValue } from '@alova/shared';
import { DataSerializer } from '~/typings/clienthook';

export default {
  forward: data => (instanceOf(data, Date) ? data.getTime() : undefinedValue),
  backward: ts => newInstance(Date, ts)
} as DataSerializer;
