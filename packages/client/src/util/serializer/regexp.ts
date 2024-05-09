import { instanceOf, newInstance } from '@alova/shared/function';
import { DataSerializer } from '~/typings/general';

export default {
  forward: data => (instanceOf(data, RegExp) ? data.source : undefined),
  backward: source => newInstance(RegExp, source)
} as DataSerializer;
